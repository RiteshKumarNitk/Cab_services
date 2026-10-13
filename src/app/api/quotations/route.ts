import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { STAFF_ROLES, hasRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const customerOnly = searchParams.get("customerOnly") === "true";
  const pp = parsePageParams(searchParams);

  try {
    if (session.user.role === "CUSTOMER" && customerOnly) {
      const where = { booking: { customerId: session.user.id } };
      const quotations = await prisma.quotation.findMany({
        where,
        skip: pp.skip,
        take: pp.take,
        include: {
          booking: {
            select: {
              id: true,
              pickupAddress: true,
              dropAddress: true,
              pickupDate: true,
              status: true,
            },
          },
          lead: {
            select: { name: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return listResponse("quotations", quotations, pp, () => prisma.quotation.count({ where }));
    }

    if (hasRole(session.user.role, STAFF_ROLES)) {
      const quotations = await prisma.quotation.findMany({
        skip: pp.skip,
        take: pp.take,
        include: {
          booking: {
            select: { id: true, pickupAddress: true, dropAddress: true },
          },
          lead: { select: { name: true, phone: true } },
          createdBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return listResponse("quotations", quotations, pp, () => prisma.quotation.count());
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
