import { NextResponse } from "next/server";
import { requireRole, OPS_ROLES } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";

const RUNNING_STATUSES: BookingStatus[] = ["READY_FOR_DISPATCH", "TRIP_STARTED", "PICKUP_COMPLETED", "DROP_COMPLETED"];

export async function GET() {
  const { error } = await requireRole(OPS_ROLES);
  if (error) return error;

  const dispatches = await prisma.dispatch.findMany({
    // The board shows the queue plus trips still running. Cancelled bookings and finished trips
    // drop off; previously every dispatch ever made stayed in the "Running" lane (unbounded read).
    where: {
      OR: [
        { status: { not: "DISPATCHED" }, booking: { status: { not: "CANCELLED" } } },
        { status: "DISPATCHED", booking: { status: { in: RUNNING_STATUSES } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          pickupAddress: true,
          dropAddress: true,
          pickupDate: true,
          pickupTime: true,
          returnDate: true,
          preferredCategory: true,
          customer: { select: { name: true, phone: true } },
        },
      },
      vehicle: { select: { name: true, plateNumber: true } },
      driver: { select: { name: true } },
    },
  });

  return NextResponse.json(dispatches);
}
