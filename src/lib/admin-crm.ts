"use server";

import { updateTag } from "next/cache";
import { prisma } from "./prisma";
import { auth } from "./auth";
import { convertLeadToBooking as convertLead } from "./lead-conversion";
import type { LeadStatus, BookingType, TripType, VehicleType } from "@prisma/client";

const CRM_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT_EXECUTIVE"];

type SessionUser = { user?: { role?: string; id?: string } };

function canAccess(session: unknown): asserts session is SessionUser {
  const s = session as SessionUser | null;
  if (!s?.user?.role || !CRM_ROLES.includes(s.user.role)) {
    throw new Error("Unauthorized");
  }
}

function generateLeadNumber(): string {
  return `LD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function getLeads(page = 1, limit = 20) {
  const session = await auth();
  canAccess(session);

  const skip = (page - 1) * limit;
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { quotations: true } },
      },
    }),
    prisma.lead.count(),
  ]);

  return { leads, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createLead(data: {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  bookingType?: BookingType;
  tripType?: TripType;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate?: string;
  passengers?: number;
  preferredVehicle?: VehicleType;
  notes?: string;
  assignedToId?: string;
}) {
  const session = await auth();
  canAccess(session);

  const lead = await prisma.lead.create({
    data: {
      leadNumber: generateLeadNumber(),
      status: "NEW",
      source: data.source ?? "WEBSITE",
      name: data.name,
      email: data.email,
      phone: data.phone,
      bookingType: data.bookingType,
      tripType: data.tripType,
      pickupAddress: data.pickupAddress,
      dropAddress: data.dropAddress,
      pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
      passengers: data.passengers,
      preferredVehicle: data.preferredVehicle,
      notes: data.notes,
      assignedToId: data.assignedToId,
    },
  });

  updateTag("leads");
  return lead;
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const session = await auth();
  canAccess(session);

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      ...(status === "WON" ? { convertedAt: new Date() } : {}),
    },
  });

  updateTag("leads");
  return lead;
}

export async function assignLead(leadId: string, userId: string) {
  const session = await auth();
  canAccess(session);

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId: userId, status: "CONTACTED" },
  });

  updateTag("leads");
  return lead;
}

export async function convertLeadToBooking(leadId: string, quotationId?: string) {
  const session = await auth();
  canAccess(session);

  // Single conversion path shared with POST /api/admin/leads/[id]/convert
  // (approved quotation required, idempotent, creates the dispatch entry).
  const { booking } = await convertLead(leadId, session.user!.id!, quotationId);

  updateTag("leads");
  updateTag("bookings");
  return booking;
}

export async function deleteLead(leadId: string) {
  const session = await auth();
  canAccess(session);

  await prisma.lead.delete({ where: { id: leadId } });
  updateTag("leads");
  return { success: true };
}

export async function getLeadStats() {
  const session = await auth();
  canAccess(session);

  const [total, newLeads, won, lost, bySource] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.count({ where: { status: "LOST" } }),
    prisma.lead.groupBy({ by: ["source"], _count: true }),
  ]);

  return { total, newLeads, won, lost, bySource };
}
