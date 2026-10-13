import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { enquirySchema, normalizeIndianPhone, fieldErrors } from "../enquiry-validation";

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const valid = () => ({
  name: "Rajesh Sharma",
  phone: "98765 43210",
  pickupAddress: "Bani Park, Jaipur",
  dropAddress: "Delhi",
  pickupDate: tomorrow(),
  passengers: "2",
});

describe("normalizeIndianPhone", () => {
  test("accepts common Indian mobile formats", () => {
    assert.equal(normalizeIndianPhone("9876543210"), "+919876543210");
    assert.equal(normalizeIndianPhone("+91 98765-43210"), "+919876543210");
    assert.equal(normalizeIndianPhone("09876543210"), "+919876543210");
  });

  test("rejects invalid numbers", () => {
    assert.equal(normalizeIndianPhone("12345"), null);
    assert.equal(normalizeIndianPhone("1234567890"), null); // must start 6-9
    assert.equal(normalizeIndianPhone(""), null);
  });
});

describe("enquirySchema", () => {
  test("parses a valid enquiry and normalizes values", () => {
    const r = enquirySchema.safeParse(valid());
    assert.equal(r.success, true);
    if (r.success) {
      assert.equal(r.data.phone, "+919876543210");
      assert.equal(r.data.passengers, 2);
      assert.equal(r.data.tripType, "ONE_WAY");
      assert.ok(r.data.pickupDate instanceof Date);
      assert.equal(r.data.email, undefined);
    }
  });

  test("rejects past pickup dates", () => {
    const r = enquirySchema.safeParse({ ...valid(), pickupDate: "2020-01-01" });
    assert.equal(r.success, false);
    if (!r.success) assert.ok(fieldErrors(r.error).pickupDate);
  });

  test("round trip requires a return date after pickup", () => {
    const missing = enquirySchema.safeParse({ ...valid(), tripType: "ROUND_TRIP" });
    assert.equal(missing.success, false);
    if (!missing.success) assert.ok(fieldErrors(missing.error).returnDate);

    const before = enquirySchema.safeParse({ ...valid(), tripType: "ROUND_TRIP", returnDate: "2020-01-01" });
    assert.equal(before.success, false);
  });

  test("rejects missing name and bad phone with field messages", () => {
    const r = enquirySchema.safeParse({ ...valid(), name: " ", phone: "123" });
    assert.equal(r.success, false);
    if (!r.success) {
      const f = fieldErrors(r.error);
      assert.ok(f.name);
      assert.match(f.phone, /10-digit/);
    }
  });

  test("honeypot field filled by bots is rejected", () => {
    const r = enquirySchema.safeParse({ ...valid(), website: "http://spam.example" });
    assert.equal(r.success, false);
  });

  test("rejects unknown vehicle types", () => {
    const r = enquirySchema.safeParse({ ...valid(), preferredVehicle: "SPACESHIP" });
    assert.equal(r.success, false);
  });

  test("empty optional email is allowed, invalid email is not", () => {
    assert.equal(enquirySchema.safeParse({ ...valid(), email: "" }).success, true);
    assert.equal(enquirySchema.safeParse({ ...valid(), email: "not-an-email" }).success, false);
  });
});
