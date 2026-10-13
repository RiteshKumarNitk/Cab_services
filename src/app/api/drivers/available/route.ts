import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OPS_ROLES, hasRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Live driver names, phones and locations: operations staff only.
  if (!hasRole(session.user.role, OPS_ROLES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const drivers = await prisma.driverStatus.findMany({
      where: { online: true },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            driverVehicles: {
              where: { isActive: true },
              select: {
                id: true,
                type: true,
                model: true,
                color: true,
                plateNumber: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching available drivers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
