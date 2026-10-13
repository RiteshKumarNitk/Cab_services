// Pure booking-lifecycle rules (no database access) so they can be unit tested.
// The state machine follows docs/PRODUCT_SPECIFICATION.md §8.1.

import { FINANCE_ROLES, OPS_ROLES } from "./authz-roles";

export const BOOKING_TRANSITIONS: Record<string, string[]> = {
  // --- Sales Pipeline ---
  NEW_LEAD: ["QUALIFIED", "CANCELLED"],
  QUALIFIED: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["QUOTE_PREPARING", "CANCELLED"],
  QUOTE_PREPARING: ["QUOTE_SENT", "CANCELLED"],
  QUOTE_SENT: ["QUOTE_ACCEPTED", "CANCELLED"],
  QUOTE_ACCEPTED: ["BOOKING_CONFIRMED", "CANCELLED"],

  // --- Operations Pipeline ---
  BOOKING_CONFIRMED: ["WAITING_ASSIGNMENT", "VEHICLE_ASSIGNED", "CANCELLED"],
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

  // Legacy statuses (backward compatibility with older rows)
  PENDING: ["PRICE_SENT", "CANCELLED"],
  PRICE_SENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["WAITING_ASSIGNMENT", "CANCELLED"],
  VEHICLE_READY: ["TRIP_STARTED", "CANCELLED"],
  STARTED: ["PICKUP_COMPLETED", "CANCELLED"],
  COMPLETED: ["INVOICE_GENERATED"],
};

/** Statuses that may only be reached through the Dispatch Board endpoints,
 * because they need availability checks and (for READY_FOR_DISPATCH) trip creation. */
export const DISPATCH_CONTROLLED_STATUSES = ["VEHICLE_ASSIGNED", "DRIVER_ASSIGNED", "READY_FOR_DISPATCH"];

/** Booking statuses before the trip physically starts. */
export const PRE_TRIP_STATUSES = [
  "NEW_LEAD", "QUALIFIED", "CONTACTED", "QUOTE_PREPARING", "QUOTE_SENT", "QUOTE_ACCEPTED",
  "BOOKING_CONFIRMED", "WAITING_ASSIGNMENT", "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED", "READY_FOR_DISPATCH",
  "PENDING", "PRICE_SENT", "CONFIRMED", "VEHICLE_READY",
];

/** Statuses in which a booking still holds its vehicle/driver. */
export const ACTIVE_ASSIGNMENT_STATUSES = [
  "BOOKING_CONFIRMED", "WAITING_ASSIGNMENT", "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED", "READY_FOR_DISPATCH",
  "TRIP_STARTED", "PICKUP_COMPLETED", "DROP_COMPLETED",
  "CONFIRMED", "VEHICLE_READY", "STARTED",
];

/** Bookings in these statuses count as a completed trip (for ratings, history). */
export const COMPLETED_TRIP_STATUSES = ["TRIP_COMPLETED", "INVOICE_GENERATED", "CLOSED", "COMPLETED"];

const DRIVER_TRANSITIONS: Record<string, string> = {
  READY_FOR_DISPATCH: "TRIP_STARTED",
  VEHICLE_READY: "TRIP_STARTED",
  TRIP_STARTED: "PICKUP_COMPLETED",
  STARTED: "PICKUP_COMPLETED",
  PICKUP_COMPLETED: "DROP_COMPLETED",
  DROP_COMPLETED: "TRIP_COMPLETED",
};

const CUSTOMER_APPROVALS: Record<string, string> = {
  QUOTE_SENT: "QUOTE_ACCEPTED",
  PRICE_SENT: "CONFIRMED",
};

const FINANCE_TRANSITIONS: Record<string, string> = {
  TRIP_COMPLETED: "INVOICE_GENERATED",
  COMPLETED: "INVOICE_GENERATED",
  INVOICE_GENERATED: "CLOSED",
};

export type TransitionContext = {
  role: string;
  userId: string;
  booking: { status: string; customerId: string; driverId: string | null };
};

export type TransitionCheck = { ok: true } | { ok: false; status: 400 | 403; error: string };

/** Decide whether `ctx.role` may move the booking from its current status to `to`. */
export function checkTransition(ctx: TransitionContext, to: string): TransitionCheck {
  const from = ctx.booking.status;
  const allowed = BOOKING_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return { ok: false, status: 400, error: `Cannot transition from ${from} to ${to}` };
  }

  if (DISPATCH_CONTROLLED_STATUSES.includes(to)) {
    return {
      ok: false,
      status: 400,
      error: `${to} is set by the Dispatch Board (vehicle/driver assignment and dispatch), not by a direct status change`,
    };
  }

  const { role, userId, booking } = ctx;

  if (role === "CUSTOMER") {
    if (booking.customerId !== userId) return { ok: false, status: 403, error: "Forbidden" };
    if (to === "CANCELLED" && PRE_TRIP_STATUSES.includes(from)) return { ok: true };
    if (CUSTOMER_APPROVALS[from] === to) return { ok: true };
    return { ok: false, status: 403, error: "Customers can only approve a quotation or cancel before the trip starts" };
  }

  if (role === "DRIVER") {
    if (booking.driverId !== userId) return { ok: false, status: 403, error: "Forbidden" };
    if (DRIVER_TRANSITIONS[from] === to) return { ok: true };
    return { ok: false, status: 403, error: "Drivers can only progress their own trip (start, pickup, drop, complete)" };
  }

  if (OPS_ROLES.includes(role)) return { ok: true };

  if (FINANCE_ROLES.includes(role) && FINANCE_TRANSITIONS[from] === to) return { ok: true };

  return { ok: false, status: 403, error: "Only managers can perform this action" };
}

/** Starting a trip as the driver requires the customer's OTP; ops managers may override. */
export function requiresStartOtp(role: string, to: string): boolean {
  return to === "TRIP_STARTED" && role === "DRIVER";
}

/** Trip.status to keep in sync with a booking status change (undefined = leave unchanged). */
export const TRIP_STATUS_FOR_BOOKING: Record<string, string> = {
  TRIP_STARTED: "IN_PROGRESS",
  PICKUP_COMPLETED: "PICKED_UP",
  DROP_COMPLETED: "REACHED_DESTINATION",
  TRIP_COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export function generateTripOtp(random: () => number = Math.random): string {
  return Math.floor(1000 + random() * 9000).toString();
}

// ---------- Assignment windows (overlap prevention) ----------

/**
 * Time window during which a booking holds its vehicle and driver.
 * Day granularity: from the start of the pickup day to the end of the return day
 * (or pickup day for one-way trips). Bookings do not carry a reliable end time,
 * so this is the conservative rule that cannot double-book. See IMPLEMENTATION_PLAN.md (D3).
 */
export function bookingWindow(pickupDate: Date, returnDate?: Date | null): { start: Date; end: Date } {
  const start = new Date(pickupDate);
  start.setHours(0, 0, 0, 0);
  const endBase = returnDate && returnDate > pickupDate ? returnDate : pickupDate;
  const end = new Date(endBase);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function windowsOverlap(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  return a.start <= b.end && b.start <= a.end;
}

// ---------- Driver shifts ----------

/** "HH:MM" -> minutes after midnight, or null if malformed. */
export function parseClock(value: string | null | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function isWithinShift(pickupMinutes: number, shift: { startTime: string; endTime: string }): boolean {
  const start = parseClock(shift.startTime);
  const end = parseClock(shift.endTime);
  if (start === null || end === null) return true; // malformed shift data should not block assignment
  return pickupMinutes >= start && pickupMinutes <= end;
}


// ---------- Client refresh ----------

/** Booking changes without the viewer acting (dispatch, trip progress): worth polling. */
export function isLiveBookingStatus(status: string | undefined | null): boolean {
  return !!status && ACTIVE_ASSIGNMENT_STATUSES.includes(status);
}
