import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"];

const VALID_CATEGORIES = ["FUEL", "MAINTENANCE", "TOLL", "PARKING", "DRIVER_ALLOWANCE", "PERMIT", "OTHER"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
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
    include: {
      vehicle: { select: { plateNumber: true } },
      trip: { select: { id: true, status: true } },
      paidBy: { select: { name: true } },
    },
  });

  return NextResponse.json(expenses);
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
