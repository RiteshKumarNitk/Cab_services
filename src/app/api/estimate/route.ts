import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateFare } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bookingType = searchParams.get("bookingType");
  const vehicleType = searchParams.get("vehicleType") || "SEDAN";
  const distanceStr = searchParams.get("distance");
  const durationStr = searchParams.get("duration");

  if (!bookingType) {
    return NextResponse.json(
      { error: "Booking type is required" },
      { status: 400 }
    );
  }

  try {
    const pricing = await prisma.pricing.findUnique({
      where: { vehicleType: vehicleType as "SEDAN" | "SUV" },
    });

    if (!pricing) {
      return NextResponse.json(
        { error: "Pricing not found for this vehicle type" },
        { status: 404 }
      );
    }

    const distance = distanceStr ? parseFloat(distanceStr) : undefined;
    const duration = durationStr ? parseInt(durationStr) : undefined;

    const result = calculateFare({
      vehicleType: vehicleType as "SEDAN" | "SUV",
      bookingType: bookingType as "LOCAL" | "OUTSTATION" | "AIRPORT" | "MONTHLY" | "EVENT",
      distance,
      duration,
      pricing,
    });

    return NextResponse.json({
      ...result,
      pricing,
      vehicleType,
      bookingType,
    });
  } catch (error) {
    console.error("Error estimating fare:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
