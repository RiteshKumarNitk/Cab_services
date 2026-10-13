import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";
import { eventBus, createEvent } from "@/lib/event-bus";

import { FINANCE_ROLES, FINANCE_READ_ROLES, hasRole } from "@/lib/authz";
import { recalculateBookingPayment, recalculateInvoicePaid } from "@/lib/finance";

const READ_ROLES = FINANCE_READ_ROLES;
const PAYMENT_TYPES = ["ADVANCE", "FULL", "INSTALLMENT", "REFUND", "SECURITY_DEPOSIT"];
const PAYMENT_METHODS = ["CASH", "COMPANY", "ONLINE"];
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, READ_ROLES)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const pp = parsePageParams(searchParams);
  const bookingId = searchParams.get("bookingId");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (bookingId) where.bookingId = bookingId;
  if (type) where.type = type;

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    skip: pp.skip,
    take: pp.take,
    include: {
      booking: { select: { bookingNumber: true, customer: { select: { name: true } } } },
      receivedBy: { select: { name: true } },
    },
  });

  return listResponse("payments", payments, pp, () => prisma.payment.count({ where }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const amount = Number(body.amount);
    const type = body.type || "ADVANCE";
    const method = body.method || "CASH";
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (!PAYMENT_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${PAYMENT_TYPES.join(", ")}` }, { status: 400 });
    }
    if (!PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ error: `Invalid method. Must be one of: ${PAYMENT_METHODS.join(", ")}` }, { status: 400 });
    }

    // Derive the customer from the booking / invoice rather than trusting the client.
    const bookingId: string | null = body.bookingId || null;
    const invoiceId: string | null = body.invoiceId || null;
    const booking = bookingId
      ? await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true, customerId: true } })
      : null;
    if (bookingId && !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const invoice = invoiceId
      ? await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true, bookingId: true, customerId: true, status: true } })
      : null;
    if (invoiceId && !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice && bookingId && invoice.bookingId && invoice.bookingId !== bookingId) {
      return NextResponse.json({ error: "Invoice does not belong to this booking" }, { status: 400 });
    }
    if (invoice?.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot record a payment against a cancelled invoice" }, { status: 400 });
    }
    const customerId = booking?.customerId ?? invoice?.customerId ?? (body.customerId || null);

    // Guard against accidental double submission (double click / retry):
    // an identical payment recorded by the same user in the last 2 minutes is returned instead of duplicated.
    const duplicate = await prisma.payment.findFirst({
      where: {
        bookingId, invoiceId, amount, type, method,
        reference: body.reference || null,
        receivedById: session.user.id,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
    });
    if (duplicate) {
      return NextResponse.json({ ...duplicate, duplicate: true }, { status: 200 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          bookingId,
          invoiceId,
          customerId,
          type,
          amount,
          method,
          reference: body.reference || null,
          notes: body.notes || null,
          receivedById: session.user.id,
        },
      });

      // Keep the invoice balance and the booking's payment status derived from actual recorded payments.
      if (invoiceId) await recalculateInvoicePaid(tx, invoiceId);
      if (bookingId) await recalculateBookingPayment(tx, bookingId);
      return payment;
    });

    eventBus.emit(createEvent("PAYMENT_RECEIVED", {
      paymentId: payment.id,
      bookingId,
      customerId,
      amount,
      type,
    }, { userId: session.user.id }));

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
