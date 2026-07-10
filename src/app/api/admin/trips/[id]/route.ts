import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OPS_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "FLEET_MANAGER", "DRIVER_MANAGER"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !OPS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true, phone: true, email: true } },
            lead: { select: { id: true, leadNumber: true, notes: true } },
          },
        },
        vehicle: true,
        driver: {
          select: {
            id: true, name: true, phone: true, email: true,
            driverStatus: true, cabDriverProfile: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !OPS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.status) updateData.status = body.status;
    if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId;
    if (body.driverId !== undefined) updateData.driverId = body.driverId;
    if (body.pickupAddress !== undefined) updateData.pickupAddress = body.pickupAddress;
    if (body.dropAddress !== undefined) updateData.dropAddress = body.dropAddress;
    if (body.pickupLat !== undefined) updateData.pickupLat = body.pickupLat;
    if (body.pickupLng !== undefined) updateData.pickupLng = body.pickupLng;
    if (body.dropLat !== undefined) updateData.dropLat = body.dropLat;
    if (body.dropLng !== undefined) updateData.dropLng = body.dropLng;
    if (body.waypoints !== undefined) updateData.waypoints = body.waypoints;
    if (body.otp !== undefined) updateData.otp = body.otp;
    if (body.startOdometer !== undefined) updateData.startOdometer = body.startOdometer;
    if (body.endOdometer !== undefined) updateData.endOdometer = body.endOdometer;
    if (body.actualDistance !== undefined) updateData.actualDistance = body.actualDistance;
    if (body.scheduledPickupTime !== undefined) updateData.scheduledPickupTime = new Date(body.scheduledPickupTime);
    if (body.actualPickupTime !== undefined) updateData.actualPickupTime = new Date(body.actualPickupTime);
    if (body.actualDropTime !== undefined) updateData.actualDropTime = new Date(body.actualDropTime);
    if (body.driverNotes !== undefined) updateData.driverNotes = body.driverNotes;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;

    const trip = await prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: { select: { id: true, name: true, plateNumber: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !OPS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.trip.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
