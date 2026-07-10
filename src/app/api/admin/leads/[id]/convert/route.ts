import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CRM_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"];

type Session = { user?: { role?: string; id?: string } };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await auth()) as Session | null;
  if (!session?.user || !CRM_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        quotations: { where: { status: "APPROVED" }, take: 1 },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.status === "LOST" || lead.status === "ARCHIVED") {
      return NextResponse.json({ error: "Cannot convert lost or archived lead" }, { status: 400 });
    }

    // Enforce: booking can only be created from an approved quotation
    const approvedQuotation = lead.quotations[0];
    if (!approvedQuotation) {
      return NextResponse.json({
        error: "Lead must have an approved quotation before creating a booking. Send a quotation and get it approved first.",
        requiresQuotation: true,
      }, { status: 400 });
    }

    const bookingNumber = `BK-${Date.now().toString(36).toUpperCase()}`;

    let customerId = session.user.id ?? "";
    if (lead.email) {
      const existing = await prisma.user.findUnique({ where: { email: lead.email } });
      if (existing) {
        customerId = existing.id;
      } else {
        const newCustomer = await prisma.user.create({
          data: {
            email: lead.email,
            name: lead.name,
            phone: lead.phone,
            role: "CUSTOMER",
          },
        });
        customerId = newCustomer.id;
      }
    }

    // Create booking with BOOKING_CONFIRMED status (not PENDING)
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        leadId: lead.id,
        quotationId: approvedQuotation.id,
        customerId,
        bookingType: lead.bookingType ?? "LOCAL",
        tripType: lead.tripType ?? "ONE_WAY",
        pickupAddress: lead.pickupAddress ?? "",
        dropAddress: lead.dropAddress ?? "",
        pickupDate: lead.pickupDate ?? new Date(),
        pickupTime: "10:00",
        passengers: lead.passengers ?? 1,
        preferredCategory: lead.preferredVehicle ?? "SEDAN",
        status: "BOOKING_CONFIRMED",
        baseFare: approvedQuotation.baseFare,
        nightCharges: approvedQuotation.nightCharges,
        driverAllowance: approvedQuotation.driverAllowance,
        parkingCharges: approvedQuotation.parkingCharges,
        tollCharges: approvedQuotation.tollCharges,
        permitCharges: approvedQuotation.permitCharges,
        stateTax: approvedQuotation.stateTax,
        discount: approvedQuotation.discount,
        gst: approvedQuotation.gst,
        totalFare: approvedQuotation.totalFare,
      },
    });

    // Mark lead as won
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "WON", convertedAt: new Date() },
    });

    // Auto-create dispatch queue entry
    await prisma.dispatch.create({
      data: {
        bookingId: booking.id,
        status: "PENDING",
        assignedById: session.user.id,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error converting lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
