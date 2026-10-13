import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventBus, createEvent } from "@/lib/event-bus";
import { checkTransition, requiresStartOtp, TRIP_STATUS_FOR_BOOKING } from "@/lib/booking-lifecycle";
import { getCustomerFacingStatus, getCustomerTimeline } from "@/lib/customer-timeline";
import { ensureInvoiceOnCompletion, planAutoInvoice, type AutoInvoiceResult } from "@/lib/invoicing";
import type { BookingStatus, TripStatus } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const newStatus = typeof body.status === "string" ? body.status : "";
    const reason = typeof body.reason === "string" ? body.reason : null;
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const userId = session.user.id;
    const role = session.user.role;

    if (!newStatus) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id }, include: { trip: true, quotation: true } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const check = checkTransition({ role, userId, booking }, newStatus);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    // A trip can only start if Dispatch created it (spec §4 Workflow B step 9).
    if (newStatus === "TRIP_STARTED" && !booking.trip) {
      return NextResponse.json({ error: "Booking has not been dispatched yet" }, { status: 400 });
    }

    // Customer OTP is verified on the server, never in the browser.
    // Trips dispatched before OTPs were generated have no OTP and are allowed through.
    if (requiresStartOtp(role, newStatus) && booking.trip?.otp && booking.trip.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP. Ask the customer for the trip OTP." }, { status: 400 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "TRIP_STARTED" || newStatus === "STARTED") updateData.startTime = now;
    if (newStatus === "TRIP_COMPLETED" || newStatus === "COMPLETED") updateData.endTime = now;

    const tripStatus = TRIP_STATUS_FOR_BOOKING[newStatus] as TripStatus | undefined;
    const tripData: Record<string, unknown> = {};
    if (tripStatus) tripData.status = tripStatus;
    if (newStatus === "PICKUP_COMPLETED") tripData.actualPickupTime = now;
    if (newStatus === "DROP_COMPLETED") tripData.actualDropTime = now;

    // Spec §9: completing the trip generates the invoice from the approved quotation, in the same
    // transaction. Amounts are computed here on the server; nothing comes from the client.
    const completing = newStatus === "TRIP_COMPLETED";
    const invoicePlan = completing
      ? planAutoInvoice({ bookingTotalFare: booking.totalFare, quotation: booking.quotation })
      : null;

    const { updated, autoInvoice } = await prisma.$transaction(async (tx) => {
      let autoInvoice: AutoInvoiceResult | null = null;
      // Optimistic concurrency: only update if the status has not changed since we read it.
      const res = await tx.booking.updateMany({
        where: { id, status: booking.status },
        data: updateData as { status: BookingStatus },
      });
      if (res.count === 0) {
        throw new ConflictError("Booking status changed in the meantime. Refresh and try again.");
      }

      if (newStatus === "CANCELLED") {
        await tx.cancellation.create({
          data: { bookingId: id, cancelledById: userId, reason },
        });
      }

      if (booking.trip && Object.keys(tripData).length > 0) {
        await tx.trip.update({ where: { id: booking.trip.id }, data: tripData });
      }

      if (completing && invoicePlan) {
        // Reuses an existing active invoice untouched; a DB error here rolls the completion back.
        autoInvoice = await ensureInvoiceOnCompletion(tx, booking, invoicePlan);
        if (autoInvoice.status !== "skipped") {
          await tx.booking.update({ where: { id }, data: { status: "INVOICE_GENERATED" } });
        }
      }

      const updated = await tx.booking.findUniqueOrThrow({
        where: { id },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          driver: { select: { id: true, name: true, phone: true } },
          vehicle: true,
        },
      });
      return { updated, autoInvoice };
    }, { timeout: 20000, maxWait: 10000 });

    // Emit events after commit (notifications, audit log, webhooks are subscribers).
    const meta = { userId };
    eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", {
      bookingId: id, newStatus, previousStatus: booking.status, userId,
    }, meta));
    if (newStatus === "TRIP_STARTED") eventBus.emit(createEvent("TRIP_STARTED", { bookingId: id, tripId: booking.trip?.id }, meta));
    if (newStatus === "TRIP_COMPLETED") eventBus.emit(createEvent("TRIP_COMPLETED", { bookingId: id, tripId: booking.trip?.id }, meta));
    if (newStatus === "CANCELLED") eventBus.emit(createEvent("BOOKING_CANCELLED", { bookingId: id, reason }, meta));
    if (autoInvoice?.status === "created") {
      eventBus.emit(createEvent("INVOICE_GENERATED", {
        invoiceId: autoInvoice.invoiceId, invoiceNumber: autoInvoice.invoiceNumber, bookingId: id,
        customerId: booking.customerId, total: autoInvoice.total, auto: true,
      }, meta));
    }
    if (autoInvoice && autoInvoice.status !== "skipped") {
      eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", {
        bookingId: id, newStatus: "INVOICE_GENERATED", previousStatus: "TRIP_COMPLETED", userId,
      }, meta));
    }
    if (autoInvoice?.status === "skipped") {
      // Actionable for finance: the trip is complete but needs a manual invoice.
      eventBus.emit(createEvent("INVOICE_SKIPPED", { bookingId: id, reason: autoInvoice.reason }, meta));
    }

    return NextResponse.json({
      ...updated,
      customerFacingStatus: getCustomerFacingStatus(updated.status),
      timeline: getCustomerTimeline(updated.status),
      ...(autoInvoice ? { autoInvoice: autoInvoice.status === "skipped"
        ? { status: "skipped", reason: autoInvoice.reason }
        : { status: autoInvoice.status, invoiceNumber: autoInvoice.invoiceNumber } } : {}),
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

class ConflictError extends Error {}
