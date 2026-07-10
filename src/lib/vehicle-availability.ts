import { prisma } from "./prisma";

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

export async function checkVehicleAvailability(
  vehicleId: string,
  pickupDate: Date,
  dropDate?: Date
): Promise<VehicleAvailabilityCheck> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      maintenance: {
        where: {
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          scheduledDate: { lte: dropDate || pickupDate },
        },
      },
    },
  });

  if (!vehicle) {
    return {
      available: false,
      reason: "Vehicle not found",
      checks: { booked: true, maintenance: true, insuranceValid: true, fitnessValid: true, permitValid: true, rcValid: true },
    };
  }

  const endDate = dropDate || pickupDate;

  // Check 1: Existing bookings in same timeframe
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      vehicleId,
      status: { notIn: ["CANCELLED", "CLOSED", "TRIP_COMPLETED"] },
      OR: [
        { pickupDate: { gte: pickupDate, lte: endDate } },
        { pickupDate: { lte: pickupDate }, returnDate: { gte: pickupDate } },
      ],
    },
  });
  const isBooked = conflictingBookings.length > 0;

  // Check 2: Scheduled maintenance
  const hasMaintenance = vehicle.maintenance.length > 0;

  // Check 3: Insurance
  const insuranceValid = !vehicle.insuranceExpiry || vehicle.insuranceExpiry > new Date();

  // Check 4: Fitness
  const fitnessValid = !vehicle.fitnessExpiry || vehicle.fitnessExpiry > new Date();

  // Check 5: Permit
  const permitValid = !vehicle.permitExpiry || vehicle.permitExpiry > new Date();

  // Check 6: RC
  const rcValid = !vehicle.rcExpiry || vehicle.rcExpiry > new Date();

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
  vehicleType?: string
) {
  const whereVehicle: Record<string, unknown> = {
    isActive: true,
    status: "AVAILABLE",
  };
  if (vehicleType) whereVehicle.type = vehicleType;

  const vehicles = await prisma.vehicle.findMany({
    where: whereVehicle,
    include: {
      maintenance: {
        where: {
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          scheduledDate: { lte: dropDate || pickupDate },
        },
      },
    },
  });

  const results = [];

  for (const vehicle of vehicles) {
    const availability = await checkVehicleAvailability(vehicle.id, pickupDate, dropDate);
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
