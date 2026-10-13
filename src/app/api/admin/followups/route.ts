import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";
import { calculateLeadScore } from "@/lib/lead-scoring";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT_EXECUTIVE"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Follow-ups contain CRM call notes: CRM staff only (previously any logged-in user).
  if (!MANAGER_ROLES.includes(session.user.role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const pp = parsePageParams(searchParams);
  const leadId = searchParams.get("leadId");
  const bookingId = searchParams.get("bookingId");
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (leadId) where.leadId = leadId;
  if (bookingId) where.bookingId = bookingId;
  if (userId) where.userId = userId;

  const followUps = await prisma.followUp.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pp.skip,
    take: pp.take,
    include: {
      user: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true, leadScore: true, status: true } },
    },
  });

  return listResponse("followUps", followUps, pp, () => prisma.followUp.count({ where }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !MANAGER_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const followUp = await prisma.followUp.create({
      data: {
        leadId: body.leadId || null,
        bookingId: body.bookingId || null,
        userId: session.user.id,
        type: body.type || "OTHER",
        notes: body.notes || "",
        outcome: body.outcome || null,
        nextAction: body.nextAction || null,
        leadScore: body.leadScore != null ? body.leadScore : null,
        duration: body.duration != null ? body.duration : null,
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
      },
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true, leadScore: true, status: true } },
      },
    });

    if (body.leadId) {
      const allFollowUps = await prisma.followUp.findMany({
        where: { leadId: body.leadId },
        select: { outcome: true, leadScore: true },
      });

      const computedScore = calculateLeadScore(allFollowUps);

      await prisma.lead.update({
        where: { id: body.leadId },
        data: { leadScore: computedScore },
      });

      if (body.outcome === "CONVERTED") {
        await prisma.lead.update({
          where: { id: body.leadId },
          data: { status: "WON", convertedAt: new Date() },
        });
      } else if (body.outcome === "NOT_INTERESTED") {
        await prisma.lead.update({
          where: { id: body.leadId },
          data: { status: "LOST" },
        });
      }
    }

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
