"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Search, CheckCircle } from "lucide-react";

export default function EditBookingPage() {
  const [step, setStep] = useState<"search" | "edit" | "done">("search");
  const [bookingId, setBookingId] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) { setError("Booking not found"); return; }
      const data = await res.json();
      setPickup((data as Record<string, string>).pickupAddress || "");
      setDrop((data as Record<string, string>).dropAddress || "");
      setPhone((data as Record<string, string>).customerPhone || "");
      setStep("edit");
    } catch { setError("Failed to fetch booking"); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupAddress: pickup, dropAddress: drop, customerPhone: phone, notes }),
      });
      if (!res.ok) { setError("Failed to update booking"); return; }
      setStep("done");
    } catch { setError("An error occurred"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Edit3 className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Edit Booking</h1>
          <p className="text-gray-500 mt-2">Update pickup/drop locations or contact details</p>
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

            {step === "edit" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pickup Address</Label>
                  <Input value={pickup} onChange={(e) => setPickup(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Drop Address</Label>
                  <Input value={drop} onChange={(e) => setDrop(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Special Instructions</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("search")} className="flex-1">Back</Button>
                  <Button onClick={handleUpdate} className="flex-1 bg-red-700 hover:bg-red-800" disabled={loading}>
                    {loading ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Updated</h2>
                <p className="text-gray-500 mb-6">Your booking details have been updated successfully.</p>
                <Button onClick={() => { setStep("search"); setBookingId(""); }} className="bg-red-700 hover:bg-red-800">Edit Another</Button>
              </div>
            )}

            {error && <div className="mt-4 text-sm text-red-600 text-center">{error}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
