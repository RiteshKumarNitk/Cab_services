"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, UserPlus, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        router.push("/auth/login?registered=true");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 right-20 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.3, 1, 1.3], rotate: [360, 180, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 left-20 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 right-10 w-40 h-40 bg-indigo-200/20 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl shadow-blue-200/50 backdrop-blur-xl bg-white/90">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mx-auto mb-4"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/30 animate-pulse-glow">
                <Car className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                Join Aradhana Travel Service today
              </CardDescription>
            </motion.div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3 pt-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                >
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-1.5"
              >
                <Label htmlFor="name" className="text-gray-700 text-sm">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-10 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-1.5"
              >
                <Label htmlFor="email" className="text-gray-700 text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-10 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-1.5"
              >
                <Label htmlFor="phone" className="text-gray-700 text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-1.5"
              >
                <Label htmlFor="role" className="text-gray-700 text-sm">I am a</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value ?? "CUSTOMER" })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="space-y-1.5"
                >
                  <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      className="h-10 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-1.5"
                >
                  <Label htmlFor="confirmPassword" className="text-gray-700 text-sm">Confirm</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="h-10 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="w-full"
              >
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 btn-shimmer"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </span>
                  )}
                </Button>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-500"
              >
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                  Sign In
                </Link>
              </motion.p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
