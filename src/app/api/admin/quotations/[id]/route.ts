import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const QUOTATION_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT_EXECUTIVE"];
const APPROVER_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"];

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
  if (!role || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.status) {
      if ((body.status === "APPROVED" || body.status === "REJECTED") && !APPROVER_ROLES.includes(role)) {
        return NextResponse.json({ error: "Only managers can approve/reject quotations" }, { status: 403 });
      }
      updateData.status = body.status;
      if (body.status === "APPROVED") {
        updateData.approvedById = userId;
        updateData.approvedAt = new Date();
      }
      if (body.status === "REJECTED") {
        updateData.rejectionReason = body.rejectionReason ?? null;
      }
    }

    if (body.baseFare !== undefined) updateData.baseFare = body.baseFare;
    if (body.perKmCharge !== undefined) updateData.perKmCharge = body.perKmCharge;
    if (body.totalKm !== undefined) updateData.totalKm = body.totalKm;
    if (body.nightCharges !== undefined) updateData.nightCharges = body.nightCharges;
    if (body.driverAllowance !== undefined) updateData.driverAllowance = body.driverAllowance;
    if (body.parkingCharges !== undefined) updateData.parkingCharges = body.parkingCharges;
    if (body.tollCharges !== undefined) updateData.tollCharges = body.tollCharges;
    if (body.permitCharges !== undefined) updateData.permitCharges = body.permitCharges;
    if (body.stateTax !== undefined) updateData.stateTax = body.stateTax;
    if (body.discount !== undefined) updateData.discount = body.discount;
    if (body.gst !== undefined) updateData.gst = body.gst;
    if (body.totalFare !== undefined) updateData.totalFare = body.totalFare;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(quotation);
  } catch (error) {
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
    await prisma.quotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
