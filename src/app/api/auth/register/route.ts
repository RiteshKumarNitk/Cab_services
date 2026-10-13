import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SELF_REGISTER_ROLES = ["CUSTOMER", "DRIVER"];

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Public self-registration may only create customer or driver accounts.
    // Staff accounts are created by admins via /api/admin/users.
    if (role !== undefined && !SELF_REGISTER_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
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
    });

    // Create driver status if role is DRIVER
    if (role === "DRIVER") {
      await prisma.driverStatus.create({
        data: {
          driverId: user.id,
        },
      });
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
