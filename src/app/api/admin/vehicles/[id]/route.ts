import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plateNumber, model, color, capacity, type, driverId, isActive } =
      await req.json();
    const data: Record<string, unknown> = {};

    if (plateNumber) data.plateNumber = plateNumber;
    if (model) data.model = model;
    if (color) data.color = color;
    if (capacity) data.capacity = parseInt(capacity);
    if (type) data.type = type;
    if (driverId !== undefined) data.driverId = driverId || null;
    if (isActive !== undefined) data.isActive = isActive;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
      include: {
        driver: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
