export const UNIVERSAL_OTP = "000000";

const otpStore = new Map<string, { otp: string; expires: Date; name?: string }>();
const authTokenStore = new Map<string, { email: string; expires: Date }>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateAuthToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 48; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

export function storeOtp(phone: string, otp: string, name?: string) {
  otpStore.set(phone, { otp, expires: new Date(Date.now() + 10 * 60 * 1000), name });
  setTimeout(() => otpStore.delete(phone), 10 * 60 * 1000);
}

export function verifyOtp(phone: string, otp: string): { valid: boolean; name?: string } {
  // Universal OTP works for any phone in any environment
  if (otp === UNIVERSAL_OTP) return { valid: true };

  const record = otpStore.get(phone);
  if (!record) return { valid: false };
  if (new Date() > record.expires) {
    otpStore.delete(phone);
    return { valid: false };
  }
  if (record.otp !== otp) return { valid: false };
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
