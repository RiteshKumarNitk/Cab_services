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
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (bookingId) where.bookingId = bookingId;
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      booking: { select: { bookingNumber: true } },
      customer: { select: { name: true, email: true, phone: true } },
      payments: { select: { id: true, amount: true, method: true, receivedAt: true } },
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    let nextNum = 1;
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const invoiceNumber = `INV-${String(nextNum).padStart(5, "0")}`;

    const total = (body.subtotal || 0) + (body.gst || 0) - (body.discount || 0);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: body.bookingId || null,
        customerId: body.customerId || null,
        status: body.status || "DRAFT",
        subtotal: body.subtotal || 0,
        gst: body.gst || 0,
        discount: body.discount || 0,
        total,
        paidAmount: body.paidAmount || 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paymentMethod: body.paymentMethod || null,
        paymentStatus: body.paidAmount && body.paidAmount >= total ? "PAID" : body.paidAmount && body.paidAmount > 0 ? "PARTIAL" : "PENDING",
        notes: body.notes || null,
        branchId: body.branchId || null,
      },
    });

    eventBus.emit(createEvent("INVOICE_GENERATED", {
      invoiceId: invoice.id,
      invoiceNumber,
      bookingId: body.bookingId,
      customerId: body.customerId,
      total,
    }, { userId: session.user.id }));

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
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
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

    const allowed = ["status", "paidAmount", "paymentStatus", "paymentMethod", "paymentReference", "paidAt", "notes"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) data[key] = updateData[key];
    }
    if (data.paidAt) data.paidAt = new Date(data.paidAt as string);

    if (data.paidAmount !== undefined) {
      const invoice = await prisma.invoice.findUnique({ where: { id }, select: { total: true } });
      if (invoice) {
        const paid = data.paidAmount as number;
        data.paymentStatus = paid >= invoice.total ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data,
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
