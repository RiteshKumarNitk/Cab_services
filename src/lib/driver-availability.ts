import { prisma } from "./prisma";

export interface DriverAvailabilityCheck {
  available: boolean;
  reason?: string;
  checks: {
    onLeave: boolean;
    hasActiveTrip: boolean;
    withinWorkingHours: boolean;
    withinMaxHours: boolean;
    online: boolean;
  };
}

const MAX_WORKING_HOURS_PER_DAY = 12;
const MAX_CONTINUOUS_HOURS = 8;

export async function checkDriverAvailability(
  driverId: string,
  pickupDate: Date,
  dropDate?: Date
): Promise<DriverAvailabilityCheck> {
  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    include: {
      driverStatus: true,
      driverLeaves: {
        where: {
          status: "APPROVED",
          startDate: { lte: dropDate || pickupDate },
          endDate: { gte: pickupDate },
        },
      },
    },
  });

  if (!driver || driver.role !== "DRIVER") {
    return {
      available: false,
      reason: "Not a valid driver",
      checks: { onLeave: true, hasActiveTrip: true, withinWorkingHours: true, withinMaxHours: true, online: true },
    };
  }

  const dropTime = dropDate || pickupDate;

  // Check 1: On leave?
  const onLeave = driver.driverLeaves.length > 0;

  // Check 2: Already assigned to an active trip?
  const activeTrips = await prisma.trip.findMany({
    where: {
      driverId,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      scheduledPickupTime: { lte: dropTime },
    },
  });
  const hasActiveTrip = activeTrips.length > 0;

  // Check 3: Within working hours (use pickupDate's day of week)
  const dayOfWeek = pickupDate.getDay();
  const shift = await prisma.driverShift.findUnique({
    where: { driverId_dayOfWeek: { driverId, dayOfWeek } },
  });
  const withinWorkingHours = shift
    ? (() => {
        const pickupHour = pickupDate.getHours();
        const pickupMin = pickupDate.getMinutes();
        const startParts = shift.startTime.split(":").map(Number);
        const endParts = shift.endTime.split(":").map(Number);
        const pickupMins = pickupHour * 60 + pickupMin;
        const startMins = startParts[0] * 60 + (startParts[1] || 0);
        const endMins = endParts[0] * 60 + (endParts[1] || 0);
        return pickupMins >= startMins && pickupMins <= endMins;
      })()
    : true; // No shift defined = available all day

  // Check 4: Check total hours already booked today
  const todayStart = new Date(pickupDate);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(pickupDate);
  todayEnd.setHours(23, 59, 59, 999);

  const todayTrips = await prisma.trip.findMany({
    where: {
      driverId,
      scheduledPickupTime: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
  });

  const totalBookedMinutes = todayTrips.reduce((acc, trip) => {
    if (trip.actualPickupTime && trip.actualDropTime) {
      return acc + (trip.actualDropTime.getTime() - trip.actualPickupTime.getTime()) / 60000;
    }
    // Estimate 30 min per km for non-completed trips
    const estDuration = trip.actualDistance ? trip.actualDistance * 0.5 : 60;
    return acc + estDuration;
  }, 0);

  const newTripEstimate = dropTime.getTime() - pickupDate.getTime() / 60000;
  const withinMaxHours = totalBookedMinutes + (newTripEstimate || 60) <= MAX_WORKING_HOURS_PER_DAY * 60;

  // Check 5: Online status
  const online = driver.driverStatus?.online ?? true;

  const failedChecks: string[] = [];
  if (onLeave) failedChecks.push("on leave");
  if (hasActiveTrip) failedChecks.push("already on a trip");
  if (!withinWorkingHours) failedChecks.push("outside working hours");
  if (!withinMaxHours) failedChecks.push("would exceed max hours");
  if (!online) failedChecks.push("offline");

  const available = failedChecks.length === 0;

  return {
    available,
    reason: available ? undefined : `Driver unavailable: ${failedChecks.join(", ")}`,
    checks: { onLeave, hasActiveTrip, withinWorkingHours, withinMaxHours, online },
  };
}

export async function findAvailableDrivers(
  pickupDate: Date,
  dropDate?: Date
) {
  const drivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      isActive: true,
    },
    include: {
      driverStatus: true,
      driverShifts: true,
    },
  });

  const results = [];

  for (const driver of drivers) {
    const availability = await checkDriverAvailability(driver.id, pickupDate, dropDate);
    if (availability.available) {
      results.push({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        online: driver.driverStatus?.online ?? false,
        location: { lat: driver.driverStatus?.lat, lng: driver.driverStatus?.lng },
      });
    }
  }

  return { drivers: results, total: results.length, checkedAt: new Date() };
}
