import { prisma } from "./prisma";
import { bookingWindow, isWithinShift, parseClock } from "./booking-lifecycle";
import { overlappingBookingsWhere, type Db } from "./vehicle-availability";

export interface DriverAvailabilityCheck {
  available: boolean;
  reason?: string;
  checks: {
    onLeave: boolean;
    hasActiveTrip: boolean;
    withinWorkingHours: boolean;
    online: boolean;
  };
}

export async function checkDriverAvailability(
  driverId: string,
  pickupDate: Date,
  dropDate?: Date,
  options: { excludeBookingId?: string; pickupTime?: string } = {},
  db: Db = prisma
): Promise<DriverAvailabilityCheck> {
  const window = bookingWindow(pickupDate, dropDate);

  const driver = await db.user.findUnique({
    where: { id: driverId },
    include: {
      driverStatus: true,
      driverLeaves: {
        where: {
          status: "APPROVED",
          startDate: { lte: window.end },
          endDate: { gte: window.start },
        },
      },
    },
  });

  if (!driver || driver.role !== "DRIVER" || !driver.isActive) {
    return {
      available: false,
      reason: "Not a valid driver",
      checks: { onLeave: true, hasActiveTrip: true, withinWorkingHours: true, online: true },
    };
  }

  // Check 1: On leave during the trip window?
  const onLeave = driver.driverLeaves.length > 0;

  // Check 2: Already holding another booking (or an undispatched assignment) in the same window?
  const [conflictingBookings, conflictingDispatches] = await Promise.all([
    db.booking.count({ where: { driverId, ...overlappingBookingsWhere(window, options.excludeBookingId) } }),
    db.dispatch.count({
      where: {
        driverId,
        status: { not: "DISPATCHED" },
        booking: overlappingBookingsWhere(window, options.excludeBookingId),
      },
    }),
  ]);
  const hasActiveTrip = conflictingBookings + conflictingDispatches > 0;

  // Check 3: Pickup within the driver's shift for that weekday (no shift defined = available all day).
  // Bookings store the pickup clock time separately in `pickupTime`; prefer it over the date's time part.
  const shift = await db.driverShift.findUnique({
    where: { driverId_dayOfWeek: { driverId, dayOfWeek: pickupDate.getDay() } },
  });
  const pickupMinutes = parseClock(options.pickupTime) ?? pickupDate.getHours() * 60 + pickupDate.getMinutes();
  const withinWorkingHours = shift ? isWithinShift(pickupMinutes, shift) : true;

  // Check 4: Online status. Only meaningful for trips starting today; a driver who is
  // offline right now can still be scheduled for a future day.
  const startsToday = window.start.getTime() === bookingWindow(new Date()).start.getTime();
  const online = !startsToday || (driver.driverStatus?.online ?? true);

  // Note: the daily max-hours rule is implied by the window check above — with day-granularity
  // windows a driver can hold at most one booking per day. See IMPLEMENTATION_PLAN.md (D3).

  const failedChecks: string[] = [];
  if (onLeave) failedChecks.push("on leave");
  if (hasActiveTrip) failedChecks.push("already assigned to another trip in this period");
  if (!withinWorkingHours) failedChecks.push("outside working hours");
  if (!online) failedChecks.push("offline");

  const available = failedChecks.length === 0;

  return {
    available,
    reason: available ? undefined : `Driver unavailable: ${failedChecks.join(", ")}`,
    checks: { onLeave, hasActiveTrip, withinWorkingHours, online },
  };
}

export async function findAvailableDrivers(
  pickupDate: Date,
  dropDate?: Date,
  options: { excludeBookingId?: string; pickupTime?: string } = {}
) {
  const drivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      isActive: true,
    },
    include: {
      driverStatus: true,
    },
  });

  const results = [];

  for (const driver of drivers) {
    const availability = await checkDriverAvailability(driver.id, pickupDate, dropDate, options);
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
