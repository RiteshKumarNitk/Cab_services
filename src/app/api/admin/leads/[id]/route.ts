import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CRM_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT_EXECUTIVE"];

type Session = { user?: { role?: string; id?: string } };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await auth()) as Session | null;
  if (!session?.user || !CRM_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, phone: true } },
        branch: { select: { id: true, name: true, city: true } },
        quotations: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
          },
        },
        booking: {
          select: {
            id: true, bookingNumber: true, status: true, totalFare: true, createdAt: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await auth()) as Session | null;
  if (!session?.user || !CRM_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.status) updateData.status = body.status;
    if (body.assignedToId) updateData.assignedToId = body.assignedToId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status === "WON") updateData.convertedAt = new Date();

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await auth()) as Session | null;
  if (!session?.user || !CRM_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
