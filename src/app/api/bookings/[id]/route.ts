import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerFacingStatus, getCustomerTimeline } from "@/lib/customer-timeline";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        driver: {
          select: { id: true, name: true, phone: true },
          include: {
            driverStatus: true,
          },
        },
        vehicle: true,
        trip: true,
        rating: true,
        cancellations: {
          include: {
            cancelledBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check authorization
    const role = session.user.role;
    if (
      role !== "ADMIN" &&
      booking.customerId !== session.user.id &&
      booking.driverId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      ...booking,
      customerFacingStatus: getCustomerFacingStatus(booking.status),
      timeline: getCustomerTimeline(booking.status),
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const body = await req.json();
    const { driverNotes } = body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (session.user.role === "DRIVER" && booking.driverId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (driverNotes !== undefined) {
      await prisma.trip.updateMany({
        where: { bookingId: id },
        data: { driverNotes },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
