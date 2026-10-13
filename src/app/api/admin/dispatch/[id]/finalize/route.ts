import { NextRequest, NextResponse } from "next/server";
import { requireRole, OPS_ROLES } from "@/lib/authz";
import { finalizeDispatch, DispatchError } from "@/lib/operations-queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await requireRole(OPS_ROLES);
  if (error) return error;

  try {
    const { trip, created } = await finalizeDispatch(id, session.user.id);
    return NextResponse.json(trip, { status: created ? 201 : 200 });
  } catch (err) {
    if (err instanceof DispatchError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Error finalizing dispatch:", err);
    return NextResponse.json({ error: "Failed to finalize dispatch" }, { status: 500 });
  }
}
