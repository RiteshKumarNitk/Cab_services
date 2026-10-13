import { NextRequest, NextResponse } from "next/server";
import { requireRole, OPS_ROLES } from "@/lib/authz";
import { assignDriverToDispatch, DispatchError } from "@/lib/operations-queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await requireRole(OPS_ROLES);
  if (error) return error;

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

    if (!driverId || typeof driverId !== "string") {
      return NextResponse.json({ error: "Driver ID required" }, { status: 400 });
    }

    const dispatch = await assignDriverToDispatch(id, driverId, session.user.id);
    return NextResponse.json(dispatch);
  } catch (err) {
    if (err instanceof DispatchError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Error assigning driver:", err);
    return NextResponse.json({ error: "Failed to assign driver" }, { status: 500 });
  }
}
