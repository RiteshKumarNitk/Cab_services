"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function CancelBookingPage() {
  const [step, setStep] = useState<"search" | "confirm" | "done">("search");
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) { setError("Booking not found"); return; }
      const data = await res.json();
      setBooking(data);
      setStep("confirm");
    } catch { setError("Failed to fetch booking"); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", reason }),
      });
      if (!res.ok) { setError("Failed to cancel booking"); return; }
      setStep("done");
    } catch { setError("An error occurred"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Cancel Booking</h1>
          <p className="text-gray-500 mt-2">Cancel your ride and request a refund</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {step === "search" && (
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingId">Booking ID</Label>
                  <Input id="bookingId" placeholder="e.g. BK-00001" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required className="h-11" />
                </div>
                <p className="text-xs text-gray-400">Please note: Cancellation charges may apply as per our policy.</p>
                <Button type="submit" className="w-full h-11 bg-red-700 hover:bg-red-800" disabled={loading}>
                  {loading ? "Searching..." : "Find Booking"}
                </Button>
              </form>
            )}

            {step === "confirm" && booking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Are you sure you want to cancel?</p>
                    <p className="mt-1">Booking {(booking as Record<string, string>).id?.slice(0, 8)} — {(booking as Record<string, string>).pickupAddress}. A cancellation fee may apply.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for cancellation</Label>
                  <Textarea id="reason" placeholder="Tell us why you're cancelling..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("search")} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
                  </Button>
                  <Button onClick={handleCancel} className="flex-1 bg-red-700 hover:bg-red-800" disabled={loading}>
                    {loading ? "Cancelling..." : "Confirm Cancellation"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Cancelled</h2>
                <p className="text-gray-500 mb-6">Your booking has been cancelled successfully. Refund will be processed within 7-10 business days.</p>
                <Button onClick={() => { setStep("search"); setBookingId(""); setReason(""); }} className="bg-red-700 hover:bg-red-800">
                  Cancel Another Booking
                </Button>
              </motion.div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center">{error}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
