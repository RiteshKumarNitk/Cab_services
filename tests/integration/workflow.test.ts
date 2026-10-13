// End-to-end business workflow over HTTP against an isolated database:
// Enquiry -> Lead -> Quotation -> Approval -> Booking -> Availability -> Dispatch -> Trip
// -> Invoice -> Payment -> Settlement -> Close -> Review, plus authorization, duplicates,
// invalid transitions and pagination. Run with `pnpm test:integration -- --env-file <file>`.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  assertSafeTarget, prisma, RUN, day, ymd, uniquePhone, Client, makeUser, makeVehicle, eventually, cleanup,
} from "./helpers";

assertSafeTarget();

type Actors = Awaited<ReturnType<typeof setup>>;
let A: Actors;
const anon = new Client();

async function setup() {
  const [ops, sales, finance, driver1, driver2, driver3, customer, otherCustomer] = await Promise.all([
    makeUser("BOOKING_MANAGER", "ops"),
    makeUser("SUPPORT_EXECUTIVE", "sales"),
    makeUser("FINANCE", "finance"),
    makeUser("DRIVER", "driver1"),
    makeUser("DRIVER", "driver2"),
    makeUser("DRIVER", "driver3"),
    makeUser("CUSTOMER", "customer"),
    makeUser("CUSTOMER", "customer2"),
  ]);
  const [v1, v2, v3, expired] = await Promise.all([
    makeVehicle("V1"), makeVehicle("V2"), makeVehicle("V3"),
    makeVehicle("EXPIRED", { insuranceExpiry: new Date(Date.now() - 86_400_000) }),
  ]);
  return { ops, sales, finance, driver1, driver2, driver3, customer, otherCustomer, v1, v2, v3, expired };
}

/** Website enquiry -> lead -> approved quotation -> converted booking. Returns ids. */
async function confirmedBooking(label: string, pickup: Date, totalFare = 3990) {
  const phone = uniquePhone();
  const enq = await anon.post("/api/enquiries", {
    name: `IT ${label} ${RUN}`, phone, email: A.customer.user.email,
    pickupAddress: `IT pickup ${label} ${RUN}`, dropAddress: "Ajmer", pickupDate: ymd(pickup), passengers: 2,
  });
  assert.equal(enq.status, 201, JSON.stringify(enq.json));
  const lead = await prisma.lead.findUniqueOrThrow({ where: { leadNumber: enq.json.reference } });
  const q = await A.sales.client.post("/api/admin/quotations", {
    leadId: lead.id, bookingType: "OUTSTATION", tripType: "ONE_WAY", pickupAddress: lead.pickupAddress,
    dropAddress: "Ajmer", pickupDate: pickup.toISOString(), passengers: 2, vehicleType: "SEDAN",
    perKmCharge: 11, totalKm: 300, driverAllowance: 300, tollCharges: 200, gst: 5, totalFare, validUntil: day(-1).toISOString(),
  });
  assert.equal(q.status, 201, JSON.stringify(q.json));
  assert.equal((await A.sales.client.patch(`/api/admin/quotations/${q.json.id}`, { status: "SENT" })).status, 200);
  assert.equal((await A.ops.client.patch(`/api/admin/quotations/${q.json.id}`, { status: "APPROVED" })).status, 200);
  const conv = await A.ops.client.post(`/api/admin/leads/${lead.id}/convert`);
  assert.equal(conv.status, 201, JSON.stringify(conv.json));
  const dispatch = await prisma.dispatch.findUniqueOrThrow({ where: { bookingId: conv.json.id } });
  return { leadId: lead.id, quotationId: q.json.id as string, bookingId: conv.json.id as string, dispatchId: dispatch.id };
}

before(async () => { A = await setup(); });
after(async () => { await cleanup(); });

// Shared state across the ordered workflow tests.
const S: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("1-4. Enquiry → lead → quotation → booking", () => {
  test("public enquiry creates a NEW website lead; a duplicate returns the same lead", async () => {
    const body = { name: `IT Main ${RUN}`, phone: uniquePhone(), email: A.customer.user.email, pickupAddress: `IT pickup main ${RUN}`, dropAddress: "Jodhpur", pickupDate: ymd(day(0)), passengers: 3 };
    const r1 = await anon.post("/api/enquiries", body);
    assert.equal(r1.status, 201);
    const r2 = await anon.post("/api/enquiries", body);
    assert.equal(r2.status, 200);
    assert.equal(r2.json.duplicate, true);
    assert.equal(r2.json.reference, r1.json.reference);
    const leads = await prisma.lead.findMany({ where: { name: body.name } });
    assert.equal(leads.length, 1, "duplicate submission must not create a second lead");
    assert.equal(leads[0].status, "NEW");
    assert.equal(leads[0].source, "WEBSITE");
    S.lead = leads[0];
  });

  test("invalid enquiry is rejected with field errors", async () => {
    const r = await anon.post("/api/enquiries", { name: "X", phone: "123", pickupAddress: "", pickupDate: ymd(day(0)) });
    assert.equal(r.status, 400);
    assert.ok(r.json.fields.name && r.json.fields.phone && r.json.fields.pickupAddress, JSON.stringify(r.json.fields));
    // Cross-field date rules run once the basic fields are valid.
    const past = await anon.post("/api/enquiries", { name: "Valid Name", phone: uniquePhone(), pickupAddress: "Jaipur", pickupDate: "2020-01-01" });
    assert.equal(past.status, 400);
    assert.ok(past.json.fields.pickupDate);
  });

  test("sales can find the lead; customers cannot use the CRM API", async () => {
    const r = await A.sales.client.get(`/api/admin/leads?search=${encodeURIComponent(S.lead.phone)}`);
    assert.equal(r.status, 200);
    assert.ok(r.json.leads.some((l: { id: string }) => l.id === S.lead.id));
    assert.ok([401, 403].includes((await A.customer.client.get("/api/admin/leads")).status));
  });

  test("conversion is refused until a quotation is approved", async () => {
    const r = await A.ops.client.post(`/api/admin/leads/${S.lead.id}/convert`);
    assert.equal(r.status, 400);
    assert.equal(r.json.requiresQuotation, true);
  });

  test("quotation: sales creates and sends; only a manager can approve", async () => {
    const q = await A.sales.client.post("/api/admin/quotations", {
      leadId: S.lead.id, bookingType: "OUTSTATION", tripType: "ONE_WAY", pickupAddress: S.lead.pickupAddress, dropAddress: "Jodhpur",
      pickupDate: day(0).toISOString(), passengers: 3, vehicleType: "SEDAN", perKmCharge: 11, totalKm: 300, driverAllowance: 300, tollCharges: 200, gst: 5, totalFare: 3990,
    });
    assert.equal(q.status, 201);
    assert.equal(q.json.status, "DRAFT");
    S.quotationId = q.json.id;
    assert.equal((await A.sales.client.patch(`/api/admin/quotations/${S.quotationId}`, { status: "SENT" })).status, 200);
    assert.equal((await A.sales.client.patch(`/api/admin/quotations/${S.quotationId}`, { status: "APPROVED" })).status, 403);
    const approved = await A.ops.client.patch(`/api/admin/quotations/${S.quotationId}`, { status: "APPROVED" });
    assert.equal(approved.status, 200);
    assert.equal(approved.json.approvedById, A.ops.user.id);
  });

  test("approved quotation converts to exactly one booking (repeat call is idempotent)", async () => {
    const r1 = await A.ops.client.post(`/api/admin/leads/${S.lead.id}/convert`);
    assert.equal(r1.status, 201, JSON.stringify(r1.json));
    const r2 = await A.ops.client.post(`/api/admin/leads/${S.lead.id}/convert`);
    assert.equal(r2.status, 200);
    assert.equal(r2.json.id, r1.json.id);
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: r1.json.id }, include: { dispatch: true, lead: true } });
    assert.equal(b.status, "BOOKING_CONFIRMED");
    assert.equal(b.customerId, A.customer.user.id, "existing customer account matched by email");
    assert.equal(b.quotationId, S.quotationId);
    assert.equal(b.totalFare, 3990);
    assert.equal(b.dispatch?.status, "PENDING");
    assert.equal(b.lead?.status, "WON");
    assert.equal(await prisma.booking.count({ where: { leadId: S.lead.id } }), 1);
    S.bookingId = b.id;
    S.dispatchId = b.dispatch!.id;
  });
});

describe("5-6. Availability and dispatch", () => {
  test("customers cannot use dispatch endpoints", async () => {
    assert.equal((await A.customer.client.post(`/api/admin/dispatch/${S.dispatchId}/finalize`)).status, 403);
    assert.equal((await anon.post(`/api/admin/dispatch/${S.dispatchId}/finalize`)).status, 401);
  });

  test("assignment statuses cannot be set directly through the status API", async () => {
    const r = await A.ops.client.put(`/api/bookings/${S.bookingId}/status`, { status: "VEHICLE_ASSIGNED" });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /Dispatch Board/);
  });

  test("driver cannot be assigned before a vehicle", async () => {
    const r = await A.ops.client.post(`/api/admin/dispatch/${S.dispatchId}/assign-driver`, { driverId: A.driver1.user.id });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /vehicle/i);
  });

  test("vehicle with expired insurance is rejected", async () => {
    const r = await A.ops.client.post(`/api/admin/dispatch/${S.dispatchId}/assign-vehicle`, { vehicleId: A.expired.id });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /insurance expired/);
  });

  test("assign vehicle and driver; booking status follows", async () => {
    const v = await A.ops.client.post(`/api/admin/dispatch/${S.dispatchId}/assign-vehicle`, { vehicleId: A.v1.id });
    assert.equal(v.status, 200, JSON.stringify(v.json));
    assert.equal((await prisma.booking.findUniqueOrThrow({ where: { id: S.bookingId } })).status, "VEHICLE_ASSIGNED");
    const d = await A.ops.client.post(`/api/admin/dispatch/${S.dispatchId}/assign-driver`, { driverId: A.driver1.user.id });
    assert.equal(d.status, 200, JSON.stringify(d.json));
    assert.equal(d.json.status, "READY");
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: S.bookingId } });
    assert.equal(b.status, "DRIVER_ASSIGNED");
    assert.equal(b.vehicleId, A.v1.id);
    assert.equal(b.driverId, A.driver1.user.id);
  });

  test("overlapping assignments are rejected; parallel assignment of one vehicle succeeds only once", async () => {
    const [b2, b3] = await Promise.all([confirmedBooking("B2", day(0, 15)), confirmedBooking("B3", day(0, 18))]);
    S.b2 = b2; S.b3 = b3;

    const busy = await A.ops.client.post(`/api/admin/dispatch/${b2.dispatchId}/assign-vehicle`, { vehicleId: A.v1.id });
    assert.equal(busy.status, 400);
    assert.match(busy.json.error, /already booked/);

    const race = await Promise.all([
      A.ops.client.post(`/api/admin/dispatch/${b2.dispatchId}/assign-vehicle`, { vehicleId: A.v2.id }),
      A.ops.client.post(`/api/admin/dispatch/${b3.dispatchId}/assign-vehicle`, { vehicleId: A.v2.id }),
    ]);
    assert.deepEqual(race.map((r) => r.status).sort(), [200, 400], JSON.stringify(race.map((r) => r.json)));
    const winner = race[0].status === 200 ? b2 : b3;
    const loser = winner === b2 ? b3 : b2;
    assert.equal(await prisma.booking.count({ where: { vehicleId: A.v2.id } }), 1);

    assert.equal((await A.ops.client.post(`/api/admin/dispatch/${loser.dispatchId}/assign-vehicle`, { vehicleId: A.v3.id })).status, 200);
    const driverBusy = await A.ops.client.post(`/api/admin/dispatch/${winner.dispatchId}/assign-driver`, { driverId: A.driver1.user.id });
    assert.equal(driverBusy.status, 400);
    assert.match(driverBusy.json.error, /already assigned/);
    assert.equal((await A.ops.client.post(`/api/admin/dispatch/${winner.dispatchId}/assign-driver`, { driverId: A.driver2.user.id })).status, 200);
  });

  test("finalize creates exactly one trip with an OTP (repeat call is idempotent)", async () => {
    const r1 = await A.ops.client.post(`/api/admin/dispatch/${S.dispatchId}/finalize`);
    assert.equal(r1.status, 201, JSON.stringify(r1.json));
    assert.match(r1.json.otp, /^\d{4}$/);
    const r2 = await A.ops.client.post(`/api/admin/dispatch/${S.dispatchId}/finalize`);
    assert.equal(r2.status, 200);
    assert.equal(r2.json.id, r1.json.id);
    assert.equal(await prisma.trip.count({ where: { bookingId: S.bookingId } }), 1);
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: S.bookingId }, include: { dispatch: true } });
    assert.equal(b.status, "READY_FOR_DISPATCH");
    assert.equal(b.dispatch?.status, "DISPATCHED");
    S.trip = r1.json;
  });

  test("dispatch events reach subscribers (customer notification + audit log)", async () => {
    const note = await eventually(() => prisma.notification.findFirst({ where: { userId: A.customer.user.id, title: "Trip Ready" } }));
    assert.ok(note, "customer should be notified when the trip is ready");
    const audit = await eventually(() => prisma.auditLog.findFirst({ where: { entityId: S.bookingId, action: "DISPATCH_FINALIZED" } }));
    assert.ok(audit, "dispatch finalize should be audit-logged");
  });
});

describe("7. Trip execution", () => {
  test("OTP is visible to the customer, hidden from the driver; other drivers are refused", async () => {
    const c = await A.customer.client.get(`/api/bookings/${S.bookingId}`);
    assert.equal(c.status, 200);
    assert.equal(c.json.trip.otp, S.trip.otp);
    const d = await A.driver1.client.get(`/api/bookings/${S.bookingId}`);
    assert.equal(d.status, 200);
    assert.equal(d.json.trip.otp, null);
    assert.equal((await A.driver3.client.get(`/api/bookings/${S.bookingId}`)).status, 403);
    assert.equal((await A.otherCustomer.client.get(`/api/bookings/${S.bookingId}`)).status, 403);
  });

  test("driver needs the right OTP to start; other drivers cannot act", async () => {
    const wrong = S.trip.otp === "1234" ? "4321" : "1234";
    assert.equal((await A.driver1.client.put(`/api/bookings/${S.bookingId}/status`, { status: "TRIP_STARTED", otp: wrong })).status, 400);
    assert.equal((await A.driver3.client.put(`/api/bookings/${S.bookingId}/status`, { status: "TRIP_STARTED", otp: S.trip.otp })).status, 403);
    const ok = await A.driver1.client.put(`/api/bookings/${S.bookingId}/status`, { status: "TRIP_STARTED", otp: S.trip.otp });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    const trip = await prisma.trip.findUniqueOrThrow({ where: { bookingId: S.bookingId } });
    assert.equal(trip.status, "IN_PROGRESS");
  });

  test("customer cannot cancel or progress a running trip", async () => {
    assert.equal((await A.customer.client.put(`/api/bookings/${S.bookingId}/status`, { status: "CANCELLED" })).status, 403);
    assert.equal((await A.customer.client.put(`/api/bookings/${S.bookingId}/status`, { status: "PICKUP_COMPLETED" })).status, 403);
  });

  test("driver completes pickup, drop and trip; trip record mirrors it", async () => {
    for (const status of ["PICKUP_COMPLETED", "DROP_COMPLETED", "TRIP_COMPLETED"]) {
      const r = await A.driver1.client.put(`/api/bookings/${S.bookingId}/status`, { status });
      assert.equal(r.status, 200, `${status}: ${JSON.stringify(r.json)}`);
    }
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: S.bookingId }, include: { trip: true } });
    assert.equal(b.status, "TRIP_COMPLETED");
    assert.ok(b.startTime && b.endTime);
    assert.equal(b.trip?.status, "COMPLETED");
    assert.ok(b.trip?.actualPickupTime && b.trip?.actualDropTime);
  });

  test("invalid transitions are rejected", async () => {
    const r = await A.driver1.client.put(`/api/bookings/${S.bookingId}/status`, { status: "TRIP_STARTED" });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /Cannot transition from TRIP_COMPLETED/);
  });

  test("driver logs a trip expense", async () => {
    const r = await A.driver1.client.post("/api/driver/expenses", { amount: 450, category: "TOLL", description: "Toll", bookingId: S.bookingId });
    assert.equal(r.status, 201);
    S.expense = r.json;
  });
});

describe("8-9. Invoice, payments, settlement", () => {
  test("finance data is closed to customers and anonymous users", async () => {
    assert.equal((await anon.get("/api/admin/invoices")).status, 401);
    assert.equal((await A.customer.client.get("/api/admin/invoices")).status, 403);
    assert.equal((await A.driver1.client.get("/api/admin/payments")).status, 403);
    assert.equal((await A.customer.client.post("/api/admin/payments", { bookingId: S.bookingId, amount: 1 })).status, 401);
  });

  test("invoice: created unpaid with correct total; a second invoice for the booking is refused", async () => {
    const r = await A.finance.client.post("/api/admin/invoices", { bookingId: S.bookingId, subtotal: 3800, gst: 190, discount: 0, dueDate: ymd(day(7)), paidAmount: 9999 });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.total, 3990);
    assert.equal(r.json.paidAmount, 0, "client-supplied paidAmount must be ignored");
    assert.equal(r.json.paymentStatus, "PENDING");
    assert.equal(r.json.customerId, A.customer.user.id, "customer comes from the booking");
    S.invoice = r.json;
    assert.equal((await A.finance.client.post("/api/admin/invoices", { bookingId: S.bookingId, subtotal: 3800, gst: 190 })).status, 409);
  });

  test("booking moves to INVOICE_GENERATED (finance)", async () => {
    const r = await A.finance.client.put(`/api/bookings/${S.bookingId}/status`, { status: "INVOICE_GENERATED" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
  });

  test("payments: validation, duplicate guard, balance tracking", async () => {
    assert.equal((await A.finance.client.post("/api/admin/payments", { bookingId: S.bookingId, invoiceId: S.invoice.id, amount: -5 })).status, 400);
    const adv = { bookingId: S.bookingId, invoiceId: S.invoice.id, amount: 1000, type: "ADVANCE", method: "CASH", reference: `R-${RUN}` };
    const p1 = await A.finance.client.post("/api/admin/payments", adv);
    assert.equal(p1.status, 201, JSON.stringify(p1.json));
    const p2 = await A.finance.client.post("/api/admin/payments", adv);
    assert.equal(p2.status, 200);
    assert.equal(p2.json.id, p1.json.id, "double submit returns the first payment");
    let inv = await prisma.invoice.findUniqueOrThrow({ where: { id: S.invoice.id } });
    assert.equal(inv.paidAmount, 1000);
    assert.equal(inv.status, "PARTIALLY_PAID");

    const p3 = await A.finance.client.post("/api/admin/payments", { ...adv, amount: 2990, type: "FULL", method: "ONLINE", reference: `UPI-${RUN}` });
    assert.equal(p3.status, 201);
    inv = await prisma.invoice.findUniqueOrThrow({ where: { id: S.invoice.id } });
    assert.equal(inv.paidAmount, 3990);
    assert.equal(inv.status, "PAID");
    assert.equal(inv.paymentStatus, "PAID");
    assert.equal(await prisma.payment.count({ where: { bookingId: S.bookingId } }), 2);
  });

  test("booking payment status follows recorded payments", async () => {
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: S.bookingId } });
    assert.equal(b.paymentStatus, "PAID");
  });

  test("driver settlement: net payable computed and marked paid", async () => {
    const r = await A.finance.client.post("/api/admin/settlements", { driverId: A.driver1.user.id, tripId: S.trip.id, totalEarnings: 1200, advancePaid: 200, expenses: 450 });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.netPayable, 550);
    const paid = await A.finance.client.patch("/api/admin/settlements", { id: r.json.id, status: "PAID" });
    assert.equal(paid.status, 200);
    assert.ok(paid.json.paidAt);
  });
});

describe("10. Close-out, review and final consistency", () => {
  test("booking closes; customer rates once", async () => {
    assert.equal((await A.finance.client.put(`/api/bookings/${S.bookingId}/status`, { status: "CLOSED" })).status, 200);
    const rate = { bookingId: S.bookingId, driverId: A.driver1.user.id, score: 5, comment: "Great trip" };
    assert.equal((await A.otherCustomer.client.post("/api/ratings", rate)).status, 403);
    assert.equal((await A.customer.client.post("/api/ratings", rate)).status, 201);
    assert.equal((await A.customer.client.post("/api/ratings", rate)).status, 409);
  });

  test("final records are consistent and linked", async () => {
    const b = await prisma.booking.findUniqueOrThrow({
      where: { id: S.bookingId },
      include: { lead: true, quotation: true, dispatch: true, trip: true, invoices: true, payments: true, rating: true },
    });
    assert.equal(b.status, "CLOSED");
    assert.equal(b.lead?.id, S.lead.id);
    assert.equal(b.quotation?.status, "APPROVED");
    assert.equal(b.totalFare, b.quotation?.totalFare);
    assert.equal(b.dispatch?.status, "DISPATCHED");
    assert.equal(b.trip?.status, "COMPLETED");
    assert.equal(b.invoices.length, 1);
    assert.equal(b.invoices[0].status, "PAID");
    const paid = b.payments.reduce((s, p) => s + (p.type === "REFUND" ? -p.amount : p.amount), 0);
    assert.equal(paid, b.invoices[0].total);
    assert.equal(b.rating?.score, 5);
  });
});

describe("Pagination, filters and data scoping", () => {
  test("paged envelope, legacy array and status filter", async () => {
    const paged = await A.ops.client.get("/api/bookings?page=1&limit=2");
    assert.equal(paged.status, 200);
    assert.ok(paged.json.bookings.length <= 2);
    assert.ok(paged.json.total >= 3);
    assert.equal(paged.json.totalPages, Math.ceil(paged.json.total / 2));
    const legacy = await A.ops.client.get("/api/bookings");
    assert.ok(Array.isArray(legacy.json));
    const closed = await A.ops.client.get("/api/bookings?status=CLOSED&page=1&limit=50");
    assert.ok(closed.json.bookings.every((b: { status: string }) => b.status === "CLOSED"));
    assert.ok(closed.json.bookings.some((b: { id: string }) => b.id === S.bookingId));
  });

  test("customers and drivers only see their own bookings", async () => {
    const mine = await A.customer.client.get("/api/bookings?page=1&limit=50");
    assert.ok(mine.json.total >= 3);
    assert.ok(mine.json.bookings.every((b: { customer: { id: string } }) => b.customer.id === A.customer.user.id));
    const other = await A.otherCustomer.client.get("/api/bookings?page=1&limit=50");
    assert.equal(other.json.total, 0);
    const drv = await A.driver1.client.get("/api/bookings?page=1&limit=50");
    assert.ok(drv.json.bookings.every((b: { driver: { id: string } | null }) => b.driver?.id === A.driver1.user.id));
  });

  test("payments list filters by booking with paging", async () => {
    const r = await A.finance.client.get(`/api/admin/payments?bookingId=${S.bookingId}&page=1&limit=10`);
    assert.equal(r.status, 200);
    assert.equal(r.json.total, 2);
  });

  test("reports export and self-registration escalation are blocked", async () => {
    const csv = await A.customer.client.req("POST", "/api/admin/reports/csv", new URLSearchParams({ type: "crm" }));
    assert.equal(csv.status, 403);
    const reg = await anon.post("/api/auth/register", { name: "x", email: `it-${RUN}-esc@example.invalid`, password: "longenough1", role: "ADMIN" });
    assert.equal(reg.status, 400);
  });
});

describe("Known gaps (not implemented; documented in IMPLEMENTATION_PLAN)", () => {
  test.todo("invoice is auto-generated when a trip completes (spec §9) — P4-4");
  test.todo("driver settlement is calculated from persisted trips and expenses (spec §4D) — P4-3");
  test.todo("customer can approve a sent quotation from the portal — P5-2");
});
