import { prisma } from "./prisma";
import { COMPLETED_TRIP_STATUSES } from "./booking-lifecycle";
import { roundCurrency } from "./quotation-rules";
import type { BookingStatus } from "@prisma/client";

// Driver settlement calculation from persisted data (P4-3). Business rule (decided 2026-10-14):
//   earnings  = driver allowance (bata) on the trip's APPROVED quotation
//               (falls back to the booking's copied driverAllowance for bookings without a quotation)
//   expenses  = expenses the driver paid for that trip (toll, fuel, parking, ...), reimbursed
//   advance   = advance already paid to the driver for that trip (entered by finance, default 0)
//   netPayable = earnings + expenses − advance
// One settlement per completed trip. Calculation is idempotent: a trip that already has a
// settlement (any status) is never settled again. Runs under a per-driver advisory lock so
// concurrent calculations cannot double-settle a trip.

export class SettlementError extends Error {
  constructor(message: string, public status: 400 | 404 = 400) {
    super(message);
  }
}

export type TripSettlementLine = {
  tripId: string;
  tripNumber: string;
  bookingNumber: string;
  completedAt: Date | null;
  earnings: number;
  expenses: number;
  advancePaid: number;
  netPayable: number;
  earningsSource: "quotation" | "booking" | "none";
};

/** Pure: settlement amounts for one trip. */
export function computeTripSettlement(input: { driverAllowance: number | null | undefined; expenses: number[]; advancePaid?: number }) {
  const earnings = roundCurrency(input.driverAllowance ?? 0);
  const expenses = roundCurrency(input.expenses.reduce((s, e) => s + e, 0));
  const advancePaid = roundCurrency(input.advancePaid ?? 0);
  return { earnings, expenses, advancePaid, netPayable: roundCurrency(earnings + expenses - advancePaid) };
}

export async function calculateDriverSettlements(input: {
  driverId: string;
  from?: Date | null;
  to?: Date | null;
  advances?: Record<string, number>; // tripId -> advance already paid to the driver
  dryRun?: boolean;
}) {
  const driver = await prisma.user.findUnique({ where: { id: input.driverId }, select: { id: true, role: true, name: true } });
  if (!driver || driver.role !== "DRIVER") throw new SettlementError("Driver not found", 404);
  for (const [tripId, amount] of Object.entries(input.advances ?? {})) {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
      throw new SettlementError(`Advance for trip ${tripId} must be a non-negative number`);
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"settlement:driver:" + input.driverId}))`;

    const trips = await tx.trip.findMany({
      where: {
        driverId: input.driverId,
        status: "COMPLETED",
        booking: { status: { in: COMPLETED_TRIP_STATUSES as BookingStatus[] } },
        settlements: { none: {} },
        ...(input.from || input.to
          ? { actualDropTime: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) } }
          : {}),
      },
      orderBy: { actualDropTime: "asc" },
      include: {
        booking: {
          select: {
            id: true, bookingNumber: true, driverAllowance: true,
            quotation: { select: { status: true, driverAllowance: true } },
          },
        },
      },
    });

    const lines: TripSettlementLine[] = [];
    for (const trip of trips) {
      // Expenses the driver paid for this trip (logged against the trip or its booking), counted once.
      const expenses = await tx.expense.findMany({
        where: { paidById: input.driverId, OR: [{ tripId: trip.id }, { bookingId: trip.bookingId }] },
        select: { amount: true },
      });
      const q = trip.booking.quotation;
      const fromQuote = q?.status === "APPROVED" && q.driverAllowance != null;
      const allowance = fromQuote ? q!.driverAllowance : trip.booking.driverAllowance;
      const amounts = computeTripSettlement({
        driverAllowance: allowance,
        expenses: expenses.map((e) => e.amount),
        advancePaid: input.advances?.[trip.id],
      });
      lines.push({
        tripId: trip.id, tripNumber: trip.tripNumber, bookingNumber: trip.booking.bookingNumber,
        completedAt: trip.actualDropTime, ...amounts,
        earningsSource: fromQuote ? "quotation" : allowance != null ? "booking" : "none",
      });
    }

    const created = [];
    if (!input.dryRun) {
      for (const l of lines) {
        created.push(await tx.settlement.create({
          data: {
            tripId: l.tripId, driverId: input.driverId, status: "PENDING",
            totalEarnings: l.earnings, expenses: l.expenses, advancePaid: l.advancePaid, netPayable: l.netPayable,
            notes: `Calculated for ${l.tripNumber} (${l.bookingNumber}): driver allowance from ${l.earningsSource} + reimbursed expenses − advance.`,
          },
        }));
      }
    }

    const totals = lines.reduce(
      (t, l) => ({ earnings: t.earnings + l.earnings, expenses: t.expenses + l.expenses, advancePaid: t.advancePaid + l.advancePaid, netPayable: t.netPayable + l.netPayable }),
      { earnings: 0, expenses: 0, advancePaid: 0, netPayable: 0 }
    );
    return {
      driver: { id: driver.id, name: driver.name },
      dryRun: !!input.dryRun,
      lines,
      settlementIds: created.map((s) => s.id),
      totals: {
        earnings: roundCurrency(totals.earnings), expenses: roundCurrency(totals.expenses),
        advancePaid: roundCurrency(totals.advancePaid), netPayable: roundCurrency(totals.netPayable),
      },
    };
  }, { timeout: 20000, maxWait: 10000 });
}
