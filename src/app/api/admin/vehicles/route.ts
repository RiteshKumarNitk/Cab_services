import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: {
          select: { id: true, name: true, phone: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plateNumber, model, color, capacity, type, driverId } =
      await req.json();

    if (!plateNumber || !model || !color || !capacity || !type) {
      return NextResponse.json(
        { error: "Plate number, model, color, capacity, and type are required" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber,
        model,
        color,
        capacity: parseInt(capacity),
        type,
        driverId: driverId || null,
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
