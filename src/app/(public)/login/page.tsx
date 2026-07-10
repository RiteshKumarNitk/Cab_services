"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Eye, EyeOff, LogIn, Smartphone, Mail, ArrowLeft, CheckCircle, Users, Shield } from "lucide-react";

const DEV_OTP = "000000";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-4 border-red-100 border-t-red-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [mode, setMode] = useState<"select" | "email" | "otp" | "otp-verify">("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDevHint, setShowDevHint] = useState(true);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) setError("Invalid email or password");
      else { router.push(callbackUrl); router.refresh(); }
    } catch { setError("An error occurred."); }
    finally { setLoading(false); }
  };

  const sendOtp = async () => {
    if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setShowDevHint(true);
      setMode("otp-verify");
    } catch { setError("Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const verifyOtpHandler = async () => {
    if (otpInput.length < 4) { setError("Enter the full OTP"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpInput }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      const signInResult = await signIn("credentials", {
        email: data.user.email,
        password: data.authToken,
        redirect: false,
      });
      if (signInResult?.error) { setError("Failed to create session"); return; }
      router.push("/customer");
      router.refresh();
    } catch { setError("Verification failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/95">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <div className="h-16 w-16 rounded-full bg-red-700 flex items-center justify-center shadow-lg">
                <Car className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {mode === "select" && "Welcome Back"}
              {mode === "email" && "Staff Login"}
              {mode === "otp" && "Customer Login"}
              {mode === "otp-verify" && "Verify OTP"}
            </CardTitle>
            <CardDescription className="text-gray-500 mt-1">
              {mode === "select" && "Sign in to your Aradhana Travel account"}
              {mode === "email" && "Sign in with your email and password (Staff only)"}
              {mode === "otp" && "Enter your mobile number to receive OTP"}
              {mode === "otp-verify" && `OTP sent to ${phone}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" /> {error}
              </div>
            )}

            {showDevHint && (mode === "otp" || mode === "otp-verify") && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <div className="h-5 w-5 shrink-0 mt-0.5 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">i</div>
                <div>
                  <strong>Development:</strong> Use OTP <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">{DEV_OTP}</code> for any phone number
                  <button onClick={() => setShowDevHint(false)} className="block text-amber-600 hover:text-amber-800 underline mt-1">Dismiss</button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === "select" && (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Customers</p>
                      <p className="text-blue-600">Login with your mobile number & OTP</p>
                    </div>
                  </div>
                  <Button onClick={() => setMode("otp")} className="w-full h-12 rounded-xl bg-red-700 hover:bg-red-800 text-white shadow-sm">
                    <Smartphone className="h-5 w-5 mr-2" /> Continue with Mobile OTP
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Or</span></div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-start gap-3">
                    <Shield className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">Staff / Admin</p>
                      <p className="text-gray-500">Login with your email & password</p>
                    </div>
                  </div>
                  <Button onClick={() => setMode("email")} variant="outline" className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Mail className="h-5 w-5 mr-2" /> Sign in with Email
                  </Button>
                </motion.div>
              )}

              {mode === "email" && (
                <motion.form key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-start gap-2">
                    <Shield className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">Staff / Admin login. For customer accounts, use Mobile OTP instead.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-xl border-gray-200 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl bg-red-700 hover:bg-red-800 text-white" disabled={loading}>
                    {loading ? "Signing in..." : <><LogIn className="h-4 w-4 mr-2" /> Sign In</>}
                  </Button>
                  <button type="button" onClick={() => setMode("select")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to login options
                  </button>
                </motion.form>
              )}

              {mode === "otp" && (
                <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                    <Users className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">Customer login. Enter the mobile number linked to your account.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (optional for new users)</Label>
                    <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl border-gray-200" />
                  </div>
                  <Button onClick={sendOtp} className="w-full h-11 rounded-xl bg-red-700 hover:bg-red-800 text-white" disabled={loading}>
                    {loading ? "Sending..." : <><Smartphone className="h-4 w-4 mr-2" /> Send OTP</>}
                  </Button>
                  <button type="button" onClick={() => setMode("select")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to login options
                  </button>
                </motion.div>
              )}

              {mode === "otp-verify" && (
                <motion.div key="otp-verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle className="h-4 w-4 shrink-0" /> OTP sent to {phone}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input id="otp" type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-11 rounded-xl border-gray-200 text-center text-2xl tracking-[0.5em] font-mono" autoFocus />
                  </div>
                  <Button onClick={verifyOtpHandler} className="w-full h-11 rounded-xl bg-red-700 hover:bg-red-800 text-white" disabled={loading || otpInput.length < 4}>
                    {loading ? "Verifying..." : <><CheckCircle className="h-4 w-4 mr-2" /> Verify & Login</>}
                  </Button>
                  <button type="button" onClick={() => { setOtpInput(""); sendOtp(); }} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center justify-center w-full" disabled={loading}>
                    Resend OTP
                  </button>
                  <button type="button" onClick={() => { setMode("otp"); setOtpInput(""); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Change phone number
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-red-700 hover:text-red-800 font-medium hover:underline">Create one</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
