import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES, hasRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ vehicleType: string }> }
) {
  const { vehicleType } = await params;
  const session = await auth();
  if (!session || !hasRole(session.user?.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const updateData: Record<string, unknown> = {};

    if (data.baseFare !== undefined) updateData.baseFare = parseFloat(data.baseFare);
    if (data.perKm !== undefined) updateData.perKm = parseFloat(data.perKm);
    if (data.perMinute !== undefined) updateData.perMinute = parseFloat(data.perMinute);
    if (data.eventMin !== undefined) updateData.eventMin = parseFloat(data.eventMin);
    if (data.eventMax !== undefined) updateData.eventMax = parseFloat(data.eventMax);
    if (data.monthlyMin !== undefined) updateData.monthlyMin = parseFloat(data.monthlyMin);
    if (data.monthlyMax !== undefined) updateData.monthlyMax = parseFloat(data.monthlyMax);

    const pricing = await prisma.pricing.update({
      where: { vehicleType: vehicleType as "SEDAN" | "SUV" },
      data: updateData,
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Error updating pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
