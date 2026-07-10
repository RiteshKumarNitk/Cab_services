import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const customerOnly = searchParams.get("customerOnly") === "true";

  try {
    if (session.user.role === "CUSTOMER" && customerOnly) {
      const invoices = await prisma.invoice.findMany({
        where: { customerId: session.user.id },
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
      return NextResponse.json(invoices);
    }

    if (session.user.role !== "CUSTOMER") {
      const invoices = await prisma.invoice.findMany({
        include: {
          booking: {
            select: { id: true, bookingNumber: true, pickupAddress: true },
          },
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(invoices);
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
