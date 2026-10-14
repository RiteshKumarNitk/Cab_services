import type { Prisma, QuotationStatus } from "@prisma/client";
import { TOTAL_TOLERANCE, roundCurrency, validatePricing, type Pricing } from "./quotation-rules";
import { recalculateInvoicePaid } from "./finance";

// Invoice generation shared by the automatic path (trip completion, spec §9) and the manual
// finance endpoint. Rules:
//  * Amounts come from the booking's APPROVED quotation via the server pricing rule
//    (quotation-rules.ts); nothing is taken from the client.
//  * One active (non-cancelled) invoice per booking. Both paths take the same per-booking
//    advisory lock before checking, so concurrent requests cannot create a second invoice.
//  * Invoice numbers (INV-00001, ...) are allocated under a global advisory lock.
//  * A new invoice is never paid: paid amounts only ever come from recorded payments.

type Tx = Prisma.TransactionClient;

export type InvoiceAmounts = { subtotal: number; gst: number; discount: number; total: number };

export type AutoInvoicePlan =
  | { ok: true; amounts: InvoiceAmounts; quotationNumber: string }
  | { ok: false; reason: string };

type QuoteForInvoice = Pricing & { status: QuotationStatus | string; quotationNumber: string };

/** Decide whether a completed booking can be invoiced automatically, and for how much. */
export function planAutoInvoice(input: { bookingTotalFare: number | null; quotation: QuoteForInvoice | null }): AutoInvoicePlan {
  const q = input.quotation;
  if (!q) return { ok: false, reason: "Booking has no quotation; invoice it manually" };
  if (q.status !== "APPROVED") return { ok: false, reason: `Quotation ${q.quotationNumber} is ${q.status}, not APPROVED` };

  const check = validatePricing(q, { requirePositiveTotal: true });
  if (!check.ok) {
    return { ok: false, reason: `Quotation ${q.quotationNumber} pricing is inconsistent (${Object.values(check.fields)[0]}); invoice it manually` };
  }
  const { subtotal, gstAmount, total } = check.totals;
  if (input.bookingTotalFare == null || Math.abs(roundCurrency(input.bookingTotalFare) - total) > TOTAL_TOLERANCE) {
    return { ok: false, reason: `Booking fare ₹${input.bookingTotalFare ?? "—"} differs from approved quotation total ₹${total.toFixed(2)}` };
  }
  return {
    ok: true,
    quotationNumber: q.quotationNumber,
    amounts: { subtotal, gst: gstAmount, discount: roundCurrency(check.pricing.discount ?? 0), total },
  };
}

/** Serialize invoice creation for one booking until the surrounding transaction ends. */
export async function lockBookingInvoicing(tx: Tx, bookingId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"invoice:booking:" + bookingId}))`;
}

export async function findActiveInvoice(tx: Tx, bookingId: string) {
  return tx.invoice.findFirst({ where: { bookingId, status: { not: "CANCELLED" } } });
}

/** Next sequential invoice number, allocated under a global lock (no retry loop needed). */
export async function nextInvoiceNumber(tx: Tx): Promise<string> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('invoice:number'))`;
  const rows = await tx.$queryRaw<Array<{ invoiceNumber: string }>>`
    SELECT "invoiceNumber" FROM "Invoice"
    WHERE "invoiceNumber" ~ '^INV-[0-9]+$'
    ORDER BY length("invoiceNumber") DESC, "invoiceNumber" DESC
    LIMIT 1`;
  const last = rows[0] ? parseInt(rows[0].invoiceNumber.slice(4), 10) : 0;
  return `INV-${String(last + 1).padStart(5, "0")}`;
}

export async function createInvoiceRecord(tx: Tx, input: {
  bookingId: string | null; customerId: string | null; branchId?: string | null; amounts: InvoiceAmounts;
  status?: "DRAFT" | "SENT"; dueDate?: Date | null; paymentMethod?: string | null; notes?: string | null;
}) {
  return tx.invoice.create({
    data: {
      invoiceNumber: await nextInvoiceNumber(tx),
      bookingId: input.bookingId,
      customerId: input.customerId,
      branchId: input.branchId ?? null,
      status: input.status ?? "DRAFT",
      subtotal: input.amounts.subtotal,
      gst: input.amounts.gst,
      discount: input.amounts.discount,
      total: input.amounts.total,
      paidAmount: 0,
      paymentStatus: "PENDING",
      dueDate: input.dueDate ?? null,
      paymentMethod: (input.paymentMethod ?? null) as never,
      notes: input.notes ?? null,
    },
  });
}

export type AutoInvoiceResult =
  | { status: "created"; invoiceId: string; invoiceNumber: string; total: number; linkedPayments: number }
  | { status: "existing"; invoiceId: string; invoiceNumber: string; total: number }
  | { status: "skipped"; reason: string };

/**
 * Run inside the trip-completion transaction. Reuses an existing active invoice (unchanged),
 * otherwise creates one from the approved quotation (attaching the booking's unlinked advance
 * payments), otherwise reports why it was skipped.
 * Any database error propagates so the whole completion rolls back.
 */
export async function ensureInvoiceOnCompletion(
  tx: Tx,
  booking: { id: string; customerId: string; branchId: string | null },
  plan: AutoInvoicePlan
): Promise<AutoInvoiceResult> {
  await lockBookingInvoicing(tx, booking.id);
  const existing = await findActiveInvoice(tx, booking.id);
  if (existing) {
    return { status: "existing", invoiceId: existing.id, invoiceNumber: existing.invoiceNumber, total: existing.total };
  }
  if (!plan.ok) return { status: "skipped", reason: plan.reason };

  const invoice = await createInvoiceRecord(tx, {
    bookingId: booking.id,
    customerId: booking.customerId,
    branchId: booking.branchId,
    amounts: plan.amounts,
    notes: `Auto-generated on trip completion from approved quotation ${plan.quotationNumber}.`,
  });

  // D14: advances already recorded against this booking but not yet on any invoice belong to this
  // invoice. Payments on another invoice are never moved. The balance then follows those payments.
  const linked = await tx.payment.updateMany({
    where: { bookingId: booking.id, invoiceId: null },
    data: { invoiceId: invoice.id },
  });
  if (linked.count > 0) await recalculateInvoicePaid(tx, invoice.id);

  return { status: "created", invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, total: invoice.total, linkedPayments: linked.count };
}
