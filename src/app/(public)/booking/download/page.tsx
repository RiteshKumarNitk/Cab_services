"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, FileText } from "lucide-react";

export default function DownloadTicketPage() {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) { setError("Please enter a booking ID"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) { setError("Booking not found"); return; }
      window.open(`/api/bookings/${bookingId}/ticket`, "_blank");
    } catch { setError("Failed to download ticket"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Download className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Download Ticket</h1>
          <p className="text-gray-500 mt-2">Download your booking confirmation ticket</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleDownload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input id="bookingId" placeholder="e.g. BK-00001" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 bg-red-700 hover:bg-red-800" disabled={loading}>
                <Download className="h-4 w-4 mr-2" /> {loading ? "Searching..." : "Download Ticket"}
              </Button>
            </form>
            {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mt-6 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            <p>If you cannot find your booking ID, please check your email or SMS for the booking confirmation. You can also <a href="/contact" className="text-red-700 hover:underline">contact our support team</a> for assistance.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
