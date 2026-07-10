import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CRM_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT_EXECUTIVE"];

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !CRM_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: Record<string, unknown> = {};
    if (status && status !== " ") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { leadNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          branch: { select: { id: true, name: true } },
          _count: { select: { quotations: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !CRM_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const leadNumber = `LD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        status: "NEW",
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        source: body.source ?? "WEBSITE",
        notes: body.notes ?? null,
        bookingType: body.bookingType ?? null,
        tripType: body.tripType ?? null,
        pickupAddress: body.pickupAddress ?? null,
        dropAddress: body.dropAddress ?? null,
        pickupDate: body.pickupDate ? new Date(body.pickupDate) : null,
        passengers: body.passengers ?? null,
        preferredVehicle: body.preferredVehicle ?? null,
        city: body.city ?? null,
        assignedToId: body.assignedToId ?? null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
