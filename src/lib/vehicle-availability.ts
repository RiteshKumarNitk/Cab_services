import { prisma } from "./prisma";
import { ACTIVE_ASSIGNMENT_STATUSES, bookingWindow } from "./booking-lifecycle";
import type { BookingStatus, Prisma } from "@prisma/client";

/** Prisma client or interactive-transaction client. */
export type Db = Prisma.TransactionClient;

export interface VehicleAvailabilityCheck {
  available: boolean;
  reason?: string;
  checks: {
    booked: boolean;
    maintenance: boolean;
    insuranceValid: boolean;
    fitnessValid: boolean;
    permitValid: boolean;
    rcValid: boolean;
  };
}

/** Bookings (other than `excludeBookingId`) whose assignment window overlaps [start, end]. */
export function overlappingBookingsWhere(
  window: { start: Date; end: Date },
  excludeBookingId?: string
): Prisma.BookingWhereInput {
  return {
    ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    status: { in: ACTIVE_ASSIGNMENT_STATUSES as BookingStatus[] },
    pickupDate: { lte: window.end },
    OR: [
      { returnDate: null, pickupDate: { gte: window.start } },
      { returnDate: { gte: window.start } },
    ],
  };
}

export async function checkVehicleAvailability(
  vehicleId: string,
  pickupDate: Date,
  dropDate?: Date,
  excludeBookingId?: string,
  db: Db = prisma
): Promise<VehicleAvailabilityCheck> {
  const window = bookingWindow(pickupDate, dropDate);

  const vehicle = await db.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      maintenance: {
        where: {
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          scheduledDate: { lte: window.end },
        },
      },
    },
  });

  if (!vehicle || !vehicle.isActive || vehicle.status === "INACTIVE") {
    return {
      available: false,
      reason: vehicle ? "Vehicle unavailable: inactive" : "Vehicle not found",
      checks: { booked: true, maintenance: true, insuranceValid: true, fitnessValid: true, permitValid: true, rcValid: true },
    };
  }

  // Check 1: Other bookings holding this vehicle in an overlapping window,
  // including dispatches where the vehicle is assigned but not yet dispatched.
  const [conflictingBookings, conflictingDispatches] = await Promise.all([
    db.booking.count({ where: { vehicleId, ...overlappingBookingsWhere(window, excludeBookingId) } }),
    db.dispatch.count({
      where: {
        vehicleId,
        status: { not: "DISPATCHED" },
        booking: overlappingBookingsWhere(window, excludeBookingId),
      },
    }),
  ]);
  const isBooked = conflictingBookings + conflictingDispatches > 0;

  // Check 2: Scheduled maintenance
  const hasMaintenance = vehicle.maintenance.length > 0 || vehicle.status === "MAINTENANCE";

  // Checks 3-6: documents must be valid for the whole trip, not just today
  const validThrough = (expiry: Date | null) => !expiry || expiry > window.end;
  const insuranceValid = validThrough(vehicle.insuranceExpiry);
  const fitnessValid = validThrough(vehicle.fitnessExpiry);
  const permitValid = validThrough(vehicle.permitExpiry);
  const rcValid = validThrough(vehicle.rcExpiry);

  const failedChecks: string[] = [];
  if (isBooked) failedChecks.push("already booked");
  if (hasMaintenance) failedChecks.push("under maintenance");
  if (!insuranceValid) failedChecks.push("insurance expired");
  if (!fitnessValid) failedChecks.push("fitness expired");
  if (!permitValid) failedChecks.push("permit expired");
  if (!rcValid) failedChecks.push("registration expired");

  const available = failedChecks.length === 0;

  return {
    available,
    reason: available ? undefined : `Vehicle unavailable: ${failedChecks.join(", ")}`,
    checks: {
      booked: isBooked,
      maintenance: hasMaintenance,
      insuranceValid,
      fitnessValid,
      permitValid,
      rcValid,
    },
  };
}

export async function findAvailableVehicles(
  pickupDate: Date,
  dropDate?: Date,
  vehicleType?: string,
  excludeBookingId?: string
) {
  const whereVehicle: Record<string, unknown> = {
    isActive: true,
    status: { notIn: ["INACTIVE", "MAINTENANCE"] },
  };
  if (vehicleType) whereVehicle.type = vehicleType;

  const vehicles = await prisma.vehicle.findMany({ where: whereVehicle });

  const results = [];

  for (const vehicle of vehicles) {
    const availability = await checkVehicleAvailability(vehicle.id, pickupDate, dropDate, excludeBookingId);
    if (availability.available) {
      results.push({
        id: vehicle.id,
        name: vehicle.name,
        plateNumber: vehicle.plateNumber,
        type: vehicle.type,
        seats: vehicle.seats,
        pricePerKm: vehicle.pricePerKm,
        driverId: vehicle.driverId,
      });
    }
  }

  return { vehicles: results, total: results.length, checkedAt: new Date() };
}
