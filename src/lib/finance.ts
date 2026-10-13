import type { InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";

/** Net amount received from a list of payments: refunds are money paid back out. */
export function netPaid(payments: Array<{ amount: number; type: string }>): number {
  const total = payments.reduce((sum, p) => sum + (p.type === "REFUND" ? -p.amount : p.amount), 0);
  return Math.round(total * 100) / 100;
}

/** Invoice payment/status fields implied by the amount actually received. */
export function invoicePaymentState(
  invoice: { total: number; status: InvoiceStatus },
  paid: number
): { paidAmount: number; paymentStatus: PaymentStatus; status: InvoiceStatus } {
  const paymentStatus: PaymentStatus = paid >= invoice.total && invoice.total > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
  let status = invoice.status;
  if (status !== "CANCELLED") {
    if (paymentStatus === "PAID") status = "PAID";
    else if (paymentStatus === "PARTIAL") status = "PARTIALLY_PAID";
    else if (status === "PAID" || status === "PARTIALLY_PAID") status = "SENT";
  }
  return { paidAmount: paid, paymentStatus, status };
}

/** Booking.paymentStatus implied by the amount received against the booking's fare. */
export function bookingPaymentStatus(totalFare: number | null | undefined, paid: number): PaymentStatus {
  if (paid <= 0) return "PENDING";
  if (totalFare && paid >= totalFare) return "PAID";
  return "PARTIAL";
}

/** Recompute a booking's payment status from all payments recorded against it. */
export async function recalculateBookingPayment(tx: Prisma.TransactionClient, bookingId: string) {
  const booking = await tx.booking.findUniqueOrThrow({
    where: { id: bookingId },
    select: { totalFare: true, fare: true, payments: { select: { amount: true, type: true } } },
  });
  const status = bookingPaymentStatus(booking.totalFare ?? booking.fare, netPaid(booking.payments));
  return tx.booking.update({ where: { id: bookingId }, data: { paymentStatus: status } });
}

/** Recompute an invoice's paid amount and status from its recorded payments. */
export async function recalculateInvoicePaid(tx: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { total: true, status: true, payments: { select: { amount: true, type: true } } },
  });
  const paid = netPaid(invoice.payments);
  const state = invoicePaymentState(invoice, paid);
  return tx.invoice.update({
    where: { id: invoiceId },
    data: { ...state, paidAt: state.paymentStatus === "PAID" ? new Date() : null },
  });
}
