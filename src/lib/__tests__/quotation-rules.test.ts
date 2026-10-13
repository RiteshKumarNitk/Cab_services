import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeQuotationTotals, validatePricing, checkQuotationTransition, canEditPricing, canDeleteQuotation, roundCurrency,
} from "../quotation-rules";

// Jaipur → Ajmer sedan: 300 km × ₹11 + ₹300 driver + ₹200 toll = ₹3,800; GST 5% = ₹190; total ₹3,990.
const trip = { perKmCharge: 11, totalKm: 300, driverAllowance: 300, tollCharges: 200, gst: 5 };

describe("computeQuotationTotals (calculator rule)", () => {
  test("vehicle charge + charges, GST on subtotal, discount after GST", () => {
    assert.deepEqual(computeQuotationTotals(trip), { vehicleCharge: 3300, subtotal: 3800, gstAmount: 190, total: 3990 });
    assert.equal(computeQuotationTotals({ ...trip, discount: 90 }).total, 3900);
  });

  test("baseFare is informational and not part of the total", () => {
    assert.equal(computeQuotationTotals({ ...trip, baseFare: 5000 }).total, 3990);
  });

  test("rounds to paise", () => {
    assert.equal(computeQuotationTotals({ perKmCharge: 11.5, totalKm: 333.3, gst: 5 }).total, roundCurrency(11.5 * 333.3 * 1.05));
    assert.equal(roundCurrency(0.1 + 0.2), 0.3);
  });
});

describe("validatePricing", () => {
  test("computes the total when the client omits it", () => {
    const r = validatePricing(trip);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.pricing.totalFare, 3990);
  });

  test("accepts a matching client total (floating point within a paisa)", () => {
    assert.equal(validatePricing({ ...trip, totalFare: 3990.0000001 }).ok, true);
  });

  test("rejects a tampered client total", () => {
    const r = validatePricing({ ...trip, totalFare: 1 });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.fields.totalFare, /expected ₹3990\.00/);
  });

  test("rejects negative amounts, non-numbers, GST above 28% and oversized discounts", () => {
    assert.equal(validatePricing({ ...trip, tollCharges: -1 }).ok, false);
    assert.equal(validatePricing({ ...trip, nightCharges: Number.NaN }).ok, false);
    const gst = validatePricing({ ...trip, gst: 175 });
    assert.equal(gst.ok, false);
    if (!gst.ok) assert.ok(gst.fields.gst);
    assert.equal(validatePricing({ ...trip, discount: 5000 }).ok, false);
  });

  test("a positive total can be required (send/approve)", () => {
    assert.equal(validatePricing({}, { requirePositiveTotal: true }).ok, false);
    assert.equal(validatePricing({}).ok, true); // an empty draft is allowed
  });
});

describe("checkQuotationTransition", () => {
  const base = { hasBooking: false, validUntil: null };

  test("allowed path: draft → sent → approved", () => {
    assert.deepEqual(checkQuotationTransition({ ...base, from: "DRAFT", to: "SENT", role: "SUPPORT_EXECUTIVE" }), { ok: true });
    assert.deepEqual(checkQuotationTransition({ ...base, from: "SENT", to: "APPROVED", role: "BOOKING_MANAGER" }), { ok: true });
    assert.deepEqual(checkQuotationTransition({ ...base, from: "UNDER_REVIEW", to: "REJECTED", role: "ADMIN" }), { ok: true });
  });

  test("sales cannot approve, reject, review or expire", () => {
    for (const to of ["APPROVED", "REJECTED", "UNDER_REVIEW", "EXPIRED"]) {
      const r = checkQuotationTransition({ ...base, from: "SENT", to, role: "SUPPORT_EXECUTIVE" });
      assert.equal(r.ok, false, to);
      if (!r.ok) assert.equal(r.status, 403);
    }
  });

  test("approved, rejected and expired are terminal; approved never returns to draft", () => {
    for (const from of ["APPROVED", "REJECTED", "EXPIRED"]) {
      for (const to of ["DRAFT", "SENT", "APPROVED", "UNDER_REVIEW"]) {
        if (from === to) continue;
        const r = checkQuotationTransition({ ...base, from, to, role: "SUPER_ADMIN" });
        assert.equal(r.ok, false, `${from} → ${to}`);
      }
    }
  });

  test("draft cannot be approved without being sent", () => {
    assert.equal(checkQuotationTransition({ ...base, from: "DRAFT", to: "APPROVED", role: "ADMIN" }).ok, false);
  });

  test("an expired validity date blocks approval", () => {
    const r = checkQuotationTransition({ ...base, from: "SENT", to: "APPROVED", role: "ADMIN", validUntil: new Date("2026-01-01"), now: new Date("2026-02-01") });
    assert.equal(r.ok, false);
  });

  test("a converted quotation cannot change at all", () => {
    const r = checkQuotationTransition({ hasBooking: true, validUntil: null, from: "SENT", to: "REJECTED", role: "ADMIN" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 409);
  });

  test("customers and drivers cannot transition anything", () => {
    assert.equal(checkQuotationTransition({ ...base, from: "DRAFT", to: "SENT", role: "CUSTOMER" }).ok, false);
  });
});

describe("pricing lock and deletion", () => {
  test("pricing is editable only in draft", () => {
    assert.equal(canEditPricing("DRAFT"), true);
    for (const s of ["SENT", "UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"]) assert.equal(canEditPricing(s), false, s);
  });

  test("only unconverted drafts can be deleted", () => {
    assert.equal(canDeleteQuotation("DRAFT", false), true);
    assert.equal(canDeleteQuotation("DRAFT", true), false);
    assert.equal(canDeleteQuotation("APPROVED", false), false);
  });
});
