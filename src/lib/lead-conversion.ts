import { prisma } from "./prisma";
import { eventBus, createEvent } from "./event-bus";
import type { Booking } from "@prisma/client";

export class ConversionError extends Error {
  constructor(message: string, public status: 400 | 404 | 409 = 400, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

/** "HH:MM" of a date if it carries a time of day, else the business default. */
function clockOf(date: Date): string {
  if (date.getHours() === 0 && date.getMinutes() === 0) return "10:00";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Convert a lead with an APPROVED quotation into a confirmed booking and queue it for dispatch.
 * This is the only supported path from Sales to Operations (spec §4 Workflow A).
 *
 * Idempotent: if the lead was already converted, the existing booking is returned with `created: false`.
 */
export async function convertLeadToBooking(
  leadId: string,
  userId: string,
  quotationId?: string
): Promise<{ booking: Booking; created: boolean }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      booking: true,
      quotations: { where: { status: "APPROVED" }, orderBy: { approvedAt: "desc" } },
    },
  });

  if (!lead) throw new ConversionError("Lead not found", 404);
  if (lead.booking) return { booking: lead.booking, created: false };

  if (lead.status === "LOST" || lead.status === "ARCHIVED") {
    throw new ConversionError("Cannot convert lost or archived lead");
  }

  // Enforce: booking can only be created from an approved quotation
  const quotation = quotationId ? lead.quotations.find((q) => q.id === quotationId) : lead.quotations[0];
  if (!quotation) {
    throw new ConversionError(
      "Lead must have an approved quotation before creating a booking. Send a quotation and get it approved first.",
      400,
      { requiresQuotation: true }
    );
  }
  if (quotation.validUntil && quotation.validUntil < new Date()) {
    throw new ConversionError("The approved quotation has expired. Revise and re-approve it before booking.");
  }

  // The approved quotation is the agreed contract; fall back to the lead's details.
  const pickupAddress = quotation.pickupAddress || lead.pickupAddress;
  const pickupDate = quotation.pickupDate ?? lead.pickupDate;
  if (!pickupAddress || !pickupDate) {
    throw new ConversionError("Pickup address and pickup date are required (set them on the quotation or lead)");
  }

  const phoneDigits = (lead.phone ?? "").replace(/\D/g, "");
  if (!lead.email && !phoneDigits) {
    throw new ConversionError("Lead needs an email or phone number to create the customer account");
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Resolve the customer: match by email, then by phone, otherwise create one.
      let customer = lead.email ? await tx.user.findUnique({ where: { email: lead.email } }) : null;
      if (!customer && phoneDigits) {
        customer = await tx.user.findFirst({ where: { phone: lead.phone!, role: "CUSTOMER" } });
      }
      if (customer && customer.role !== "CUSTOMER") {
        throw new ConversionError("The lead's email belongs to a staff or driver account. Correct the lead's contact details.");
      }
      if (!customer) {
        customer = await tx.user.create({
          data: {
            // User.email is required; phone-only customers get a placeholder address on our domain.
            email: lead.email ?? `customer_${phoneDigits}@aradhanatravel.com`,
            name: lead.name,
            phone: lead.phone,
            role: "CUSTOMER",
          },
        });
      }

      const booking = await tx.booking.create({
        data: {
          bookingNumber: `BK-${Date.now().toString(36).toUpperCase()}`,
          leadId: lead.id,
          quotationId: quotation.id,
          customerId: customer.id,
          branchId: lead.branchId,
          bookingType: quotation.bookingType ?? lead.bookingType ?? "LOCAL",
          tripType: quotation.tripType ?? lead.tripType ?? "ONE_WAY",
          pickupAddress,
          dropAddress: quotation.dropAddress ?? lead.dropAddress ?? "",
          pickupDate,
          pickupTime: clockOf(pickupDate),
          returnDate: quotation.returnDate ?? lead.returnDate,
          passengers: quotation.passengers ?? lead.passengers ?? 1,
          preferredCategory: quotation.vehicleType ?? lead.preferredVehicle ?? "SEDAN",
          status: "BOOKING_CONFIRMED",
          baseFare: quotation.baseFare,
          nightCharges: quotation.nightCharges,
          driverAllowance: quotation.driverAllowance,
          parkingCharges: quotation.parkingCharges,
          tollCharges: quotation.tollCharges,
          permitCharges: quotation.permitCharges,
          stateTax: quotation.stateTax,
          discount: quotation.discount,
          gst: quotation.gst,
          totalFare: quotation.totalFare,
          fare: quotation.totalFare ?? 0,
          billableKm: quotation.totalKm,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: { status: "WON", convertedAt: new Date(), convertedToCustomerId: customer.id },
      });

      // Booking enters the Operations Queue (Dispatch Board "Awaiting" lane)
      await tx.dispatch.create({
        data: { bookingId: booking.id, status: "PENDING", assignedById: userId },
      });

      return booking;
    });

    eventBus.emit(createEvent("BOOKING_CREATED", { bookingId: booking.id, leadId: lead.id, quotationId: quotation.id }, { userId }));
    eventBus.emit(createEvent("LEAD_STATUS_CHANGED", { leadId: lead.id, newStatus: "WON", previousStatus: lead.status }, { userId }));
    eventBus.emit(createEvent("BOOKING_STATUS_CHANGED", { bookingId: booking.id, newStatus: "BOOKING_CONFIRMED" }, { userId }));

    return { booking, created: true };
  } catch (err) {
    // A concurrent request converted the same lead/quotation first (unique leadId / quotationId).
    if ((err as { code?: string }).code === "P2002") {
      const existing = await prisma.booking.findFirst({ where: { OR: [{ leadId: lead.id }, { quotationId: quotation.id }] } });
      if (existing) return { booking: existing, created: false };
    }
    throw err;
  }
}
