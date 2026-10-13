import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";

import { FINANCE_ROLES, FINANCE_READ_ROLES, hasRole } from "@/lib/authz";

// Permission matrix: fleet managers and finance manage expenses; ops managers read.
const READ_ROLES = [...FINANCE_READ_ROLES, "FLEET_MANAGER"];

const VALID_CATEGORIES = ["FUEL", "MAINTENANCE", "TOLL", "PARKING", "DRIVER_ALLOWANCE", "PERMIT", "OTHER"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, READ_ROLES)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const pp = parsePageParams(searchParams);
  const category = searchParams.get("category");
  const vehicleId = searchParams.get("vehicleId");
  const tripId = searchParams.get("tripId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (vehicleId) where.vehicleId = vehicleId;
  if (tripId) where.tripId = tripId;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.date = dateFilter;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    skip: pp.skip,
    take: pp.take,
    include: {
      vehicle: { select: { plateNumber: true } },
      trip: { select: { id: true, status: true } },
      paidBy: { select: { name: true } },
    },
  });

  return listResponse("expenses", expenses, pp, () => prisma.expense.count({ where }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        description: body.description,
        amount: body.amount,
        category: body.category,
        vehicleId: body.vehicleId || null,
        tripId: body.tripId || null,
        bookingId: body.bookingId || null,
        paidById: body.paidById || null,
        receiptUrl: body.receiptUrl || null,
        notes: body.notes || null,
        date: body.date ? new Date(body.date) : new Date(),
      },
      include: {
        vehicle: { select: { plateNumber: true } },
        paidBy: { select: { name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
