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
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !hasRole(session.user?.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, secret, events } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.create({
      data: {
        url,
        secret: secret || null,
        events: JSON.stringify(events || []),
        createdById: session.user.id,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || !hasRole(session.user?.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, url, secret, events, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(url !== undefined ? { url } : {}),
        ...(secret !== undefined ? { secret } : {}),
        ...(events !== undefined ? { events: JSON.stringify(events) } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !hasRole(session.user?.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.webhook.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
