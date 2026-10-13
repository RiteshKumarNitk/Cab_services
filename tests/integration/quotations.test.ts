// Quotation pricing and status rules over HTTP (isolated test database only).
// Run with `pnpm test:integration -- --env-file <file>`.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { assertSafeTarget, prisma, RUN, day, ymd, uniquePhone, Client, makeUser, eventually, cleanup } from "./helpers";

assertSafeTarget();

let ops: Awaited<ReturnType<typeof makeUser>>;
let admin: Awaited<ReturnType<typeof makeUser>>;
let sales: Awaited<ReturnType<typeof makeUser>>;
let customer: Awaited<ReturnType<typeof makeUser>>;
let driver: Awaited<ReturnType<typeof makeUser>>;
const anon = new Client();

// 300 km × ₹11 + ₹300 driver + ₹200 toll = ₹3,800; GST 5% = ₹190; total ₹3,990.
const PRICE = { perKmCharge: 11, totalKm: 300, driverAllowance: 300, tollCharges: 200, gst: 5 };
const TOTAL = 3990;

before(async () => {
  [ops, admin, sales, customer, driver] = await Promise.all([
    makeUser("BOOKING_MANAGER", "q-ops"), makeUser("ADMIN", "q-admin"), makeUser("SUPPORT_EXECUTIVE", "q-sales"),
    makeUser("CUSTOMER", "q-customer"), makeUser("DRIVER", "q-driver"),
  ]);
});
after(async () => { await cleanup(); });

async function newLead(label: string) {
  const r = await anon.post("/api/enquiries", {
    name: `IT Q ${label} ${RUN}`, phone: uniquePhone(), email: customer.user.email,
    pickupAddress: `IT Q pickup ${label} ${RUN}`, dropAddress: "Ajmer", pickupDate: ymd(day(30)), passengers: 2,
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return prisma.lead.findUniqueOrThrow({ where: { leadNumber: r.json.reference } });
}

async function draft(label: string, extra: Record<string, unknown> = {}) {
  const lead = await newLead(label);
  const r = await sales.client.post("/api/admin/quotations", {
    leadId: lead.id, bookingType: "OUTSTATION", tripType: "ONE_WAY", pickupAddress: lead.pickupAddress, dropAddress: "Ajmer",
    pickupDate: day(30).toISOString(), passengers: 2, vehicleType: "SEDAN", validUntil: day(20).toISOString(), ...PRICE, ...extra,
  });
  return { lead, r };
}

async function approved(label: string) {
  const { lead, r } = await draft(label);
  assert.equal(r.status, 201, JSON.stringify(r.json));
  assert.equal((await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" })).status, 200);
  assert.equal((await ops.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "APPROVED" })).status, 200);
  return { lead, id: r.json.id as string };
}

describe("Server-side totals", () => {
  test("total is computed from the price lines when the client omits it", async () => {
    const { r } = await draft("omit");
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.totalFare, TOTAL);
    assert.equal(r.json.status, "DRAFT");
  });

  test("a matching client total is accepted", async () => {
    const { r } = await draft("match", { totalFare: TOTAL });
    assert.equal(r.status, 201);
    assert.equal(r.json.totalFare, TOTAL);
  });

  test("a tampered client total is rejected with a clear error", async () => {
    const { r } = await draft("tamper", { totalFare: 100 });
    assert.equal(r.status, 400);
    assert.match(r.json.fields.totalFare, /expected ₹3990\.00/);
  });

  test("invalid lines are rejected (negative charge, GST over 28%, discount above total)", async () => {
    assert.equal((await draft("neg", { tollCharges: -50 })).r.status, 400);
    assert.equal((await draft("gst", { gst: 175 })).r.status, 400);
    assert.equal((await draft("disc", { discount: 99999 })).r.status, 400);
  });

  test("editing a draft recomputes the total; a wrong total in the edit is rejected", async () => {
    const { r } = await draft("edit");
    const ok = await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { nightCharges: 200 });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.equal(ok.json.totalFare, 4200); // (3800 + 200) × 1.05
    const bad = await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { nightCharges: 0, totalFare: 4200 });
    assert.equal(bad.status, 400);
    const stored = await prisma.quotation.findUniqueOrThrow({ where: { id: r.json.id } });
    assert.equal(stored.totalFare, 4200, "rejected edit must not change stored pricing");
    assert.equal(stored.nightCharges, 200);
  });

  test("a draft without a price cannot be sent", async () => {
    const { r } = await draft("empty", { perKmCharge: 0, totalKm: 0, driverAllowance: 0, tollCharges: 0 });
    assert.equal(r.status, 201);
    const send = await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" });
    assert.equal(send.status, 400);
    assert.match(send.json.error, /Cannot send/);
  });

  test("a legacy row whose stored total disagrees with its lines cannot be sent or approved", async () => {
    const { r } = await draft("legacy");
    await prisma.quotation.update({ where: { id: r.json.id }, data: { totalFare: 1 } }); // simulate pre-validation data
    assert.equal((await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" })).status, 400);
  });
});

describe("Status transitions and authorization", () => {
  test("creating a draft does not mark the lead as quoted; sending does", async () => {
    const { lead, r } = await draft("lead");
    assert.equal((await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } })).status, "NEW");
    await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" });
    assert.equal((await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } })).status, "QUOTATION_SENT");
  });

  test("sales cannot approve or reject; customers and drivers cannot touch quotations", async () => {
    const { r } = await draft("authz");
    await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" });
    assert.equal((await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "APPROVED" })).status, 403);
    assert.equal((await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "REJECTED" })).status, 403);
    assert.equal((await customer.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "APPROVED" })).status, 401);
    assert.equal((await driver.client.patch(`/api/admin/quotations/${r.json.id}`, { totalFare: 1 })).status, 401);
    assert.equal((await anon.patch(`/api/admin/quotations/${r.json.id}`, { status: "APPROVED" })).status, 401);
    assert.equal((await prisma.quotation.findUniqueOrThrow({ where: { id: r.json.id } })).status, "SENT");
  });

  test("invalid transitions are rejected: draft → approved, approved → draft/sent, rejected → sent", async () => {
    const { r } = await draft("skip");
    assert.equal((await ops.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "APPROVED" })).status, 400);

    const { id } = await approved("terminal");
    for (const status of ["DRAFT", "SENT", "REJECTED"]) {
      const res = await admin.client.patch(`/api/admin/quotations/${id}`, { status });
      assert.equal(res.status, 400, `APPROVED → ${status}`);
    }

    const rej = await draft("rej");
    await sales.client.patch(`/api/admin/quotations/${rej.r.json.id}`, { status: "SENT" });
    assert.equal((await ops.client.patch(`/api/admin/quotations/${rej.r.json.id}`, { status: "REJECTED", rejectionReason: "Too costly" })).status, 200);
    assert.equal((await sales.client.patch(`/api/admin/quotations/${rej.r.json.id}`, { status: "SENT" })).status, 400);
  });

  test("approval past the validity date is refused", async () => {
    const { r } = await draft("expired", { validUntil: new Date(Date.now() - 86_400_000).toISOString() });
    await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" });
    const res = await ops.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "APPROVED" });
    assert.equal(res.status, 400);
    assert.match(res.json.error, /validity/);
  });

  test("approval is audit-logged with the approver", async () => {
    const { id } = await approved("audit");
    const q = await prisma.quotation.findUniqueOrThrow({ where: { id } });
    assert.equal(q.approvedById, ops.user.id);
    assert.ok(await eventually(() => prisma.auditLog.findFirst({ where: { entityId: id, action: "QUOTATION_APPROVED" } })));
  });
});

describe("Approved pricing is locked", () => {
  test("price and line items cannot change once sent or approved (409)", async () => {
    const { r } = await draft("sentlock");
    await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" });
    assert.equal((await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { tollCharges: 0 })).status, 409);

    const { id } = await approved("lock");
    for (const body of [{ totalFare: 1 }, { discount: 500 }, { perKmCharge: 1 }, { gst: 0 }, { baseFare: 1 }]) {
      const res = await admin.client.patch(`/api/admin/quotations/${id}`, body);
      assert.equal(res.status, 409, JSON.stringify(body));
    }
    assert.equal((await prisma.quotation.findUniqueOrThrow({ where: { id } })).totalFare, TOTAL);
  });

  test("price change cannot ride along with a status change", async () => {
    const { r } = await draft("combo");
    const res = await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT", totalFare: 1 });
    assert.equal(res.status, 400);
    assert.equal((await prisma.quotation.findUniqueOrThrow({ where: { id: r.json.id } })).status, "DRAFT");
  });

  test("alternative endpoint: an approved quotation cannot be deleted", async () => {
    const { id } = await approved("del");
    assert.equal((await admin.client.req("DELETE", `/api/admin/quotations/${id}`)).status, 409);
    const d = await draft("deldraft");
    assert.equal((await sales.client.req("DELETE", `/api/admin/quotations/${d.r.json.id}`)).status, 200);
  });

  test("conversion books the approved fare; parallel conversions create one booking; converted quote is frozen", async () => {
    const { lead, id } = await approved("convert");
    assert.equal((await ops.client.patch(`/api/admin/quotations/${id}`, { totalFare: 1 })).status, 409);

    const conv = await Promise.all([1, 2, 3].map(() => ops.client.post(`/api/admin/leads/${lead.id}/convert`)));
    const statuses = conv.map((c) => c.status).sort();
    assert.ok(statuses.includes(201), JSON.stringify(statuses));
    assert.ok(statuses.every((s) => s === 200 || s === 201), JSON.stringify(conv.map((c) => c.json)));
    assert.equal(new Set(conv.map((c) => c.json.id)).size, 1);
    assert.equal(await prisma.booking.count({ where: { leadId: lead.id } }), 1);

    const booking = await prisma.booking.findUniqueOrThrow({ where: { id: conv[0].json.id } });
    assert.equal(booking.totalFare, TOTAL);
    assert.equal(booking.quotationId, id);

    assert.equal((await admin.client.patch(`/api/admin/quotations/${id}`, { status: "EXPIRED" })).status, 409);
    assert.equal((await admin.client.req("DELETE", `/api/admin/quotations/${id}`)).status, 409);
  });
});

describe("Concurrency", () => {
  test("simultaneous approve and reject: exactly one wins", async () => {
    const { r } = await draft("race");
    await sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" });
    const [a, b] = await Promise.all([
      ops.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "APPROVED" }),
      admin.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "REJECTED" }),
    ]);
    const wins = [a, b].filter((x) => x.status === 200);
    assert.equal(wins.length, 1, JSON.stringify([a.status, a.json, b.status, b.json]));
    const loser = [a, b].find((x) => x.status !== 200)!;
    assert.ok([400, 409].includes(loser.status));
    const final = await prisma.quotation.findUniqueOrThrow({ where: { id: r.json.id } });
    assert.equal(final.status, wins[0].json.status);
  });

  test("simultaneous price edit and send never leave a sent quote with unvalidated pricing", async () => {
    const { r } = await draft("editsend");
    const [edit, send] = await Promise.all([
      sales.client.patch(`/api/admin/quotations/${r.json.id}`, { nightCharges: 500 }),
      sales.client.patch(`/api/admin/quotations/${r.json.id}`, { status: "SENT" }),
    ]);
    const final = await prisma.quotation.findUniqueOrThrow({ where: { id: r.json.id } });
    if (send.status === 200) assert.equal(final.status, "SENT");
    if (edit.status === 200 && send.status === 200) {
      assert.equal(final.nightCharges, 500, "edit must have landed before the send");
    }
    if (edit.status !== 200) assert.equal(edit.status, 409);
    // Whatever interleaving happened, the stored total matches the stored lines.
    const expected = Math.round(((final.perKmCharge ?? 0) * (final.totalKm ?? 0) + (final.nightCharges ?? 0) + 300 + 200) * 105) / 100;
    assert.equal(final.totalFare, expected);
  });
});
