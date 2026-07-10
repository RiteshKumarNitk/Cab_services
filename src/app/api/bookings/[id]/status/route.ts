import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventBus, createEvent } from "@/lib/event-bus";

// Business process statuses (Sales → Operations → Execution)
const validTransitions: Record<string, string[]> = {
  // --- Sales Pipeline ---
  NEW_LEAD: ["QUALIFIED", "CANCELLED"],
  QUALIFIED: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["QUOTE_PREPARING", "CANCELLED"],
  QUOTE_PREPARING: ["QUOTE_SENT", "CANCELLED"],
  QUOTE_SENT: ["QUOTE_ACCEPTED", "CANCELLED"],
  QUOTE_ACCEPTED: ["BOOKING_CONFIRMED", "CANCELLED"],

  // --- Operations Pipeline ---
  BOOKING_CONFIRMED: ["WAITING_ASSIGNMENT", "CANCELLED"],
  WAITING_ASSIGNMENT: ["VEHICLE_ASSIGNED", "CANCELLED"],
  VEHICLE_ASSIGNED: ["DRIVER_ASSIGNED", "CANCELLED"],
  DRIVER_ASSIGNED: ["READY_FOR_DISPATCH", "CANCELLED"],

  // --- Trip Execution ---
  READY_FOR_DISPATCH: ["TRIP_STARTED", "CANCELLED"],
  TRIP_STARTED: ["PICKUP_COMPLETED", "CANCELLED"],
  PICKUP_COMPLETED: ["DROP_COMPLETED", "CANCELLED"],
  DROP_COMPLETED: ["TRIP_COMPLETED", "CANCELLED"],

  // --- Closure ---
  TRIP_COMPLETED: ["INVOICE_GENERATED"],
  INVOICE_GENERATED: ["CLOSED"],

  // Terminal
  CLOSED: [],
  CANCELLED: [],

  // Legacy mappings (for backward compat)
  PENDING: ["PRICE_SENT", "CANCELLED"],
  PRICE_SENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["WAITING_ASSIGNMENT", "CANCELLED"],
  VEHICLE_READY: ["TRIP_STARTED", "CANCELLED"],
  REQUESTED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["TRIP_STARTED", "CANCELLED"],
  STARTED: ["PICKUP_COMPLETED", "CANCELLED"],
  COMPLETED: ["INVOICE_GENERATED"],
};

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "FLEET_MANAGER", "DRIVER_MANAGER"];

// Statuses that require manager role to set
const MANAGER_ONLY_SOURCES = [
  "NEW_LEAD", "QUALIFIED", "QUOTE_PREPARING", "QUOTE_SENT",
  "PENDING", "PRICE_SENT",
  "BOOKING_CONFIRMED", "WAITING_ASSIGNMENT", "VEHICLE_ASSIGNED",
  "DRIVER_ASSIGNED", "READY_FOR_DISPATCH",
];

// Customer-facing status mapping (hide internal ops statuses)
const CUSTOMER_TIMELINE: Record<string, { label: string; order: number }> = {
  NEW_LEAD: { label: "Request Submitted", order: 1 },
  QUALIFIED: { label: "Being Reviewed", order: 2 },
  QUOTE_PREPARING: { label: "Quotation Being Prepared", order: 3 },
  QUOTE_SENT: { label: "Quotation Ready", order: 4 },
  QUOTE_ACCEPTED: { label: "Waiting Your Approval", order: 5 },
  BOOKING_CONFIRMED: { label: "Confirmed", order: 6 },
  WAITING_ASSIGNMENT: { label: "Confirmed", order: 6 },
  VEHICLE_ASSIGNED: { label: "Vehicle Assigned", order: 7 },
  DRIVER_ASSIGNED: { label: "Driver Assigned", order: 8 },
  READY_FOR_DISPATCH: { label: "Trip Ready", order: 9 },
  TRIP_STARTED: { label: "Trip Started", order: 10 },
  PICKUP_COMPLETED: { label: "In Progress", order: 11 },
  DROP_COMPLETED: { label: "In Progress", order: 11 },
  TRIP_COMPLETED: { label: "Completed", order: 12 },
  CANCELLED: { label: "Cancelled", order: 99 },
  CLOSED: { label: "Closed", order: 13 },
};

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
    const { status: newStatus, reason, vehicleId, driverId } = await req.json();
    const userId = session.user.id;
    const role = session.user.role;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate permissions
    if (role === "CUSTOMER" && booking.customerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (role === "DRIVER" && booking.driverId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Restrict manager-only transitions
    if (MANAGER_ONLY_SOURCES.includes(booking.status) && !MANAGER_ROLES.includes(role)) {
      return NextResponse.json({ error: "Only managers can perform this action" }, { status: 403 });
    }

    // Validate state transitions
    const allowedNext = validTransitions[booking.status] || [];
    if (!allowedNext.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    // Set timestamps on relevant transitions
    if (newStatus === "TRIP_STARTED" || newStatus === "STARTED") {
      updateData.startTime = new Date();
    } else if (newStatus === "TRIP_COMPLETED" || newStatus === "COMPLETED" || newStatus === "DROP_COMPLETED") {
      updateData.endTime = new Date();
    } else if (newStatus === "CANCELLED") {
      await prisma.cancellation.create({
        data: {
          bookingId: id,
          cancelledById: userId,
          reason: reason || null,
        },
      });
    }

    // When vehicle is assigned, update booking
    if ((newStatus === "VEHICLE_ASSIGNED" || newStatus === "DRIVER_ASSIGNED") && vehicleId) {
      updateData.vehicleId = vehicleId;
    }

    // When driver is assigned, update booking
    if (newStatus === "DRIVER_ASSIGNED" && driverId) {
      updateData.driverId = driverId;
    }

    // When driver accepts via mobile and no vehicle assigned, auto-assign their vehicle
    if ((newStatus === "ACCEPTED" || newStatus === "READY_FOR_DISPATCH") && role === "DRIVER" && !booking.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { driverId: userId, isActive: true },
      });
      if (vehicle) {
        updateData.vehicleId = vehicle.id;
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        vehicle: true,
      },
    });

    // Emit event (decoupled from notification delivery)
    eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", {
      bookingId: id,
      newStatus,
      previousStatus: booking.status,
      userId,
    }, { userId }));

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
