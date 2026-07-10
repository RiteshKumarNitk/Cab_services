import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assignDriverToDispatch } from "@/lib/operations-queue";

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
    let driverId: string | undefined;
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const body = await req.json();
      driverId = body.driverId;
    } else {
      const formData = await req.formData();
      driverId = formData.get("driverId") as string;
    }

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID required" }, { status: 400 });
    }

    const dispatch = await assignDriverToDispatch(id, driverId, session.user.id);
    return NextResponse.json(dispatch);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign driver";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
