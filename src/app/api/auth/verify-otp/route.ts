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

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: result.name || `Customer ${cleanPhone.slice(-4)}`,
        email: `customer_${cleanPhone.slice(-4)}@aradhanatravel.com`,
        phone: cleanPhone,
        role: "CUSTOMER",
      },
    });
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
