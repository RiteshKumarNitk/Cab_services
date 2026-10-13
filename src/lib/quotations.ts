import { prisma } from "./prisma";
import { eventBus, createEvent } from "./event-bus";
import {
  PRICING_FIELDS, canDeleteQuotation, canEditPricing, checkQuotationTransition, validatePricing,
  type Pricing, type PricingField,
} from "./quotation-rules";
import type { BookingType, Prisma, QuotationStatus, TripType, VehicleType } from "@prisma/client";

// Quotation service: the only code path that writes quotations (API routes are thin wrappers).
// Rules live in quotation-rules.ts. Concurrency: every update is a conditional write on the row's
// status and updatedAt, so a concurrent edit/approval cannot slip in between read and write.

export class QuotationError extends Error {
  constructor(message: string, public status: 400 | 403 | 404 | 409, public fields?: Record<string, string>) {
    super(message);
  }
}

type Actor = { id: string; role: string };

function pickPricing(body: Record<string, unknown>): { present: boolean; pricing: Pricing } {
  const pricing: Pricing = {};
  let present = false;
  for (const f of PRICING_FIELDS) {
    if (body[f] !== undefined) {
      present = true;
      const v = body[f];
      pricing[f] = v === null || v === "" ? null : (typeof v === "string" ? Number(v) : (v as number));
    }
  }
  return { present, pricing };
}

function storedPricing(q: Record<PricingField, number | null>): Pricing {
  const p: Pricing = {};
  for (const f of PRICING_FIELDS) p[f] = q[f];
  return p;
}

const LEAD_STATUSES_BEFORE_QUOTE = ["NEW", "CONTACTED", "QUALIFIED"] as const;

export async function createQuotation(body: Record<string, unknown>, actor: Actor) {
  const { pricing } = pickPricing(body);
  const check = validatePricing(pricing);
  if (!check.ok) throw new QuotationError(check.error, 400, check.fields);

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber: `QT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      status: "DRAFT",
      leadId: (body.leadId as string) ?? null,
      createdById: actor.id,
      bookingType: ((body.bookingType as string) ?? "LOCAL") as BookingType,
      tripType: ((body.tripType as string) ?? "ONE_WAY") as TripType,
      validUntil: body.validUntil ? new Date(body.validUntil as string) : null,
      pickupAddress: (body.pickupAddress as string) ?? null,
      dropAddress: (body.dropAddress as string) ?? null,
      pickupDate: body.pickupDate ? new Date(body.pickupDate as string) : null,
      returnDate: body.returnDate ? new Date(body.returnDate as string) : null,
      passengers: (body.passengers as number) ?? null,
      vehicleType: ((body.vehicleType as string) ?? null) as VehicleType | null,
      ...check.pricing,
      notes: (body.notes as string) ?? null,
      branchId: (body.branchId as string) ?? null,
    },
    include: {
      lead: { select: { id: true, name: true, phone: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  eventBus.emit(createEvent("QUOTATION_CREATED", { entityId: quotation.id, leadId: quotation.leadId, totalFare: quotation.totalFare }, { userId: actor.id }));
  return quotation;
}

/**
 * Update pricing/notes OR change status (one per request). Pricing is editable only in DRAFT;
 * status changes follow QUOTATION_TRANSITIONS and re-validate the stored pricing.
 */
export async function updateQuotation(id: string, body: Record<string, unknown>, actor: Actor) {
  const current = await prisma.quotation.findUnique({
    where: { id },
    include: { booking: { select: { id: true } }, lead: { select: { id: true, status: true } } },
  });
  if (!current) throw new QuotationError("Quotation not found", 404);

  const { present: pricingChange, pricing } = pickPricing(body);
  const newStatus = typeof body.status === "string" ? body.status : undefined;

  if (pricingChange && newStatus && newStatus !== current.status) {
    throw new QuotationError("Save pricing and change status in separate requests", 400);
  }

  const data: Prisma.QuotationUncheckedUpdateManyInput = {};
  let event: { type: "QUOTATION_APPROVED" | "QUOTATION_REJECTED"; } | null = null;
  let markLeadQuoted = false;

  if (pricingChange) {
    if (current.booking || !canEditPricing(current.status)) {
      throw new QuotationError(`Pricing is locked once a quotation is ${current.booking ? "converted" : current.status.toLowerCase()}. Create a revised quotation instead.`, 409);
    }
    const check = validatePricing({ ...storedPricing(current), totalFare: undefined, ...pricing });
    if (!check.ok) throw new QuotationError(check.error, 400, check.fields);
    Object.assign(data, check.pricing);
  }

  if (newStatus && newStatus !== current.status) {
    const t = checkQuotationTransition({
      from: current.status, to: newStatus, role: actor.role, validUntil: current.validUntil, hasBooking: !!current.booking,
    });
    if (!t.ok) throw new QuotationError(t.error, t.status);

    if (newStatus === "SENT" || newStatus === "APPROVED") {
      // The stored price lines must be complete and the stored total must match them.
      const check = validatePricing(storedPricing(current), { requirePositiveTotal: true });
      if (!check.ok) throw new QuotationError(`Cannot ${newStatus === "SENT" ? "send" : "approve"}: ${check.error}`, 400, check.fields);
    }
    data.status = newStatus as QuotationStatus;
    if (newStatus === "APPROVED") {
      data.approvedById = actor.id;
      data.approvedAt = new Date();
      event = { type: "QUOTATION_APPROVED" };
    }
    if (newStatus === "REJECTED") {
      data.rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason : null;
      event = { type: "QUOTATION_REJECTED" };
    }
    if (newStatus === "SENT" && current.lead && (LEAD_STATUSES_BEFORE_QUOTE as readonly string[]).includes(current.lead.status)) {
      markLeadQuoted = true;
    }
  }

  if (body.notes !== undefined) data.notes = (body.notes as string) ?? null;
  if (Object.keys(data).length === 0) return prisma.quotation.findUniqueOrThrow({ where: { id } });

  await prisma.$transaction(async (tx) => {
    // Optimistic lock: only write if nobody changed the quotation since we read it.
    const res = await tx.quotation.updateMany({
      where: { id, status: current.status, updatedAt: current.updatedAt },
      data,
    });
    if (res.count === 0) {
      throw new QuotationError("Quotation was changed by someone else. Reload and try again.", 409);
    }
    if (markLeadQuoted) {
      await tx.lead.updateMany({
        where: { id: current.lead!.id, status: { in: [...LEAD_STATUSES_BEFORE_QUOTE] } },
        data: { status: "QUOTATION_SENT" },
      });
    }
  });

  if (event) {
    eventBus.emit(createEvent(event.type, { entityId: id, leadId: current.leadId, totalFare: current.totalFare }, { userId: actor.id }));
  }
  return prisma.quotation.findUniqueOrThrow({ where: { id } });
}

export async function deleteQuotation(id: string) {
  const current = await prisma.quotation.findUnique({ where: { id }, include: { booking: { select: { id: true } } } });
  if (!current) throw new QuotationError("Quotation not found", 404);
  if (!canDeleteQuotation(current.status, !!current.booking)) {
    throw new QuotationError(`Only draft quotations can be deleted (this one is ${current.booking ? "converted" : current.status}).`, 409);
  }
  const res = await prisma.quotation.deleteMany({ where: { id, status: "DRAFT", updatedAt: current.updatedAt } });
  if (res.count === 0) throw new QuotationError("Quotation was changed by someone else. Reload and try again.", 409);
}
