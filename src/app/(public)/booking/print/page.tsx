"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Search } from "lucide-react";

export default function PrintTicketPage() {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) { setError("Please enter a booking ID"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) { setError("Booking not found"); return; }
      window.print();
    } catch { setError("Failed to load booking"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Printer className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Print Ticket</h1>
          <p className="text-gray-500 mt-2">Print your booking confirmation ticket</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handlePrint} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input id="bookingId" placeholder="e.g. BK-00001" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 bg-red-700 hover:bg-red-800" disabled={loading}>
                <Printer className="h-4 w-4 mr-2" /> {loading ? "Loading..." : "Print Ticket"}
              </Button>
            </form>
            {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
