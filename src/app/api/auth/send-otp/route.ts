import { NextResponse } from "next/server";
import { generateOtp, storeOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const { phone, name } = await request.json();

  if (!phone || !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  const otp = generateOtp();
  storeOtp(phone, otp, name);

  // In production, send via SMS gateway (Twilio, MSG91, etc.)
  console.log(`[OTP] To ${phone}: Your OTP is ${otp}. Valid for 10 minutes.`);

  return NextResponse.json({
    success: true,
    message: "OTP sent successfully",
    // TODO: Remove in production — only for development
    debug: process.env.NODE_ENV === "development" ? otp : undefined,
  });
}
