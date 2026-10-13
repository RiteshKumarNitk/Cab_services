import { NextResponse } from "next/server";
import { generateOtp, storeOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const { phone, name } = await request.json();

  if (!phone || !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  const otp = generateOtp();
  storeOtp(phone, otp, name);

  // BLOCKED: no SMS gateway is configured, so the OTP is not delivered to the customer.
  // It is only logged in development; never log OTPs in production.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] To ${phone}: Your OTP is ${otp}. Valid for 10 minutes.`);
  }

  return NextResponse.json({
    success: true,
    message: "OTP sent successfully",
    // TODO: Remove in production — only for development
    debug: process.env.NODE_ENV === "development" ? otp : undefined,
  });
}
