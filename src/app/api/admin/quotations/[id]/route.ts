import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUOTATION_ROLES } from "@/lib/quotation-rules";
import { deleteQuotation, QuotationError, updateQuotation } from "@/lib/quotations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true, name: true, phone: true, email: true, city: true,
            bookingType: true, tripType: true, pickupAddress: true,
            dropAddress: true, pickupDate: true, passengers: true,
            preferredVehicle: true, notes: true, source: true,
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        booking: { select: { id: true, bookingNumber: true, status: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!role || !userId || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    // One request either edits pricing/notes (DRAFT only) or changes status (validated transition).
    const quotation = await updateQuotation(id, body, { id: userId, role });
    return NextResponse.json(quotation);
  } catch (error) {
    if (error instanceof QuotationError) {
      return NextResponse.json({ error: error.message, fields: error.fields }, { status: error.status });
    }
    console.error("Error updating quotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteQuotation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof QuotationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error deleting quotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
