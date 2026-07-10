"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Search, CheckCircle, ArrowLeft } from "lucide-react";

export default function RescheduleBookingPage() {
  const [step, setStep] = useState<"search" | "reschedule" | "done">("search");
  const [bookingId, setBookingId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
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
      setStep("reschedule");
    } catch { setError("Failed to fetch booking"); }
    finally { setLoading(false); }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) { setError("Please select a new date and time"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESCHEDULED", reason: `Rescheduled to ${newDate} ${newTime}. ${reason}` }),
      });
      if (!res.ok) { setError("Failed to reschedule"); return; }
      setStep("done");
    } catch { setError("An error occurred"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Reschedule Trip</h1>
          <p className="text-gray-500 mt-2">Change the date and time of your booking</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {step === "search" && (
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingId">Booking ID</Label>
                  <Input id="bookingId" placeholder="e.g. BK-00001" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required className="h-11" />
                </div>
                <Button type="submit" className="w-full h-11 bg-red-700 hover:bg-red-800" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" /> {loading ? "Searching..." : "Find Booking"}
                </Button>
              </form>
            )}

            {step === "reschedule" && booking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                  Rescheduling booking {(booking as Record<string, string>).id?.slice(0, 8)} — {(booking as Record<string, string>).pickupAddress}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>New Date</Label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>New Time</Label>
                    <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason for rescheduling</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why..." rows={2} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("search")} className="flex-1"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                  <Button onClick={handleReschedule} className="flex-1 bg-red-700 hover:bg-red-800" disabled={loading}>
                    {loading ? "Rescheduling..." : "Confirm Reschedule"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip Rescheduled</h2>
                <p className="text-gray-500 mb-6">Your booking has been rescheduled to {newDate} at {newTime}.</p>
                <Button onClick={() => { setStep("search"); setBookingId(""); }} className="bg-red-700 hover:bg-red-800">Reschedule Another</Button>
              </motion.div>
            )}

            {error && <div className="mt-4 text-sm text-red-600 text-center">{error}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
