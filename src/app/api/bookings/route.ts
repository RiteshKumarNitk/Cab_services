import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";
import { BookingStatus, BookingType } from "@prisma/client";
import { enquirySchema, fieldErrors } from "@/lib/enquiry-validation";
import { createEnquiryLead } from "@/lib/enquiries";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const role = session.user.role;
  const pp = parsePageParams(searchParams);

  try {
    const where: Record<string, unknown> = {};

    if (role === "CUSTOMER") {
      where.customerId = session.user.id;
    } else if (role === "DRIVER") {
      where.driverId = session.user.id;
    }

    // `status` may be a comma-separated list (e.g. the driver app asks for TRIP_STARTED,READY_FOR_DISPATCH).
    if (status) {
      const statuses = status.split(",").map((s) => s.trim()).filter((s) => s in BookingStatus);
      where.status = { in: statuses };
    }
    if (type && type in BookingType) where.bookingType = type;

    const bookings = await prisma.booking.findMany({
      where,
      skip: pp.skip,
      take: pp.take,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        // List views only show these; the full row carries document expiries etc.
        vehicle: { select: { id: true, name: true, model: true, plateNumber: true, type: true, color: true } },
        rating: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return listResponse("bookings", bookings, pp, () => prisma.booking.count({ where }));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Customer booking request.
 *
 * Bookings are only created from an approved quotation (Lead -> Quotation -> Booking), so a
 * customer request is recorded as an enquiry Lead for the sales team. Previously this endpoint
 * created a PENDING booking directly and auto-assigned the nearest online driver without any
 * availability check, bypassing the whole pipeline.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const customer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, phone: true, email: true },
    });

    const parsed = enquirySchema.safeParse({
      name: customer?.name ?? "",
      phone: body.phone ?? customer?.phone ?? "",
      email: customer?.email ?? "",
      pickupAddress: body.pickupAddress,
      dropAddress: body.dropAddress,
      pickupDate: body.pickupDate ?? body.scheduledTime,
      returnDate: body.returnDate,
      tripType: body.tripType,
      bookingType: body.bookingType,
      passengers: body.passengers,
      preferredVehicle: body.vehicleType,
      notes: [body.notes, body.flightNumber && `Flight: ${body.flightNumber}`].filter(Boolean).join("\n") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please correct the highlighted fields", fields: fieldErrors(parsed.error) },
        { status: 400 }
      );
    }

    const { lead, duplicate } = await createEnquiryLead(parsed.data, {
      source: "WEBSITE", // existing Lead.source values: WEBSITE, PHONE, WALKIN, REFERRAL, SOCIAL_MEDIA, OTHER
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        reference: lead.leadNumber,
        duplicate,
        message: "Request received. Our team will send you a quotation shortly.",
      },
      { status: duplicate ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error creating booking request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
