"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ArrowLeft, Send, Save, CheckCircle } from "lucide-react";

export default function AdminQuotationGenerator() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  // Ideally fetch this single booking from API
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => fetch(`/api/bookings/${bookingId}`).then(res => res.json()),
  });

  const [pricing, setPricing] = useState({
    pricePerKm: 11,
    billableKm: 350,
    nightCharges: 0,
    parkingCharges: 0,
    tollCharges: 0,
    stateTax: 0,
    permitCharges: 0,
    discount: 0,
  });

  useEffect(() => {
    if (booking?.preferredCategory === "SUV") {
      setPricing(prev => ({ ...prev, pricePerKm: 25 }));
    }
  }, [booking]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!booking) return <div className="p-8 text-center text-red-500">Booking not found.</div>;

  const handleInputChange = (field: keyof typeof pricing, value: string) => {
    setPricing(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const vehicleCharge = pricing.pricePerKm * pricing.billableKm;
  const totalFare = vehicleCharge + pricing.nightCharges + pricing.parkingCharges + pricing.tollCharges + pricing.stateTax + pricing.permitCharges - pricing.discount;

  const submitQuotation = async () => {
    // This would be a server action or API call
    alert("Quotation Sent to Customer!");
    router.push("/admin");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Generate Quotation</h1>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Col: Trip Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold w-24 inline-block">Name:</span> {booking.customer?.name}</p>
              <p><span className="font-semibold w-24 inline-block">Phone:</span> {booking.customer?.phone}</p>
              <p><span className="font-semibold w-24 inline-block">Email:</span> {booking.customer?.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-gray-500">Pickup</p>
                  <p className="font-medium">{booking.pickupAddress}</p>
                  <p className="text-gray-500 text-xs mt-1">{formatDateTime(booking.pickupDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Drop</p>
                  <p className="font-medium">{booking.dropAddress}</p>
                  {booking.returnDate && (
                    <p className="text-gray-500 text-xs mt-1">Return: {formatDateTime(booking.returnDate)}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-500">Trip Type:</span>
                <span className="font-medium">{booking.tripType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Car Category:</span>
                <span className="font-medium">{booking.preferredCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Passengers/Bags:</span>
                <span className="font-medium">{booking.passengers} / {booking.bags}</span>
              </div>
              {booking.specialInstructions && (
                <div className="pt-2">
                  <span className="text-gray-500">Notes:</span>
                  <p className="font-medium bg-yellow-50 p-2 mt-1 text-sm rounded">{booking.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Pricing Calculator */}
        <div>
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <CardTitle className="text-blue-900">Fare Calculator</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Price Per KM (₹)</Label>
                  <Input 
                    type="number" 
                    value={pricing.pricePerKm} 
                    onChange={e => handleInputChange("pricePerKm", e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label>Billable KM (Min)</Label>
                  <Input 
                    type="number" 
                    value={pricing.billableKm} 
                    onChange={e => handleInputChange("billableKm", e.target.value)} 
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Vehicle Charge:</span>
                  <span className="font-semibold text-lg">₹{vehicleCharge}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label>Night Charges (₹)</Label>
                    <Input type="number" value={pricing.nightCharges} onChange={e => handleInputChange("nightCharges", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Toll Charges (₹)</Label>
                    <Input type="number" value={pricing.tollCharges} onChange={e => handleInputChange("tollCharges", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>State Tax (₹)</Label>
                    <Input type="number" value={pricing.stateTax} onChange={e => handleInputChange("stateTax", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Discount (₹)</Label>
                    <Input type="number" value={pricing.discount} onChange={e => handleInputChange("discount", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{totalFare + pricing.discount}</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span>Discount:</span>
                  <span>- ₹{pricing.discount}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-bold text-lg text-gray-900">Grand Total:</span>
                  <span className="font-bold text-2xl text-blue-600">₹{totalFare}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">Parking charges are extra and payable as per actuals.</p>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1">
                  <Save className="h-4 w-4 mr-2" /> Save Draft
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={submitQuotation}>
                  <Send className="h-4 w-4 mr-2" /> Send Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
