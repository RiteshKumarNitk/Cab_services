import { NextRequest, NextResponse } from "next/server";
import { requireRole, OPS_ROLES } from "@/lib/authz";
import { assignVehicleToDispatch, DispatchError } from "@/lib/operations-queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await requireRole(OPS_ROLES);
  if (error) return error;

  try {
    let vehicleId: string | undefined;
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const body = await req.json();
      vehicleId = body.vehicleId;
    } else {
      const formData = await req.formData();
      vehicleId = formData.get("vehicleId") as string;
    }

    if (!vehicleId || typeof vehicleId !== "string") {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
    }

    const dispatch = await assignVehicleToDispatch(id, vehicleId, session.user.id);
    return NextResponse.json(dispatch);
  } catch (err) {
    if (err instanceof DispatchError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Error assigning vehicle:", err);
    return NextResponse.json({ error: "Failed to assign vehicle" }, { status: 500 });
  }
}
