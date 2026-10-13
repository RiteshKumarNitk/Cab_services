import { NextResponse } from "next/server";
import { requireRole, OPS_ROLES } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole(OPS_ROLES);
  if (error) return error;

  const dispatches = await prisma.dispatch.findMany({
    // Cancelled bookings no longer belong on the board.
    where: { booking: { status: { not: "CANCELLED" } } },
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
