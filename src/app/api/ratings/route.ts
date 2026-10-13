import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMPLETED_TRIP_STATUSES } from "@/lib/booking-lifecycle";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bookingId, driverId, score, comment } = await req.json();

    if (!bookingId || !driverId || !score) {
      return NextResponse.json(
        { error: "Booking ID, driver ID, and score are required" },
        { status: 400 }
      );
    }

    // Verify the booking belongs to this customer and is completed
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.customerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!COMPLETED_TRIP_STATUSES.includes(booking.status)) {
      return NextResponse.json(
        { error: "Can only rate completed bookings" },
        { status: 400 }
      );
    }

    if (!booking.driverId || booking.driverId !== driverId) {
      return NextResponse.json({ error: "Driver does not match this booking" }, { status: 400 });
    }
    const existing = await prisma.rating.findUnique({ where: { bookingId } });
    if (existing) {
      return NextResponse.json({ error: "This booking has already been rated" }, { status: 409 });
    }

    const rating = await prisma.rating.create({
      data: {
        bookingId,
        raterId: session.user.id,
        // Rate the driver who actually drove this booking, not a client-supplied id.
        ratedId: booking.driverId,
        score: Math.min(5, Math.max(1, score)),
        comment: comment || null,
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error("Error creating rating:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
