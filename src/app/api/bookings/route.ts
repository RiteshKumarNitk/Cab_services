import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateFare, haversineDistance } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const role = session.user.role;

  try {
    const where: Record<string, unknown> = {};

    if (role === "CUSTOMER") {
      where.customerId = session.user.id;
    } else if (role === "DRIVER") {
      where.driverId = session.user.id;
    }

    if (status) where.status = status;
    if (type) where.bookingType = type;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        vehicle: true,
        rating: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      bookingType,
      pickupAddress,
      dropAddress,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      vehicleType,
      scheduledTime,
      flightNumber,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!bookingType || !pickupAddress) {
      return NextResponse.json(
        { error: "Booking type and pickup address are required" },
        { status: 400 }
      );
    }

    // Get pricing
    const pricing = await prisma.pricing.findUnique({
      where: { vehicleType: vehicleType || "SEDAN" },
    });

    if (!pricing) {
      return NextResponse.json(
        { error: "Pricing not configured for this vehicle type" },
        { status: 400 }
      );
    }

    // Calculate distance if coordinates provided
    let distance: number | null = null;
    if (pickupLat && pickupLng && dropLat && dropLng) {
      distance = haversineDistance(pickupLat, pickupLng, dropLat, dropLng);
    }

    // Calculate fare
    const duration = distance ? Math.ceil((distance / 30) * 60) : 30; // rough estimate
    const { fare } = calculateFare({
      vehicleType: vehicleType || "SEDAN",
      bookingType,
      distance: distance || undefined,
      duration,
      pricing,
    });

    // Find nearest online driver
    let driverId: string | null = null;
    let vehicleId: string | null = null;

    const onlineDrivers = await prisma.driverStatus.findMany({
      where: { online: true },
      include: {
        driver: {
          include: {
            driverVehicles: { where: { isActive: true, type: vehicleType || "SEDAN" } },
          },
        },
      },
    });

    if (onlineDrivers.length > 0) {
      let nearestDriver: (typeof onlineDrivers)[0] | null = null;
      let minDistance = Infinity;

      for (const ds of onlineDrivers) {
        if (ds.lat && ds.lng && pickupLat && pickupLng) {
          const dist = haversineDistance(pickupLat, pickupLng, ds.lat, ds.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestDriver = ds;
          }
        }
      }

      // If no coordinates, pick first available driver
      if (!nearestDriver) {
        nearestDriver = onlineDrivers[0];
      }

      driverId = nearestDriver.driverId;
      const vehicle = nearestDriver.driver.driverVehicles[0];
      if (vehicle) {
        vehicleId = vehicle.id;
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: session.user.id,
        driverId,
        vehicleId,
        bookingType,
        pickupAddress,
        dropAddress: dropAddress || "",
        pickupLat: pickupLat || null,
        pickupLng: pickupLng || null,
        dropLat: dropLat || null,
        dropLng: dropLng || null,
        flightNumber: flightNumber || null,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        fare,
        distance,
        duration,
        paymentMethod: paymentMethod || "CASH",
        status: "PENDING",
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        vehicle: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
