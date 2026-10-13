import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES, OPS_ROLES, hasRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { parsePageParams, listResponse } from "@/lib/pagination";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role");
  const pp = parsePageParams(searchParams);
  // Ops managers have read access to the driver list (dispatch board); full user list is admin-only.
  const canRead =
    hasRole(session?.user?.role, ADMIN_ROLES) ||
    (roleFilter === "DRIVER" && hasRole(session?.user?.role, OPS_ROLES));
  if (!canRead) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const where = roleFilter && roleFilter in Role ? { role: roleFilter as Role } : undefined;
    const users = await prisma.user.findMany({
      where,
      skip: pp.skip,
      take: pp.take,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
        driverStatus: {
          select: { online: true, lat: true, lng: true },
        },
        _count: {
          select: {
            bookingsAsCustomer: true,
            bookingsAsDriver: true,
            driverVehicles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return listResponse("users", users, pp, () => prisma.user.count({ where }));
  } catch (error) {
    console.error("Error fetching users:", error);
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
    const { name, email, phone, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: role || "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (role === "DRIVER") {
      await prisma.driverStatus.create({
        data: { driverId: user.id },
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
