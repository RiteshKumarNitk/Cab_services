// Pure quotation business rules (no database access, unit tested).
//
// Pricing follows the existing quotation calculator (src/app/admin/quotations/[id]/page.tsx):
//   vehicle charge = perKmCharge × totalKm
//   subtotal       = vehicle charge + night + driver allowance + parking + toll + permit + state tax
//   GST            = subtotal × gst / 100        (Quotation.gst stores the GST RATE in %)
//   total          = subtotal + GST − discount   (discount is a ₹ amount applied after GST)
// `baseFare` is shown in the calculator but is not part of the total (see IMPLEMENTATION_PLAN D11).
//
// Status transitions follow the actions the existing UI offers (D12 lists the open questions):
//   DRAFT → SENT                       (sales or manager; pricing must be valid)
//   SENT → UNDER_REVIEW | APPROVED | REJECTED | EXPIRED      (managers)
//   UNDER_REVIEW → APPROVED | REJECTED | EXPIRED             (managers)
//   APPROVED, REJECTED, EXPIRED: terminal (revise by creating a new quotation)
// Pricing can only change in DRAFT; an approved price is therefore locked.

import { CRM_ROLES } from "./authz-roles";

export const PRICING_FIELDS = [
  "baseFare", "perKmCharge", "totalKm", "nightCharges", "driverAllowance", "parkingCharges",
  "tollCharges", "permitCharges", "stateTax", "discount", "gst", "totalFare",
] as const;
export type PricingField = (typeof PRICING_FIELDS)[number];
export type Pricing = Partial<Record<PricingField, number | null>>;

/** Roles that may create, edit and send quotations. */
export const QUOTATION_ROLES = CRM_ROLES;
/** Roles that may approve, reject, review or expire quotations. */
export const QUOTATION_APPROVER_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"];

export const MAX_GST_RATE = 28; // highest Indian GST slab
/** Currency tolerance when comparing a client total with the server total (₹). */
export const TOTAL_TOLERANCE = 0.01;

/** Round to paise (2 decimals) the way a rupee amount is stored. */
export const roundCurrency = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function computeQuotationTotals(p: Pricing) {
  const vehicleCharge = roundCurrency(num(p.perKmCharge) * num(p.totalKm));
  const subtotal = roundCurrency(
    vehicleCharge + num(p.nightCharges) + num(p.driverAllowance) + num(p.parkingCharges) +
      num(p.tollCharges) + num(p.permitCharges) + num(p.stateTax)
  );
  const gstAmount = roundCurrency((subtotal * num(p.gst)) / 100);
  const total = roundCurrency(subtotal + gstAmount - num(p.discount));
  return { vehicleCharge, subtotal, gstAmount, total };
}

export type PricingCheck =
  | { ok: true; pricing: Pricing; totals: ReturnType<typeof computeQuotationTotals> }
  | { ok: false; error: string; fields: Record<string, string> };

/**
 * Validate the pricing a client sent (merged over the stored values) and return the
 * normalized pricing with the server-computed `totalFare`. A client `totalFare` is accepted
 * only if it matches the server total within one paisa.
 */
export function validatePricing(input: Pricing, opts: { requirePositiveTotal?: boolean } = {}): PricingCheck {
  const fields: Record<string, string> = {};
  const pricing: Pricing = {};

  for (const f of PRICING_FIELDS) {
    const v = input[f];
    if (v === undefined || v === null) {
      pricing[f] = v ?? null;
      continue;
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
      fields[f] = "Must be a number";
    } else if (v < 0) {
      fields[f] = "Cannot be negative";
    } else {
      pricing[f] = f === "totalKm" || f === "perKmCharge" || f === "gst" ? v : roundCurrency(v);
    }
  }
  if (typeof pricing.gst === "number" && pricing.gst > MAX_GST_RATE) {
    fields.gst = `GST is a rate in %, between 0 and ${MAX_GST_RATE}`;
  }

  const totals = computeQuotationTotals(pricing);
  if (num(pricing.discount) > totals.subtotal + totals.gstAmount) {
    fields.discount = "Discount cannot exceed the subtotal plus GST";
  }
  if (typeof input.totalFare === "number" && Number.isFinite(input.totalFare) &&
      Math.abs(roundCurrency(input.totalFare) - totals.total) > TOTAL_TOLERANCE) {
    fields.totalFare = `Total does not match the price lines: expected ₹${totals.total.toFixed(2)}`;
  }
  if (opts.requirePositiveTotal && totals.total <= 0) {
    fields.totalFare = "Quotation total must be greater than zero";
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, error: "Quotation pricing is invalid", fields };
  }
  return { ok: true, pricing: { ...pricing, totalFare: totals.total }, totals };
}

export const QUOTATION_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "EXPIRED"],
  APPROVED: [],
  REJECTED: [],
  EXPIRED: [],
};

const MANAGER_ONLY_TARGETS = ["UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"];

export type TransitionCheck = { ok: true } | { ok: false; status: 400 | 403 | 409; error: string };

export function checkQuotationTransition(input: {
  from: string; to: string; role: string; validUntil?: Date | null; hasBooking: boolean; now?: Date;
}): TransitionCheck {
  const { from, to, role } = input;
  if (input.hasBooking) {
    return { ok: false, status: 409, error: "Quotation is already converted to a booking and cannot change" };
  }
  if (!(QUOTATION_TRANSITIONS[from] ?? []).includes(to)) {
    return { ok: false, status: 400, error: `Cannot change quotation from ${from} to ${to}` };
  }
  if (MANAGER_ONLY_TARGETS.includes(to) && !QUOTATION_APPROVER_ROLES.includes(role)) {
    return { ok: false, status: 403, error: "Only managers can review, approve, reject or expire quotations" };
  }
  if (!QUOTATION_ROLES.includes(role) && !QUOTATION_APPROVER_ROLES.includes(role)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  if (to === "APPROVED" && input.validUntil && input.validUntil < (input.now ?? new Date())) {
    return { ok: false, status: 400, error: "Quotation has passed its validity date; create a revised quotation" };
  }
  return { ok: true };
}

/** Pricing is editable only while the quotation is a draft. */
export const canEditPricing = (status: string) => status === "DRAFT";

/** Only unconverted drafts may be deleted; anything a customer saw stays for the audit trail. */
export const canDeleteQuotation = (status: string, hasBooking: boolean) => status === "DRAFT" && !hasBooking;
