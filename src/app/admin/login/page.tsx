"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Car,
  Users,
  MapPin,
  Star,
} from "lucide-react";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid admin credentials");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Link
        href="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-red-900 via-red-800 to-red-950 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 border border-white/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="mx-auto h-20 w-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Aradhana Travel</h1>
          <p className="text-red-200 text-lg mb-10">Admin Control Panel</p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {[
              { icon: Car, label: "Fleet Mgmt" },
              { icon: Users, label: "User Mgmt" },
              { icon: MapPin, label: "Bookings" },
              { icon: Star, label: "Analytics" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
              >
                <Icon className="h-6 w-6 text-red-300 mx-auto mb-2" />
                <p className="text-sm text-red-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="mx-auto h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-900/50">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Aradhana Admin
            </h1>
            <p className="text-gray-400 mt-2">
              Secure access for administrative personnel
            </p>
          </div>

          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-400 mt-1">
              Sign in to manage your platform
            </p>
          </div>

          <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Administrator Login
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your credentials to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-950/50 border border-red-900 text-red-500 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-950 border-gray-800 text-white focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-950 border-gray-800 text-white focus:border-red-500 focus:ring-red-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Sign In to Admin Panel"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
