import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventBus, createEvent } from "@/lib/event-bus";

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (bookingId) where.bookingId = bookingId;
  if (type) where.type = type;

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    include: {
      booking: { select: { bookingNumber: true, customer: { select: { name: true } } } },
      receivedBy: { select: { name: true } },
    },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const payment = await prisma.payment.create({
      data: {
        paymentNumber: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        bookingId: body.bookingId || null,
        invoiceId: body.invoiceId || null,
        customerId: body.customerId || null,
        type: body.type || "ADVANCE",
        amount: body.amount,
        method: body.method || "CASH",
        reference: body.reference || null,
        notes: body.notes || null,
        receivedById: session.user.id,
      },
    });

    eventBus.emit(createEvent("PAYMENT_RECEIVED", {
      paymentId: payment.id,
      bookingId: body.bookingId,
      customerId: body.customerId,
      amount: body.amount,
      type: body.type,
    }, { userId: session.user.id }));

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
