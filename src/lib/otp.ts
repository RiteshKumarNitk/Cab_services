import { randomInt, randomBytes } from "node:crypto";

// Fixed test OTP for local development only. It is never accepted in production,
// where it would let anyone sign in as any phone number.
export const UNIVERSAL_OTP = "000000";
const MAX_ATTEMPTS = 5;

// NOTE: in-memory stores only work on a single long-running server instance.
// A shared store (database/Redis) is required for serverless or multi-instance deployments.
const otpStore = new Map<string, { otp: string; expires: Date; name?: string; attempts: number }>();
const authTokenStore = new Map<string, { email: string; expires: Date }>();

export function isUniversalOtpEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function generateAuthToken(): string {
  return randomBytes(36).toString("base64url");
}

export function storeOtp(phone: string, otp: string, name?: string) {
  otpStore.set(phone, { otp, expires: new Date(Date.now() + 10 * 60 * 1000), name, attempts: 0 });
  setTimeout(() => otpStore.delete(phone), 10 * 60 * 1000);
}

export function verifyOtp(phone: string, otp: string): { valid: boolean; name?: string } {
  if (isUniversalOtpEnabled() && otp === UNIVERSAL_OTP) return { valid: true };

  const record = otpStore.get(phone);
  if (!record) return { valid: false };
  if (new Date() > record.expires) {
    otpStore.delete(phone);
    return { valid: false };
  }
  if (record.otp !== otp) {
    // Limit guesses: after MAX_ATTEMPTS wrong codes the OTP is discarded and a new one must be requested.
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) otpStore.delete(phone);
    return { valid: false };
  }
  otpStore.delete(phone);
  return { valid: true, name: record.name };
}

export function storeAuthToken(token: string, email: string) {
  authTokenStore.set(token, { email, expires: new Date(Date.now() + 60 * 1000) });
  setTimeout(() => authTokenStore.delete(token), 60 * 1000);
}

export function verifyAuthToken(token: string): { email: string } | null {
  const record = authTokenStore.get(token);
  if (!record) return null;
  if (new Date() > record.expires) {
    authTokenStore.delete(token);
    return null;
  }
  authTokenStore.delete(token);
  return { email: record.email };
}
