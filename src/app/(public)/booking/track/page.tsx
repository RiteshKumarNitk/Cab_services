"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Car, Clock, ChevronDown, ChevronUp } from "lucide-react";

export default function TrackBookingPage() {
  const [bookingId, setBookingId] = useState("");
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTracking(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) { setError("Booking not found. Please check your ID and try again."); return; }
      const data = await res.json();
      setTracking(data);
    } catch { setError("Failed to fetch booking details. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Track Your Ride</h1>
          <p className="text-gray-500 mt-2">Enter your booking ID to see real-time status</p>
        </div>

        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input id="bookingId" placeholder="e.g. BK-00001" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Registered Phone Number (optional)</Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 bg-red-700 hover:bg-red-800" disabled={loading}>
                {loading ? "Searching..." : <><Search className="h-4 w-4 mr-2" /> Track Booking</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-6">
            {error}
          </motion.div>
        )}

        {tracking && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`h-2 ${(tracking as Record<string, string>).status === "COMPLETED" ? "bg-emerald-500" : (tracking as Record<string, string>).status === "STARTED" ? "bg-purple-500" : "bg-amber-500"}`} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Booking {(tracking as Record<string, string>).id?.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{(tracking as Record<string, string>).bookingType} Trip</p>
                  </div>
                  <Badge className="text-sm px-4 py-1.5">
                    {(tracking as Record<string, string>).status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4" /> {(tracking as Record<string, string>).pickupAddress}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Car className="h-4 w-4" /> Driver: {(tracking as Record<string, { name: string } | null>).driver?.name || "Not assigned"}
                  </div>
                </div>

                <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-sm text-red-700 hover:text-red-800 font-medium">
                  {expanded ? <><ChevronUp className="h-4 w-4" /> Hide Details</> : <><ChevronDown className="h-4 w-4" /> View Full Details</>}
                </button>

                {expanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-3 text-sm bg-gray-50 rounded-xl p-4">
                    {[
                      { label: "Drop Address", value: (tracking as Record<string, string>).dropAddress || "N/A" },
                      { label: "Customer", value: (tracking as Record<string, { name: string }>).customer?.name },
                      { label: "Phone", value: (tracking as Record<string, string>).customerPhone || (tracking as Record<string, { phone: string }>).customer?.phone || (tracking as Record<string, string>).phone || "—" },
                      { label: "Fare", value: `₹${(tracking as Record<string, number>).fare || 0}` },
                      { label: "Payment", value: (tracking as Record<string, string>).paymentStatus },
                      { label: "Vehicle", value: (tracking as Record<string, { plateNumber: string }>).vehicle?.plateNumber || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-700">{value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
