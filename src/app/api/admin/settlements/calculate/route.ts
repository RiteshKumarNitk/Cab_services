import { NextResponse } from "next/server";
import { requireRole, FINANCE_ROLES } from "@/lib/authz";
import { calculateDriverSettlements, SettlementError } from "@/lib/settlements";
import { eventBus, createEvent } from "@/lib/event-bus";

// POST { driverId, from?, to?, advances?: { [tripId]: amount }, dryRun? }
// Calculates one PENDING settlement per completed, not-yet-settled trip of the driver
// (earnings = approved quotation's driver allowance + reimbursed driver expenses − advance).
// `dryRun: true` returns the calculation without writing anything.
export async function POST(req: Request) {
  const { session, error } = await requireRole(FINANCE_ROLES);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.driverId !== "string" || !body.driverId) {
      return NextResponse.json({ error: "driverId is required" }, { status: 400 });
    }
    const parseDate = (v: unknown) => {
      if (v == null || v === "") return null;
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) throw new SettlementError("from/to must be valid dates");
      return d;
    };
    const result = await calculateDriverSettlements({
      driverId: body.driverId,
      from: parseDate(body.from),
      to: parseDate(body.to),
      advances: body.advances && typeof body.advances === "object" ? body.advances : undefined,
      dryRun: body.dryRun === true,
    });

    if (!result.dryRun && result.settlementIds.length > 0) {
      eventBus.emit(createEvent("SETTLEMENTS_CALCULATED", {
        entityId: body.driverId, settlementIds: result.settlementIds, netPayable: result.totals.netPayable,
      }, { userId: session.user.id }));
    }
    return NextResponse.json(result, { status: result.dryRun || result.settlementIds.length === 0 ? 200 : 201 });
  } catch (err) {
    if (err instanceof SettlementError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Error calculating settlements:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
