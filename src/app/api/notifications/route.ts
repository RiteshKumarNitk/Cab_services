import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserNotifications, getUnreadCount, markNotificationRead } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.user.id, limit),
    getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notificationId } = await req.json();
  if (!notificationId) {
    return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
  }

  await markNotificationRead(notificationId);
  return NextResponse.json({ success: true });
}
