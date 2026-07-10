import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  const dispatches = await prisma.dispatch.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      booking: {
        select: {
          id: true,
          pickupAddress: true,
          dropAddress: true,
          pickupDate: true,
          pickupTime: true,
          customer: { select: { name: true, phone: true } },
        },
      },
      vehicle: { select: { name: true, plateNumber: true } },
      driver: { select: { name: true } },
    },
  });

  return NextResponse.json(dispatches);
}
