import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { convertLeadToBooking, ConversionError } from "@/lib/lead-conversion";

const CONVERT_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error } = await requireRole(CONVERT_ROLES);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const quotationId = typeof body?.quotationId === "string" ? body.quotationId : undefined;
    const { booking, created } = await convertLeadToBooking(id, session.user.id, quotationId);
    return NextResponse.json(booking, { status: created ? 201 : 200 });
  } catch (err) {
    if (err instanceof ConversionError) {
      return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
    }
    console.error("Error converting lead:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
