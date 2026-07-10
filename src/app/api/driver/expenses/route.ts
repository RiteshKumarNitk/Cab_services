import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, category, description, receiptUrl, tripId, bookingId } = body;

    if (!amount || !category) {
      return NextResponse.json(
        { error: "Amount and category are required" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        description: description || "",
        receiptUrl: receiptUrl || null,
        tripId: tripId || null,
        bookingId: bookingId || null,
        paidById: session.user.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: { paidById: session.user.id },
      include: {
        trip: { select: { tripNumber: true } },
        booking: { select: { bookingNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
