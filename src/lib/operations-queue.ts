import { prisma } from "./prisma";
import { checkVehicleAvailability, type Db } from "./vehicle-availability";
import { checkDriverAvailability } from "./driver-availability";
import { eventBus, createEvent } from "./event-bus";
import { generateTripOtp } from "./booking-lifecycle";
import type { BookingStatus, DispatchStatus } from "@prisma/client";

/** Error with an HTTP status, raised by dispatch operations and mapped by the API routes. */
export class DispatchError extends Error {
  constructor(message: string, public status: 400 | 404 | 409 = 400) {
    super(message);
  }
}

// Booking statuses from which the vehicle/driver may still be (re)assigned.
const ASSIGNABLE_BOOKING_STATUSES = [
  "BOOKING_CONFIRMED", "WAITING_ASSIGNMENT", "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED", "CONFIRMED",
];

const TX_OPTIONS = { timeout: 20000, maxWait: 10000 };

/** Serialize concurrent operations on the same resource for the rest of the transaction. */
async function lock(tx: Db, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

function dispatchStatusFor(vehicleId: string | null, driverId: string | null): DispatchStatus {
  if (vehicleId && driverId) return "READY";
  if (driverId) return "DRIVER_ASSIGNING";
  if (vehicleId) return "VEHICLE_ASSIGNING";
  return "PENDING";
}

async function loadAssignableDispatch(tx: Db, dispatchId: string) {
  const dispatch = await tx.dispatch.findUnique({
    where: { id: dispatchId },
    include: { booking: true },
  });
  if (!dispatch) throw new DispatchError("Dispatch not found", 404);
  if (dispatch.status === "DISPATCHED") {
    throw new DispatchError("Booking has already been dispatched", 409);
  }
  if (!ASSIGNABLE_BOOKING_STATUSES.includes(dispatch.booking.status)) {
    throw new DispatchError(`Booking is ${dispatch.booking.status} and cannot be assigned`, 409);
  }
  return dispatch;
}

export async function createDispatchEntry(bookingId: string, assignedById: string) {
  const existing = await prisma.dispatch.findUnique({ where: { bookingId } });
  if (existing) return existing;

  return prisma.dispatch.create({
    data: {
      bookingId,
      status: "PENDING",
      assignedById,
    },
  });
}

export async function assignVehicleToDispatch(
  dispatchId: string,
  vehicleId: string,
  checkedById: string
) {
  const { updated, bookingId, previousStatus } = await prisma.$transaction(async (tx) => {
    await lock(tx, `vehicle:${vehicleId}`);
    await lock(tx, `dispatch:${dispatchId}`);
    const dispatch = await loadAssignableDispatch(tx, dispatchId);
    const { booking } = dispatch;

    const availability = await checkVehicleAvailability(
      vehicleId, booking.pickupDate, booking.returnDate || undefined, booking.id, tx
    );
    if (!availability.available) {
      throw new DispatchError(availability.reason || "Vehicle unavailable");
    }

    const updated = await tx.dispatch.update({
      where: { id: dispatchId },
      data: {
        vehicleId,
        vehicleCheckStatus: "CLEARED",
        vehicleCheckedById: checkedById,
        vehicleCheckedAt: new Date(),
        status: dispatchStatusFor(vehicleId, dispatch.driverId),
      },
    });

    // Reserve the vehicle on the booking immediately so overlap checks see it.
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        vehicleId,
        status: (dispatch.driverId ? "DRIVER_ASSIGNED" : "VEHICLE_ASSIGNED") as BookingStatus,
      },
    });

    return { updated, bookingId: booking.id, previousStatus: booking.status };
  }, TX_OPTIONS);

  eventBus.emit(createEvent("VEHICLE_ASSIGNED", { bookingId, dispatchId, vehicleId }, { userId: checkedById }));
  eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", {
    bookingId, newStatus: updated.driverId ? "DRIVER_ASSIGNED" : "VEHICLE_ASSIGNED", previousStatus,
  }, { userId: checkedById }));

  return updated;
}

export async function assignDriverToDispatch(
  dispatchId: string,
  driverId: string,
  assignedById: string
) {
  const { updated, bookingId, previousStatus } = await prisma.$transaction(async (tx) => {
    await lock(tx, `driver:${driverId}`);
    await lock(tx, `dispatch:${dispatchId}`);
    const dispatch = await loadAssignableDispatch(tx, dispatchId);
    const { booking } = dispatch;

    // Spec §8.2: the vehicle is checked and assigned before the driver.
    if (!dispatch.vehicleId) {
      throw new DispatchError("Assign a vehicle before assigning a driver");
    }

    const availability = await checkDriverAvailability(
      driverId, booking.pickupDate, booking.returnDate || undefined,
      { excludeBookingId: booking.id, pickupTime: booking.pickupTime }, tx
    );
    if (!availability.available) {
      throw new DispatchError(availability.reason || "Driver unavailable");
    }

    const updated = await tx.dispatch.update({
      where: { id: dispatchId },
      data: {
        driverId,
        driverCheckStatus: "ASSIGNED",
        driverAssignedById: assignedById,
        driverAssignedAt: new Date(),
        status: dispatchStatusFor(dispatch.vehicleId, driverId),
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: { driverId, status: "DRIVER_ASSIGNED" },
    });

    return { updated, bookingId: booking.id, previousStatus: booking.status };
  }, TX_OPTIONS);

  eventBus.emit(createEvent("DRIVER_ASSIGNED", { bookingId, dispatchId, driverId }, { userId: assignedById }));
  eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", {
    bookingId, newStatus: "DRIVER_ASSIGNED", previousStatus,
  }, { userId: assignedById }));

  return updated;
}

/**
 * Create the Trip for a fully assigned dispatch. This is the ONLY place a Trip is created.
 * Idempotent: finalizing an already dispatched booking returns the existing trip with `created: false`.
 */
export async function finalizeDispatch(dispatchId: string, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    await lock(tx, `dispatch:${dispatchId}`);
    const dispatch = await tx.dispatch.findUnique({
      where: { id: dispatchId },
      include: { booking: { include: { trip: true } } },
    });
    if (!dispatch) throw new DispatchError("Dispatch not found", 404);

    if (dispatch.status === "DISPATCHED" || dispatch.booking.trip) {
      if (!dispatch.booking.trip) throw new DispatchError("Dispatch is marked dispatched but has no trip", 409);
      return { trip: dispatch.booking.trip, created: false as const, previousStatus: dispatch.booking.status };
    }

    if (!dispatch.vehicleId || !dispatch.driverId) {
      throw new DispatchError("Both vehicle and driver must be assigned before dispatch");
    }
    if (!ASSIGNABLE_BOOKING_STATUSES.includes(dispatch.booking.status)) {
      throw new DispatchError(`Booking is ${dispatch.booking.status} and cannot be dispatched`, 409);
    }

    // Re-validate: documents may have expired or leave been approved since assignment.
    const { booking } = dispatch;
    const [vehicleCheck, driverCheck] = await Promise.all([
      checkVehicleAvailability(dispatch.vehicleId, booking.pickupDate, booking.returnDate || undefined, booking.id, tx),
      checkDriverAvailability(dispatch.driverId, booking.pickupDate, booking.returnDate || undefined,
        { excludeBookingId: booking.id, pickupTime: booking.pickupTime }, tx),
    ]);
    if (!vehicleCheck.available) throw new DispatchError(vehicleCheck.reason || "Vehicle unavailable");
    if (!driverCheck.available) throw new DispatchError(driverCheck.reason || "Driver unavailable");

    const trip = await tx.trip.create({
      data: {
        tripNumber: `TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        bookingId: booking.id,
        status: "SCHEDULED",
        vehicleId: dispatch.vehicleId,
        driverId: dispatch.driverId,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupLat: booking.pickupLat,
        pickupLng: booking.pickupLng,
        dropLat: booking.dropLat,
        dropLng: booking.dropLng,
        scheduledPickupTime: booking.pickupDate,
        otp: generateTripOtp(),
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        vehicleId: dispatch.vehicleId,
        driverId: dispatch.driverId,
        status: "READY_FOR_DISPATCH",
      },
    });

    await tx.dispatch.update({
      where: { id: dispatchId },
      data: { status: "DISPATCHED" },
    });

    return { trip, created: true as const, previousStatus: booking.status };
  }, TX_OPTIONS);

  if (result.created) {
    eventBus.emit(createEvent("DISPATCH_FINALIZED", {
      bookingId: result.trip.bookingId, dispatchId, tripId: result.trip.id,
    }, { userId }));
    eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", {
      bookingId: result.trip.bookingId,
      newStatus: "READY_FOR_DISPATCH",
      previousStatus: result.previousStatus,
    }, { userId }));
  }

  return result;
}

export async function getOperationsQueue() {
  const dispatches = await prisma.dispatch.findMany({
    where: { status: { not: "DISPATCHED" } },
    orderBy: { createdAt: "asc" },
    include: {
      booking: {
        include: {
          customer: { select: { id: true, name: true, phone: true } },
        },
      },
      vehicle: { select: { id: true, name: true, plateNumber: true } },
      driver: { select: { id: true, name: true } },
    },
  });

  const queued = await prisma.booking.count({
    where: { status: "WAITING_ASSIGNMENT" },
  });

  return { dispatches, queued, total: dispatches.length };
}

export async function getOperationsDashboard() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    todaysPickups,
    todaysDropoffs,
    vehiclesFree,
    vehiclesBusy,
    driversFree,
    driversBusy,
    awaitingAssignment,
    tripsRunning,
    delayedTrips,
    cancelledToday,
  ] = await Promise.all([
    prisma.booking.count({
      where: { pickupDate: { gte: todayStart, lte: todayEnd }, status: { notIn: ["CANCELLED", "CLOSED"] } },
    }),
    prisma.booking.count({
      where: { status: { in: ["TRIP_STARTED", "PICKUP_COMPLETED", "DROP_COMPLETED"] } },
    }),
    prisma.vehicle.count({ where: { status: "AVAILABLE", isActive: true } }),
    prisma.vehicle.count({ where: { status: "BOOKED", isActive: true } }),
    prisma.user.count({
      where: { role: "DRIVER", isActive: true, driverStatus: { online: true } },
    }),
    prisma.user.count({
      where: { role: "DRIVER", isActive: true, driverStatus: { online: false } },
    }),
    prisma.booking.count({ where: { status: "WAITING_ASSIGNMENT" } }),
    prisma.trip.count({ where: { status: { in: ["IN_PROGRESS", "PICKED_UP", "REACHED_PICKUP"] } } }),
    prisma.booking.count({
      where: {
        status: { in: ["TRIP_STARTED", "PICKUP_COMPLETED", "DROP_COMPLETED"] },
        updatedAt: { lte: new Date(Date.now() - 30 * 60 * 1000) }, // No update in 30min = delayed
      },
    }),
    prisma.booking.count({
      where: { status: "CANCELLED", updatedAt: { gte: todayStart, lte: todayEnd } },
    }),
  ]);

  return {
    todaysPickups,
    todaysDropoffs,
    vehiclesFree,
    vehiclesBusy,
    driversFree,
    driversBusy,
    awaitingAssignment,
    tripsRunning,
    delayedTrips,
    cancelledToday,
    refreshedAt: now,
  };
}
