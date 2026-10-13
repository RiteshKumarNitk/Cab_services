// Automatic invoice generation on trip completion (P4-4), over HTTP against an isolated database.
// Run with `pnpm test:integration -- --env-file <file>`.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { assertSafeTarget, prisma, RUN, day, ymd, uniquePhone, Client, makeUser, makeVehicle, eventually, cleanup } from "./helpers";

assertSafeTarget();

let ops: Awaited<ReturnType<typeof makeUser>>;
let sales: Awaited<ReturnType<typeof makeUser>>;
let finance: Awaited<ReturnType<typeof makeUser>>;
let driver: Awaited<ReturnType<typeof makeUser>>;
let otherDriver: Awaited<ReturnType<typeof makeUser>>;
let customer: Awaited<ReturnType<typeof makeUser>>;
let vehicleId: string;
const anon = new Client();
let nextDay = 0;

// 300 km × ₹11 + ₹300 + ₹200 = ₹3,800; GST 5% = ₹190; discount ₹90 → ₹3,900.
const PRICE = { perKmCharge: 11, totalKm: 300, driverAllowance: 300, tollCharges: 200, gst: 5, discount: 90 };

before(async () => {
  [ops, sales, finance, driver, otherDriver, customer] = await Promise.all([
    makeUser("BOOKING_MANAGER", "i-ops"), makeUser("SUPPORT_EXECUTIVE", "i-sales"), makeUser("FINANCE", "i-finance"),
    makeUser("DRIVER", "i-driver"), makeUser("DRIVER", "i-driver2"), makeUser("CUSTOMER", "i-customer"),
  ]);
  vehicleId = (await makeVehicle("INV")).id;
});
after(async () => { await cleanup(); });

const status = (c: Client, bookingId: string, body: Record<string, unknown>) => c.put(`/api/bookings/${bookingId}/status`, body);

/** Enquiry → approved quotation → booking → dispatch → trip started → pickup → drop (one day per booking). */
async function bookingAtDrop(label: string) {
  const when = day(2 * nextDay++, 9);
  const enq = await anon.post("/api/enquiries", {
    name: `IT I ${label} ${RUN}`, phone: uniquePhone(), email: customer.user.email,
    pickupAddress: `IT I pickup ${label} ${RUN}`, dropAddress: "Ajmer", pickupDate: ymd(when), passengers: 2,
  });
  assert.equal(enq.status, 201, JSON.stringify(enq.json));
  const lead = await prisma.lead.findUniqueOrThrow({ where: { leadNumber: enq.json.reference } });
  const q = await sales.client.post("/api/admin/quotations", {
    leadId: lead.id, bookingType: "OUTSTATION", tripType: "ONE_WAY", pickupAddress: lead.pickupAddress, dropAddress: "Ajmer",
    pickupDate: when.toISOString(), passengers: 2, vehicleType: "SEDAN", validUntil: day(-1).toISOString(), ...PRICE,
  });
  assert.equal(q.status, 201, JSON.stringify(q.json));
  assert.equal((await sales.client.patch(`/api/admin/quotations/${q.json.id}`, { status: "SENT" })).status, 200);
  assert.equal((await ops.client.patch(`/api/admin/quotations/${q.json.id}`, { status: "APPROVED" })).status, 200);
  const conv = await ops.client.post(`/api/admin/leads/${lead.id}/convert`);
  assert.equal(conv.status, 201, JSON.stringify(conv.json));
  const bookingId: string = conv.json.id;
  const dispatch = await prisma.dispatch.findUniqueOrThrow({ where: { bookingId } });
  assert.equal((await ops.client.post(`/api/admin/dispatch/${dispatch.id}/assign-vehicle`, { vehicleId })).status, 200);
  assert.equal((await ops.client.post(`/api/admin/dispatch/${dispatch.id}/assign-driver`, { driverId: driver.user.id })).status, 200);
  const fin = await ops.client.post(`/api/admin/dispatch/${dispatch.id}/finalize`);
  assert.equal(fin.status, 201, JSON.stringify(fin.json));
  assert.equal((await status(driver.client, bookingId, { status: "TRIP_STARTED", otp: fin.json.otp })).status, 200);
  assert.equal((await status(driver.client, bookingId, { status: "PICKUP_COMPLETED" })).status, 200);
  assert.equal((await status(driver.client, bookingId, { status: "DROP_COMPLETED" })).status, 200);
  return { bookingId, quotationId: q.json.id as string, tripId: fin.json.id as string };
}

const invoicesOf = (bookingId: string) => prisma.invoice.findMany({ where: { bookingId } });

describe("Automatic invoice on trip completion", () => {
  test("completion creates exactly one unpaid invoice with server-computed quotation amounts", async () => {
    const { bookingId } = await bookingAtDrop("happy");
    const r = await status(driver.client, bookingId, { status: "TRIP_COMPLETED", subtotal: 1, total: 1 }); // extra fields ignored
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.status, "INVOICE_GENERATED");
    assert.equal(r.json.autoInvoice.status, "created");

    const invoices = await invoicesOf(bookingId);
    assert.equal(invoices.length, 1);
    const inv = invoices[0];
    assert.deepEqual(
      { subtotal: inv.subtotal, gst: inv.gst, discount: inv.discount, total: inv.total },
      { subtotal: 3800, gst: 190, discount: 90, total: 3900 }
    );
    assert.equal(inv.invoiceNumber, r.json.autoInvoice.invoiceNumber);
    assert.match(inv.invoiceNumber, /^INV-\d{5}$/);
    assert.equal(inv.status, "DRAFT");
    assert.equal(inv.paidAmount, 0);
    assert.equal(inv.paymentStatus, "PENDING");
    assert.equal(inv.customerId, customer.user.id);
    assert.equal(await prisma.payment.count({ where: { bookingId } }), 0, "no payment is recorded automatically");
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { trip: true } });
    assert.equal(b.totalFare, inv.total);
    assert.equal(b.paymentStatus, "PENDING");
    assert.equal(b.trip?.status, "COMPLETED");
    assert.ok(await eventually(() => prisma.auditLog.findFirst({ where: { entityId: bookingId, action: "INVOICE_GENERATED" } })));

    // Repeated completion is an invalid transition and creates nothing.
    const again = await status(driver.client, bookingId, { status: "TRIP_COMPLETED" });
    assert.equal(again.status, 400);
    assert.equal((await invoicesOf(bookingId)).length, 1);
  });

  test("concurrent completion requests create at most one invoice", async () => {
    const { bookingId } = await bookingAtDrop("race");
    const results = await Promise.all([
      status(driver.client, bookingId, { status: "TRIP_COMPLETED" }),
      status(ops.client, bookingId, { status: "TRIP_COMPLETED" }),
      status(driver.client, bookingId, { status: "TRIP_COMPLETED" }),
    ]);
    const codes = results.map((r) => r.status).sort();
    assert.equal(codes.filter((c) => c === 200).length, 1, JSON.stringify(results.map((r) => [r.status, r.json])));
    assert.ok(codes.every((c) => [200, 400, 409].includes(c)), JSON.stringify(codes));
    assert.equal((await invoicesOf(bookingId)).length, 1);
    assert.equal((await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })).status, "INVOICE_GENERATED");
  });

  test("an existing invoice and its payments are reused unchanged", async () => {
    const { bookingId } = await bookingAtDrop("existing");
    const manual = await finance.client.post("/api/admin/invoices", { bookingId, subtotal: 3700, gst: 185, discount: 0 });
    assert.equal(manual.status, 201, JSON.stringify(manual.json));
    const pay = await finance.client.post("/api/admin/payments", { bookingId, invoiceId: manual.json.id, amount: 500, type: "ADVANCE", method: "CASH", reference: `I-${RUN}` });
    assert.equal(pay.status, 201);
    const invBefore = await prisma.invoice.findUniqueOrThrow({ where: { id: manual.json.id } });
    const payBefore = await prisma.payment.findUniqueOrThrow({ where: { id: pay.json.id } });

    const r = await status(driver.client, bookingId, { status: "TRIP_COMPLETED" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.autoInvoice.status, "existing");
    assert.equal(r.json.autoInvoice.invoiceNumber, invBefore.invoiceNumber);
    assert.equal(r.json.status, "INVOICE_GENERATED");

    assert.deepEqual(await prisma.invoice.findUniqueOrThrow({ where: { id: manual.json.id } }), invBefore, "invoice must not be rewritten");
    assert.deepEqual(await prisma.payment.findUniqueOrThrow({ where: { id: pay.json.id } }), payBefore, "payment must not be rewritten");
    assert.equal((await invoicesOf(bookingId)).length, 1);
  });

  test("bookings without a valid approved quotation complete, are not invoiced, and are flagged", async () => {
    const { bookingId, quotationId } = await bookingAtDrop("legacy");
    // Simulate legacy data: an approved quotation whose stored total disagrees with its lines.
    await prisma.quotation.update({ where: { id: quotationId }, data: { gst: 190 } });

    const r = await status(driver.client, bookingId, { status: "TRIP_COMPLETED" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.status, "TRIP_COMPLETED");
    assert.equal(r.json.autoInvoice.status, "skipped");
    assert.match(r.json.autoInvoice.reason, /inconsistent/);
    assert.equal((await invoicesOf(bookingId)).length, 0);
    assert.ok(await eventually(() => prisma.auditLog.findFirst({ where: { entityId: bookingId, action: "INVOICE_SKIPPED" } })));

    // The manual finance path still works for these bookings.
    const manual = await finance.client.post("/api/admin/invoices", { bookingId, subtotal: 3800, gst: 190, discount: 90 });
    assert.equal(manual.status, 201);
    assert.equal((await status(finance.client, bookingId, { status: "INVOICE_GENERATED" })).status, 200);
  });

  test("unauthorized callers cannot complete trips or create invoices", async () => {
    const { bookingId } = await bookingAtDrop("authz");
    assert.equal((await status(customer.client, bookingId, { status: "TRIP_COMPLETED" })).status, 403);
    assert.equal((await status(otherDriver.client, bookingId, { status: "TRIP_COMPLETED" })).status, 403);
    assert.equal((await status(anon, bookingId, { status: "TRIP_COMPLETED" })).status, 401);
    assert.equal((await driver.client.post("/api/admin/invoices", { bookingId, subtotal: 1, gst: 0 })).status, 401);
    assert.equal((await customer.client.post("/api/admin/invoices", { bookingId, subtotal: 1, gst: 0 })).status, 401);
    assert.equal((await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })).status, "DROP_COMPLETED");
    assert.equal((await invoicesOf(bookingId)).length, 0);

    // Ops managers may complete on the driver's behalf; the invoice is generated the same way.
    const r = await status(ops.client, bookingId, { status: "TRIP_COMPLETED" });
    assert.equal(r.status, 200);
    assert.equal(r.json.autoInvoice.status, "created");
  });

  test("if invoice creation fails, the completion rolls back and can be retried", async () => {
    const { bookingId } = await bookingAtDrop("rollback");
    const fn = `it_fail_invoice_${RUN}`;
    // Test branch only (guarded by assertSafeTarget): make the invoice INSERT fail for this booking.
    await prisma.$executeRawUnsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected invoice failure'; END $$`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER ${fn} BEFORE INSERT ON "Invoice" FOR EACH ROW WHEN (NEW."bookingId" = '${bookingId}') EXECUTE FUNCTION ${fn}()`);
    try {
      const failed = await status(driver.client, bookingId, { status: "TRIP_COMPLETED" });
      assert.equal(failed.status, 500);
      const b = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { trip: true } });
      assert.equal(b.status, "DROP_COMPLETED", "booking status rolled back");
      assert.equal(b.endTime, null);
      assert.equal(b.trip?.status, "REACHED_DESTINATION", "trip status rolled back");
      assert.equal((await invoicesOf(bookingId)).length, 0);
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${fn} ON "Invoice"`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${fn}()`);
    }

    const retry = await status(driver.client, bookingId, { status: "TRIP_COMPLETED" });
    assert.equal(retry.status, 200, JSON.stringify(retry.json));
    assert.equal(retry.json.autoInvoice.status, "created");
    assert.equal((await invoicesOf(bookingId)).length, 1);
  });

  test("invoice numbers stay unique and sequential under parallel completions", async () => {
    const [a, b] = await Promise.all([bookingAtDrop("seqA"), bookingAtDrop("seqB")]);
    const [ra, rb] = await Promise.all([
      status(driver.client, a.bookingId, { status: "TRIP_COMPLETED" }),
      status(driver.client, b.bookingId, { status: "TRIP_COMPLETED" }),
    ]);
    assert.equal(ra.status, 200, JSON.stringify(ra.json));
    assert.equal(rb.status, 200, JSON.stringify(rb.json));
    const nums = [ra.json.autoInvoice.invoiceNumber, rb.json.autoInvoice.invoiceNumber].map((n: string) => parseInt(n.slice(4), 10)).sort((x, y) => x - y);
    assert.equal(nums[1] - nums[0], 1, JSON.stringify(nums));
  });
});
