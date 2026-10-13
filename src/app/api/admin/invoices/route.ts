import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";
import { eventBus, createEvent } from "@/lib/event-bus";

import { FINANCE_ROLES, FINANCE_READ_ROLES, hasRole } from "@/lib/authz";

const READ_ROLES = FINANCE_READ_ROLES;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, READ_ROLES)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const pp = parsePageParams(searchParams);
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
    skip: pp.skip,
    take: pp.take,
    include: {
      booking: { select: { bookingNumber: true } },
      customer: { select: { name: true, email: true, phone: true } },
      payments: { select: { id: true, amount: true, method: true, receivedAt: true } },
    },
  });

  return listResponse("invoices", invoices, pp, () => prisma.invoice.count({ where }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const subtotal = Number(body.subtotal || 0);
    const gst = Number(body.gst || 0);
    const discount = Number(body.discount || 0);
    if ([subtotal, gst, discount].some((n) => !Number.isFinite(n) || n < 0)) {
      return NextResponse.json({ error: "Subtotal, GST and discount must be non-negative numbers" }, { status: 400 });
    }
    const total = Math.round((subtotal + gst - discount) * 100) / 100;
    if (total <= 0) {
      return NextResponse.json({ error: "Invoice total must be greater than zero" }, { status: 400 });
    }

    // The customer is taken from the booking, never from client input.
    const bookingId: string | null = body.bookingId || null;
    let customerId: string | null = null;
    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { customerId: true } });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      customerId = booking.customerId;

      // One active invoice per booking: prevents double invoicing on retries.
      const existing = await prisma.invoice.findFirst({
        where: { bookingId, status: { not: "CANCELLED" } },
        select: { id: true, invoiceNumber: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Booking already has invoice ${existing.invoiceNumber}. Cancel it before generating a new one.`, invoiceId: existing.id },
          { status: 409 }
        );
      }
    }

    // A new invoice is never paid on creation: paid amounts come only from recorded payments.
    const status = body.status === "SENT" ? "SENT" : "DRAFT";

    let invoice = null;
    for (let attempt = 0; attempt < 3 && !invoice; attempt++) {
      const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: "desc" },
        select: { invoiceNumber: true },
      });
      let nextNum = 1;
      const match = lastInvoice?.invoiceNumber.match(/INV-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1 + attempt;
      const invoiceNumber = `INV-${String(nextNum).padStart(5, "0")}`;

      try {
        invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId,
            customerId,
            status,
            subtotal,
            gst,
            discount,
            total,
            paidAmount: 0,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            paymentMethod: body.paymentMethod || null,
            paymentStatus: "PENDING",
            notes: body.notes || null,
            branchId: body.branchId || null,
          },
        });
      } catch (err) {
        // Unique invoice number taken by a concurrent request: retry with the next number.
        if ((err as { code?: string }).code !== "P2002") throw err;
      }
    }
    if (!invoice) {
      return NextResponse.json({ error: "Could not allocate an invoice number, please retry" }, { status: 409 });
    }

    eventBus.emit(createEvent("INVOICE_GENERATED", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      bookingId,
      customerId,
      total,
    }, { userId: session.user.id }));

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const EDITABLE_STATUSES = ["DRAFT", "SENT", "OVERDUE", "CANCELLED"];

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !FINANCE_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

    // Paid amount / payment status are derived from recorded payments (POST /api/admin/payments)
    // and cannot be set directly.
    const allowed = ["status", "paymentMethod", "paymentReference", "notes"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) data[key] = updateData[key];
    }
    if (data.status !== undefined && !EDITABLE_STATUSES.includes(data.status as string)) {
      return NextResponse.json(
        { error: `Status can only be set to ${EDITABLE_STATUSES.join(", ")}; paid states follow recorded payments` },
        { status: 400 }
      );
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
