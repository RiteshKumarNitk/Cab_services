import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUOTATION_ROLES } from "@/lib/quotation-rules";
import { createQuotation, QuotationError } from "@/lib/quotations";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const leadId = searchParams.get("leadId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: Record<string, unknown> = {};
    if (status && status !== " ") where.status = status;
    if (leadId) where.leadId = leadId;

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true } },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return NextResponse.json({ quotations, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!role || !userId || !QUOTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    // Totals are computed on the server; a client total is accepted only if it matches.
    const quotation = await createQuotation(body, { id: userId, role });
    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    if (error instanceof QuotationError) {
      return NextResponse.json({ error: error.message, fields: error.fields }, { status: error.status });
    }
    console.error("Error creating quotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
