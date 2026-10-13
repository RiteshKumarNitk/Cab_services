import { prisma } from "./prisma";
import { eventBus, createEvent } from "./event-bus";
import type { Enquiry } from "./enquiry-validation";
import type { Lead } from "@prisma/client";

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function generateLeadNumber(): string {
  return `LD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Persist a website trip enquiry as a NEW Lead (spec §5 Step 1).
 * Re-submitting the same trip (same phone, pickup and date) within 24h returns the existing open lead.
 */
export async function createEnquiryLead(
  enquiry: Enquiry,
  options: { source?: string; userId?: string } = {}
): Promise<{ lead: Lead; duplicate: boolean }> {
  const dayStart = new Date(enquiry.pickupDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(enquiry.pickupDate);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.lead.findFirst({
    where: {
      phone: enquiry.phone,
      pickupAddress: { equals: enquiry.pickupAddress, mode: "insensitive" },
      pickupDate: { gte: dayStart, lte: dayEnd },
      status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return { lead: existing, duplicate: true };

  const lead = await prisma.lead.create({
    data: {
      leadNumber: generateLeadNumber(),
      status: "NEW",
      source: options.source ?? "WEBSITE",
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      bookingType: enquiry.bookingType ?? (enquiry.dropAddress ? "OUTSTATION" : "LOCAL"),
      tripType: enquiry.tripType,
      pickupAddress: enquiry.pickupAddress,
      dropAddress: enquiry.dropAddress,
      pickupDate: enquiry.pickupDate,
      returnDate: enquiry.returnDate,
      passengers: enquiry.passengers,
      preferredVehicle: enquiry.preferredVehicle,
      notes: enquiry.notes,
    },
  });

  eventBus.emit(createEvent("LEAD_CREATED", { leadId: lead.id, source: lead.source }, { userId: options.userId }));
  return { lead, duplicate: false };
}
