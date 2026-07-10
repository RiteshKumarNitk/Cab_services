import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assignVehicleToDispatch } from "@/lib/operations-queue";

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
    let vehicleId: string | undefined;
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const body = await req.json();
      vehicleId = body.vehicleId;
    } else {
      const formData = await req.formData();
      vehicleId = formData.get("vehicleId") as string;
    }

    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
    }

    const dispatch = await assignVehicleToDispatch(id, vehicleId, session.user.id);
    return NextResponse.json(dispatch);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign vehicle";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
