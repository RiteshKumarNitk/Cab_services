import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";

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

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pp = parsePageParams(new URL(req.url).searchParams);
    const where = { driverId: session.user.id };
    const incidents = await prisma.incident.findMany({
      where,
      skip: pp.skip,
      take: pp.take,
      include: {
        trip: { select: { tripNumber: true } },
        booking: { select: { bookingNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return listResponse("incidents", incidents, pp, () => prisma.incident.count({ where }));
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
