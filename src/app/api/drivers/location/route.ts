import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lat, lng, online } = await req.json();

    const data: Record<string, unknown> = {};
    if (lat !== undefined) data.lat = lat;
    if (lng !== undefined) data.lng = lng;
    if (online !== undefined) data.online = online;

    const status = await prisma.driverStatus.upsert({
      where: { driverId: session.user.id },
      update: data,
      create: {
        driverId: session.user.id,
        lat: lat || null,
        lng: lng || null,
        online: online || false,
      },
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
