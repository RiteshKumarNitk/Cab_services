import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OPS_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "FLEET_MANAGER", "DRIVER_MANAGER"];

function generateTripNumber(): string {
  return `TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !OPS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: Record<string, unknown> = {};
    if (status && status !== " ") where.status = status;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledPickupTime: "asc" },
        include: {
          booking: {
            select: {
              id: true, bookingNumber: true, status: true,
              pickupAddress: true, dropAddress: true,
              pickupDate: true, pickupTime: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
          vehicle: { select: { id: true, name: true, plateNumber: true, model: true } },
          driver: { select: { id: true, name: true, phone: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return NextResponse.json({ trips, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !OPS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const existingTrip = await prisma.trip.findUnique({ where: { bookingId: body.bookingId } });
    if (existingTrip) {
      return NextResponse.json({ error: "A trip already exists for this booking" }, { status: 409 });
    }

    const trip = await prisma.trip.create({
      data: {
        tripNumber: generateTripNumber(),
        bookingId: body.bookingId,
        status: "SCHEDULED",
        vehicleId: body.vehicleId ?? null,
        driverId: body.driverId ?? null,
        pickupAddress: body.pickupAddress ?? null,
        pickupLat: body.pickupLat ?? null,
        pickupLng: body.pickupLng ?? null,
        dropAddress: body.dropAddress ?? null,
        dropLat: body.dropLat ?? null,
        dropLng: body.dropLng ?? null,
        scheduledPickupTime: body.scheduledPickupTime ? new Date(body.scheduledPickupTime) : null,
        driverNotes: body.driverNotes ?? null,
        adminNotes: body.adminNotes ?? null,
      },
      include: {
        booking: {
          select: {
            id: true, bookingNumber: true, customer: { select: { name: true, phone: true } },
          },
        },
        vehicle: { select: { id: true, name: true, plateNumber: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    });

    await prisma.booking.update({
      where: { id: body.bookingId },
      data: { status: "DRIVER_ASSIGNED" },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
