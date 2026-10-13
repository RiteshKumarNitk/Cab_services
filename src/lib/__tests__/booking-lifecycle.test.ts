import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  checkTransition,
  requiresStartOtp,
  TRIP_STATUS_FOR_BOOKING,
  bookingWindow,
  windowsOverlap,
  generateTripOtp,
  parseClock,
  isWithinShift,
  BOOKING_TRANSITIONS,
} from "../booking-lifecycle";

const booking = (status: string, overrides: Partial<{ customerId: string; driverId: string | null }> = {}) => ({
  status,
  customerId: "cust-1",
  driverId: "drv-1",
  ...overrides,
});

describe("checkTransition: state machine", () => {
  test("rejects transitions not in the lifecycle", () => {
    const r = checkTransition({ role: "ADMIN", userId: "a", booking: booking("WAITING_ASSIGNMENT") }, "TRIP_STARTED");
    assert.deepEqual(r, { ok: false, status: 400, error: "Cannot transition from WAITING_ASSIGNMENT to TRIP_STARTED" });
  });

  test("terminal states have no exits", () => {
    for (const s of ["CANCELLED", "CLOSED"]) {
      assert.equal(BOOKING_TRANSITIONS[s].length, 0);
      const r = checkTransition({ role: "SUPER_ADMIN", userId: "a", booking: booking(s) }, "BOOKING_CONFIRMED");
      assert.equal(r.ok, false);
    }
  });

  test("assignment statuses can only be reached via the Dispatch Board", () => {
    for (const [from, to] of [
      ["WAITING_ASSIGNMENT", "VEHICLE_ASSIGNED"],
      ["VEHICLE_ASSIGNED", "DRIVER_ASSIGNED"],
      ["DRIVER_ASSIGNED", "READY_FOR_DISPATCH"],
    ]) {
      const r = checkTransition({ role: "ADMIN", userId: "a", booking: booking(from) }, to);
      assert.equal(r.ok, false, `${from} -> ${to} should be blocked`);
      if (!r.ok) assert.match(r.error, /Dispatch Board/);
    }
  });

  test("ops managers can move a confirmed booking into the queue and cancel", () => {
    assert.equal(checkTransition({ role: "BOOKING_MANAGER", userId: "m", booking: booking("BOOKING_CONFIRMED") }, "WAITING_ASSIGNMENT").ok, true);
    assert.equal(checkTransition({ role: "BOOKING_MANAGER", userId: "m", booking: booking("DRIVER_ASSIGNED") }, "CANCELLED").ok, true);
  });
});

describe("checkTransition: role permissions", () => {
  test("customer may cancel own booking before the trip starts", () => {
    assert.equal(checkTransition({ role: "CUSTOMER", userId: "cust-1", booking: booking("READY_FOR_DISPATCH") }, "CANCELLED").ok, true);
  });

  test("customer may not cancel once the trip has started", () => {
    const r = checkTransition({ role: "CUSTOMER", userId: "cust-1", booking: booking("TRIP_STARTED") }, "CANCELLED");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 403);
  });

  test("customer may not progress the trip (previously allowed)", () => {
    for (const [from, to] of [["TRIP_STARTED", "PICKUP_COMPLETED"], ["DROP_COMPLETED", "TRIP_COMPLETED"], ["TRIP_COMPLETED", "INVOICE_GENERATED"]]) {
      const r = checkTransition({ role: "CUSTOMER", userId: "cust-1", booking: booking(from) }, to);
      assert.equal(r.ok, false, `${from} -> ${to}`);
    }
  });

  test("customer may not touch another customer's booking", () => {
    const r = checkTransition({ role: "CUSTOMER", userId: "someone-else", booking: booking("BOOKING_CONFIRMED") }, "CANCELLED");
    assert.deepEqual(r, { ok: false, status: 403, error: "Forbidden" });
  });

  test("customer may approve a sent quotation", () => {
    assert.equal(checkTransition({ role: "CUSTOMER", userId: "cust-1", booking: booking("QUOTE_SENT") }, "QUOTE_ACCEPTED").ok, true);
  });

  test("assigned driver can run the trip step by step", () => {
    const steps = [
      ["READY_FOR_DISPATCH", "TRIP_STARTED"],
      ["TRIP_STARTED", "PICKUP_COMPLETED"],
      ["PICKUP_COMPLETED", "DROP_COMPLETED"],
      ["DROP_COMPLETED", "TRIP_COMPLETED"],
    ];
    for (const [from, to] of steps) {
      assert.equal(checkTransition({ role: "DRIVER", userId: "drv-1", booking: booking(from) }, to).ok, true, `${from} -> ${to}`);
    }
  });

  test("driver cannot cancel or act on someone else's trip", () => {
    assert.equal(checkTransition({ role: "DRIVER", userId: "drv-1", booking: booking("READY_FOR_DISPATCH") }, "CANCELLED").ok, false);
    assert.equal(checkTransition({ role: "DRIVER", userId: "drv-2", booking: booking("READY_FOR_DISPATCH") }, "TRIP_STARTED").ok, false);
  });

  test("finance can only close out completed trips", () => {
    assert.equal(checkTransition({ role: "FINANCE", userId: "f", booking: booking("TRIP_COMPLETED") }, "INVOICE_GENERATED").ok, true);
    assert.equal(checkTransition({ role: "FINANCE", userId: "f", booking: booking("BOOKING_CONFIRMED") }, "CANCELLED").ok, false);
  });

  test("content managers and support cannot change booking status", () => {
    for (const role of ["CONTENT_MANAGER", "SUPPORT_EXECUTIVE"]) {
      const r = checkTransition({ role, userId: "x", booking: booking("BOOKING_CONFIRMED") }, "CANCELLED");
      assert.equal(r.ok, false, role);
    }
  });
});

describe("trip start OTP", () => {
  test("required for drivers starting a trip only", () => {
    assert.equal(requiresStartOtp("DRIVER", "TRIP_STARTED"), true);
    assert.equal(requiresStartOtp("ADMIN", "TRIP_STARTED"), false);
    assert.equal(requiresStartOtp("DRIVER", "PICKUP_COMPLETED"), false);
  });

  test("generates 4-digit codes", () => {
    assert.equal(generateTripOtp(() => 0), "1000");
    assert.equal(generateTripOtp(() => 0.99999), "9999");
    for (let i = 0; i < 50; i++) assert.match(generateTripOtp(), /^\d{4}$/);
  });

  test("trip status follows booking execution statuses", () => {
    assert.equal(TRIP_STATUS_FOR_BOOKING.TRIP_STARTED, "IN_PROGRESS");
    assert.equal(TRIP_STATUS_FOR_BOOKING.TRIP_COMPLETED, "COMPLETED");
    assert.equal(TRIP_STATUS_FOR_BOOKING.CANCELLED, "CANCELLED");
  });
});

describe("assignment windows", () => {
  const d = (s: string) => new Date(s);

  test("one-way booking holds the whole pickup day", () => {
    const w = bookingWindow(d("2026-07-15T09:30:00"));
    assert.equal(w.start.getHours(), 0);
    assert.equal(w.end.getHours(), 23);
    assert.equal(w.start.getDate(), 15);
    assert.equal(w.end.getDate(), 15);
  });

  test("round trip holds through the return day", () => {
    const w = bookingWindow(d("2026-07-15T09:00:00"), d("2026-07-17T18:00:00"));
    assert.equal(w.end.getDate(), 17);
  });

  test("same-day bookings overlap; consecutive days do not", () => {
    const a = bookingWindow(d("2026-07-15T08:00:00"));
    assert.equal(windowsOverlap(a, bookingWindow(d("2026-07-15T20:00:00"))), true);
    assert.equal(windowsOverlap(a, bookingWindow(d("2026-07-16T08:00:00"))), false);
  });

  test("a multi-day trip blocks bookings inside it", () => {
    const trip = bookingWindow(d("2026-07-15T09:00:00"), d("2026-07-18T09:00:00"));
    assert.equal(windowsOverlap(trip, bookingWindow(d("2026-07-17T10:00:00"))), true);
    assert.equal(windowsOverlap(trip, bookingWindow(d("2026-07-19T10:00:00"))), false);
  });

  test("return date before pickup is ignored", () => {
    const w = bookingWindow(d("2026-07-15T09:00:00"), d("2026-07-10T09:00:00"));
    assert.equal(w.end.getDate(), 15);
  });
});

describe("driver shifts", () => {
  test("parseClock", () => {
    assert.equal(parseClock("09:30"), 570);
    assert.equal(parseClock("0:00"), 0);
    assert.equal(parseClock("24:00"), null);
    assert.equal(parseClock("9am"), null);
    assert.equal(parseClock(undefined), null);
  });

  test("isWithinShift", () => {
    const shift = { startTime: "08:00", endTime: "18:00" };
    assert.equal(isWithinShift(parseClock("10:00")!, shift), true);
    assert.equal(isWithinShift(parseClock("19:00")!, shift), false);
    assert.equal(isWithinShift(parseClock("19:00")!, { startTime: "bad", endTime: "18:00" }), true);
  });
});
