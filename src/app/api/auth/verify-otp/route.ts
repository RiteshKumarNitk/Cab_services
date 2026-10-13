import { NextResponse } from "next/server";
import { verifyOtp, generateAuthToken, storeAuthToken } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { phone, otp } = await request.json();

  if (!phone || !otp) {
    return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });
  }

  const result = verifyOtp(phone, otp);
  if (!result.valid) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
  }

  const cleanPhone = phone.replace(/\s/g, "");
  let user = await prisma.user.findFirst({ where: { phone: cleanPhone } });

  // OTP sign-in is for customers only; staff and drivers must use their password.
  if (user && user.role !== "CUSTOMER") {
    return NextResponse.json(
      { error: "This phone number belongs to a staff or driver account. Please sign in with email and password." },
      { status: 403 }
    );
  }
  if (user && !user.isActive) {
    return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
  }

  if (!user) {
    const digits = cleanPhone.replace(/\D/g, "");
    const email = `customer_${digits}@aradhanatravel.com`;
    user =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.create({
        data: {
          name: result.name || `Customer ${digits.slice(-4)}`,
          // User.email is required; phone-only customers get a placeholder unique to their full number.
          email,
          phone: cleanPhone,
          role: "CUSTOMER",
        },
      }));
  }

  // Generate one-time auth token for NextAuth signIn
  const authToken = generateAuthToken();
  storeAuthToken(authToken, user.email);

  return NextResponse.json({
    success: true,
    authToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
}
