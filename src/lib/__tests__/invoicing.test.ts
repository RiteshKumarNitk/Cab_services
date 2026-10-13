import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { planAutoInvoice } from "../invoicing";

// 300 km × ₹11 + ₹300 + ₹200 = ₹3,800; GST 5% = ₹190; discount ₹90 → ₹3,900.
const quote = {
  status: "APPROVED", quotationNumber: "QT-TEST", perKmCharge: 11, totalKm: 300, driverAllowance: 300,
  tollCharges: 200, gst: 5, discount: 90, totalFare: 3900,
};

describe("planAutoInvoice", () => {
  test("invoices the approved quotation's server-computed amounts", () => {
    assert.deepEqual(planAutoInvoice({ bookingTotalFare: 3900, quotation: quote }), {
      ok: true, quotationNumber: "QT-TEST", amounts: { subtotal: 3800, gst: 190, discount: 90, total: 3900 },
    });
  });

  test("skips bookings without a quotation", () => {
    const r = planAutoInvoice({ bookingTotalFare: 3900, quotation: null });
    assert.equal(r.ok, false);
  });

  test("skips quotations that are not approved", () => {
    const r = planAutoInvoice({ bookingTotalFare: 3900, quotation: { ...quote, status: "SENT" } });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /SENT/);
  });

  test("skips legacy quotations whose stored total disagrees with their lines", () => {
    const r = planAutoInvoice({ bookingTotalFare: 3900, quotation: { ...quote, totalFare: 1 } });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /inconsistent/);
  });

  test("skips GST stored as an amount instead of a rate (legacy demo data)", () => {
    assert.equal(planAutoInvoice({ bookingTotalFare: 3900, quotation: { ...quote, gst: 190 } }).ok, false);
  });

  test("skips when the booking fare differs from the approved total", () => {
    const r = planAutoInvoice({ bookingTotalFare: 5000, quotation: quote });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /differs/);
    assert.equal(planAutoInvoice({ bookingTotalFare: null, quotation: quote }).ok, false);
  });

  test("tolerates a paisa of floating-point noise in the booking fare", () => {
    assert.equal(planAutoInvoice({ bookingTotalFare: 3900.004, quotation: quote }).ok, true);
  });
});
