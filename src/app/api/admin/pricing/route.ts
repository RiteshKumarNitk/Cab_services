import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES, hasRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || !hasRole(session.user?.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pricing = await prisma.pricing.findMany({
      orderBy: { vehicleType: "asc" },
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
