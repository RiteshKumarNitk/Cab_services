import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, description, location, images, tripId, bookingId } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Incident type is required" },
        { status: 400 }
      );
    }

    const incident = await prisma.incident.create({
      data: {
        driverId: session.user.id,
        type,
        description: description || null,
        location: location || null,
        images: images ? JSON.stringify(images) : "[]",
        tripId: tripId || null,
        bookingId: bookingId || null,
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const incidents = await prisma.incident.findMany({
      where: { driverId: session.user.id },
      include: {
        trip: { select: { tripNumber: true } },
        booking: { select: { bookingNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
