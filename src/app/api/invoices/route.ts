import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { FINANCE_READ_ROLES, hasRole } from "@/lib/authz";
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
      const where = { customerId: session.user.id };
      const invoices = await prisma.invoice.findMany({
        where,
        skip: pp.skip,
        take: pp.take,
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              pickupAddress: true,
              dropAddress: true,
              pickupDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return listResponse("invoices", invoices, pp, () => prisma.invoice.count({ where }));
    }

    if (hasRole(session.user.role, FINANCE_READ_ROLES)) {
      const invoices = await prisma.invoice.findMany({
        skip: pp.skip,
        take: pp.take,
        include: {
          booking: {
            select: { id: true, bookingNumber: true, pickupAddress: true },
          },
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return listResponse("invoices", invoices, pp, () => prisma.invoice.count());
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
