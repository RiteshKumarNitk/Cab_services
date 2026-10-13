"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Car, MapPin, User, FileText, Phone } from "lucide-react";

interface TimelineEntry {
  label: string;
  order: number;
  completed: boolean;
  active: boolean;
}

export default function CustomerTripDetails() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => fetch(`/api/bookings/${bookingId}`).then(res => res.json()),
  });

  if (isLoading) return <div className="p-8 text-center">Loading trip details...</div>;
  if (!booking) return <div className="p-8 text-center text-red-500">Trip not found.</div>;

  const isQuotation = booking.status === "QUOTE_SENT" || booking.status === "PRICE_SENT";
  const canConfirm = booking.status === "QUOTE_SENT" || booking.status === "PRICE_SENT" || booking.status === "QUOTE_PREPARING";

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not update the booking. Please contact support.");
    }
    await refetch();
  };

  // Trip OTP: shown to the customer until the driver starts the trip.
  const tripOtp: string | null =
    booking.trip?.otp && ["READY_FOR_DISPATCH", "VEHICLE_READY"].includes(booking.status) ? booking.trip.otp : null;

  const handleConfirm = async () => {
    try {
      await updateStatus("QUOTE_ACCEPTED");
    } catch (err) {
      console.error("Failed to confirm:", err);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await updateStatus("CANCELLED");
    } catch (err) {
      console.error("Failed to cancel:", err);
    }
  };

  const timeline: TimelineEntry[] = booking.timeline || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Trip Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length > 0 ? (
                <div className="space-y-0">
                  {timeline.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          step.completed ? "bg-emerald-500" : step.active ? "bg-blue-500" : "bg-gray-200"
                        }`}>
                          {step.completed && <CheckCircle className="h-4 w-4 text-white" />}
                          {step.active && !step.completed && <div className="h-2 w-2 bg-white rounded-full animate-pulse" />}
                        </div>
                        {i < timeline.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                      </div>
                      <div className={`pt-0.5 ${step.active ? "font-medium text-blue-600" : step.completed ? "text-gray-600" : "text-gray-400"}`}>
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Timeline unavailable</p>
              )}

              <div className="mt-6 space-y-3">
                {tripOtp && (
                  <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                    <p className="text-sm text-violet-800 font-medium">Your trip OTP</p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-violet-700 mt-1">{tripOtp}</p>
                    <p className="text-xs text-violet-600 mt-1">Share it with your driver only when you board.</p>
                  </div>
                )}
                {isQuotation && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Quotation Ready</p>
                    <p className="text-xs text-blue-600 mt-1">Please review and confirm to proceed</p>
                  </div>
                )}
                {canConfirm && (
                  <Button onClick={handleConfirm} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle className="h-4 w-4 mr-2" /> Accept & Confirm
                  </Button>
                )}
                <Button onClick={handleCancel} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                  Cancel Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Pickup</p>
                  <p className="text-sm text-gray-900">{booking.pickupAddress}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(booking.pickupDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Drop</p>
                  <p className="text-sm text-gray-900">{booking.dropAddress}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Passengers</p>
                  <p className="text-sm text-gray-900">{booking.passengers}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Status</p>
                  <p className="text-sm text-gray-900">{booking.customerFacingStatus || booking.status?.replace(/_/g, " ")}</p>
                </div>
              </div>
              {booking.totalFare ? (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase">Total Fare</p>
                  <p className="text-xl font-bold text-gray-900">₹{booking.totalFare.toLocaleString()}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {booking.vehicle && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">{booking.vehicle.name}</p>
                <p className="text-sm text-gray-500">{booking.vehicle.plateNumber}</p>
              </CardContent>
            </Card>
          )}

          {booking.driver && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Driver
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{booking.driver.name}</p>
                  <p className="text-sm text-gray-500">{booking.driver.phone}</p>
                </div>
                <Button size="sm" variant="outline" className="border-gray-200">
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
              </CardContent>
            </Card>
          )}

          {booking.specialInstructions && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{booking.specialInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
