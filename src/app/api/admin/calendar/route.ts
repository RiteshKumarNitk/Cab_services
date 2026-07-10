import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OPS_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "FLEET_MANAGER", "DRIVER_MANAGER"];

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !OPS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "bookings";
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params required" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  try {
    if (view === "bookings") {
      const bookings = await prisma.booking.findMany({
        where: {
          pickupDate: { gte: startDate, lte: endDate },
          status: { not: "CANCELLED" },
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, name: true, plateNumber: true } },
          driver: { select: { id: true, name: true } },
        },
        orderBy: { pickupDate: "asc" },
      });
      return NextResponse.json({ bookings });
    }

    if (view === "vehicles") {
      const vehicles = await prisma.vehicle.findMany({
        where: { isActive: true },
        include: {
          bookings: {
            where: {
              pickupDate: { gte: startDate, lte: endDate },
              status: { not: "CANCELLED" },
            },
            include: {
              customer: { select: { id: true, name: true } },
            },
          },
          maintenance: {
            where: {
              scheduledDate: { gte: startDate, lte: endDate },
            },
          },
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ vehicles });
    }

    if (view === "drivers") {
      const drivers = await prisma.user.findMany({
        where: { role: "DRIVER", isActive: true },
        include: {
          driverStatus: true,
          tripAssignments: {
            where: {
              scheduledPickupTime: { gte: startDate, lte: endDate },
              status: { not: "CANCELLED" },
            },
            include: {
              booking: {
                select: { id: true, bookingNumber: true, pickupAddress: true, dropAddress: true, pickupDate: true },
              },
            },
          },
          driverLeaves: {
            where: {
              status: "APPROVED",
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          },
          driverShifts: { where: { isActive: true } },
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ drivers });
    }

    if (view === "maintenance") {
      const maintenance = await prisma.vehicleMaintenance.findMany({
        where: {
          scheduledDate: { gte: startDate, lte: endDate },
        },
        include: {
          vehicle: { select: { id: true, name: true, plateNumber: true } },
        },
        orderBy: { scheduledDate: "asc" },
      });
      return NextResponse.json({ maintenance });
    }

    return NextResponse.json({ error: "Invalid view" }, { status: 400 });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !OPS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, pickupDate } = body;

    if (!bookingId || !pickupDate) {
      return NextResponse.json({ error: "bookingId and pickupDate required" }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { pickupDate: new Date(pickupDate) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
