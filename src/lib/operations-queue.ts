import { prisma } from "./prisma";
import { checkVehicleAvailability, findAvailableVehicles } from "./vehicle-availability";
import { checkDriverAvailability, findAvailableDrivers } from "./driver-availability";
import { eventBus, createEvent } from "./event-bus";

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
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: dispatchId },
    include: { booking: true },
  });
  if (!dispatch) throw new Error("Dispatch not found");

  const pickupDate = dispatch.booking.pickupDate;
  const dropDate = dispatch.booking.returnDate || undefined;

  const availability = await checkVehicleAvailability(vehicleId, pickupDate, dropDate);
  if (!availability.available) {
    throw new Error(availability.reason || "Vehicle unavailable");
  }

  return prisma.dispatch.update({
    where: { id: dispatchId },
    data: {
      vehicleId,
      vehicleCheckStatus: "CLEARED",
      vehicleCheckedById: checkedById,
      vehicleCheckedAt: new Date(),
      status: "VEHICLE_ASSIGNING",
    },
  });
}

export async function assignDriverToDispatch(
  dispatchId: string,
  driverId: string,
  assignedById: string
) {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: dispatchId },
    include: { booking: true },
  });
  if (!dispatch) throw new Error("Dispatch not found");

  const pickupDate = dispatch.booking.pickupDate;
  const dropDate = dispatch.booking.returnDate || undefined;

  const availability = await checkDriverAvailability(driverId, pickupDate, dropDate);
  if (!availability.available) {
    throw new Error(availability.reason || "Driver unavailable");
  }

  const updated = await prisma.dispatch.update({
    where: { id: dispatchId },
    data: {
      driverId,
      driverCheckStatus: "ASSIGNED",
      driverAssignedById: assignedById,
      driverAssignedAt: new Date(),
      status: "DRIVER_ASSIGNING",
    },
  });

  // Update booking with driver
  await prisma.booking.update({
    where: { id: dispatch.bookingId },
    data: { driverId },
  });

  return updated;
}

export async function finalizeDispatch(dispatchId: string, userId: string) {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: dispatchId },
    include: { booking: true },
  });
  if (!dispatch) throw new Error("Dispatch not found");
  if (!dispatch.vehicleId || !dispatch.driverId) {
    throw new Error("Both vehicle and driver must be assigned before dispatch");
  }

  // Create the trip ONLY when dispatch is finalized
  const trip = await prisma.trip.create({
    data: {
      tripNumber: `TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      bookingId: dispatch.bookingId,
      status: "SCHEDULED",
      vehicleId: dispatch.vehicleId,
      driverId: dispatch.driverId,
      pickupAddress: dispatch.booking.pickupAddress,
      dropAddress: dispatch.booking.dropAddress,
      scheduledPickupTime: dispatch.booking.pickupDate,
    },
  });

  // Update booking to READY_FOR_DISPATCH
  await prisma.booking.update({
    where: { id: dispatch.bookingId },
    data: {
      vehicleId: dispatch.vehicleId,
      driverId: dispatch.driverId,
      status: "READY_FOR_DISPATCH",
    },
  });

  // Mark dispatch as done
  await prisma.dispatch.update({
    where: { id: dispatchId },
    data: { status: "DISPATCHED" },
  });

  eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", {
    bookingId: dispatch.bookingId,
    newStatus: "READY_FOR_DISPATCH",
  }));

  return trip;
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
