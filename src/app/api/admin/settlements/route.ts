import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";

import { FINANCE_ROLES, FINANCE_READ_ROLES, hasRole } from "@/lib/authz";

const READ_ROLES = FINANCE_READ_ROLES;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, READ_ROLES)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const pp = parsePageParams(searchParams);
  const driverId = searchParams.get("driverId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (driverId) where.driverId = driverId;
  if (status) where.status = status;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.createdAt = dateFilter;
  }

  const settlements = await prisma.settlement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pp.skip,
    take: pp.take,
    include: {
      driver: { select: { name: true, email: true, phone: true } },
      trip: { select: { id: true, status: true } },
    },
  });

  return listResponse("settlements", settlements, pp, () => prisma.settlement.count({ where }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const netPayable = (body.totalEarnings || 0) - (body.advancePaid || 0) - (body.expenses || 0);

    const settlement = await prisma.settlement.create({
      data: {
        tripId: body.tripId || null,
        driverId: body.driverId,
        totalEarnings: body.totalEarnings || 0,
        advancePaid: body.advancePaid || 0,
        expenses: body.expenses || 0,
        netPayable,
        status: body.status || "PENDING",
        notes: body.notes || null,
      },
      include: {
        driver: { select: { name: true } },
      },
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Error creating settlement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "Settlement ID required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (updates.status) data.status = updates.status;
    if (updates.notes) data.notes = updates.notes;
    if (updates.status === "PAID") data.paidAt = new Date();

    const settlement = await prisma.settlement.update({
      where: { id },
      data,
    });

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("Error updating settlement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
