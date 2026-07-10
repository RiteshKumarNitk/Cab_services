import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const QUOTATION_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT_EXECUTIVE"];

function generateQuotationNumber(): string {
  return `QT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const leadId = searchParams.get("leadId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: Record<string, unknown> = {};
    if (status && status !== " ") where.status = status;
    if (leadId) where.leadId = leadId;

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true } },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return NextResponse.json({ quotations, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!role || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: generateQuotationNumber(),
        status: "DRAFT",
        leadId: body.leadId ?? null,
        createdById: userId ?? "",
        bookingType: body.bookingType ?? "LOCAL",
        tripType: body.tripType ?? "ONE_WAY",
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        pickupAddress: body.pickupAddress ?? null,
        dropAddress: body.dropAddress ?? null,
        pickupDate: body.pickupDate ? new Date(body.pickupDate) : null,
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        passengers: body.passengers ?? null,
        vehicleType: body.vehicleType ?? null,
        baseFare: body.baseFare ?? null,
        perKmCharge: body.perKmCharge ?? null,
        totalKm: body.totalKm ?? null,
        nightCharges: body.nightCharges ?? null,
        driverAllowance: body.driverAllowance ?? null,
        parkingCharges: body.parkingCharges ?? null,
        tollCharges: body.tollCharges ?? null,
        permitCharges: body.permitCharges ?? null,
        stateTax: body.stateTax ?? null,
        discount: body.discount ?? null,
        gst: body.gst ?? null,
        totalFare: body.totalFare ?? null,
        notes: body.notes ?? null,
        branchId: body.branchId ?? null,
      },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (body.leadId) {
      await prisma.lead.update({
        where: { id: body.leadId },
        data: { status: "QUOTATION_SENT" },
      });
    }

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("Error creating quotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
