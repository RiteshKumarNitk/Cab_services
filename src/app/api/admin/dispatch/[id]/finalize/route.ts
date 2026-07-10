import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { finalizeDispatch } from "@/lib/operations-queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trip = await finalizeDispatch(id, session.user.id);
    return NextResponse.json(trip);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finalize dispatch";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
