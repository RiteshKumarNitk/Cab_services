import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status: newStatus, reason } = await req.json();
    const userId = session.user.id;
    const role = session.user.role;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate permissions
    if (role === "CUSTOMER" && booking.customerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (role === "DRIVER" && booking.driverId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      REQUESTED: ["ACCEPTED", "CANCELLED"],
      ACCEPTED: ["STARTED", "CANCELLED"],
      STARTED: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowedNext = validTransitions[booking.status] || [];
    if (!allowedNext.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    // Update booking
    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "STARTED") {
      updateData.startTime = new Date();
    } else if (newStatus === "COMPLETED") {
      updateData.endTime = new Date();
    } else if (newStatus === "CANCELLED") {
      // Create cancellation record
      await prisma.cancellation.create({
        data: {
          bookingId: id,
          cancelledById: userId,
          reason: reason || null,
        },
      });
    }

    // If a driver accepts but no vehicle assigned, assign one
    if (newStatus === "ACCEPTED" && role === "DRIVER" && !booking.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { driverId: userId, isActive: true },
      });
      if (vehicle) {
        updateData.vehicleId = vehicle.id;
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        vehicle: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
