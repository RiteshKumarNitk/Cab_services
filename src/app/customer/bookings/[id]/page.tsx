"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Car, MapPin, User, FileText, Download } from "lucide-react";

export default function CustomerTripDetails() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => fetch(`/api/bookings/${bookingId}`).then(res => res.json()),
  });

  if (isLoading) return <div className="p-8 text-center">Loading trip details...</div>;
  if (!booking) return <div className="p-8 text-center text-red-500">Trip not found.</div>;

  const isQuotation = booking.status === "PRICE_SENT";

  const handleConfirm = () => {
    // API call to confirm booking
    alert("Trip Confirmed! We will assign a driver soon.");
    router.push("/customer");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isQuotation ? "Quotation Review" : "Trip Details"}</h1>
          <p className="text-gray-500 text-sm">Booking ID: {booking.id.split("-")[0]}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
          isQuotation ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
        }`}>
          {booking.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Route Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" /> Itinerary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative pl-6 border-l-2 border-gray-200 space-y-6 ml-2 mt-2">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-blue-600 border-4 border-white" />
                  <p className="text-sm font-semibold text-gray-500">PICKUP</p>
                  <p className="font-medium text-lg">{booking.pickupAddress}</p>
                  <p className="text-gray-500 text-sm">{formatDateTime(booking.pickupDate)}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-red-500 border-4 border-white" />
                  <p className="text-sm font-semibold text-gray-500">DROP</p>
                  <p className="font-medium text-lg">{booking.dropAddress}</p>
                  {booking.returnDate && (
                    <p className="text-gray-500 text-sm">{formatDateTime(booking.returnDate)}</p>
                  )}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Trip Type</span>
                  <span className="font-semibold">{booking.tripType}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Car Category</span>
                  <span className="font-semibold">{booking.preferredCategory}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Driver (if confirmed and assigned) */}
          {booking.driver && (
            <Card className="border-green-100 shadow-sm">
              <CardHeader className="bg-green-50 pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                  <User className="h-5 w-5" /> Assigned Driver
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex gap-4 items-center">
                <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {booking.driver.cabDriverProfile?.driverPhoto ? (
                    <img src={booking.driver.cabDriverProfile.driverPhoto} alt="Driver" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{booking.driver.name}</h3>
                  <p className="text-gray-600">{booking.driver.phone}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">⭐ {booking.driver.ratingsReceived?.length || 5.0} Rating</span>
                    {booking.vehicle && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{booking.vehicle.plateNumber}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Invoice / Quotation Details */}
        <div>
          <Card className="shadow-lg border-t-4 border-t-blue-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /> {isQuotation ? "Quotation Details" : "Invoice Preview"}</span>
                {!isQuotation && <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Base Fare (Min. {booking.billableKm} KM)</span>
                  <span className="font-medium">₹{booking.baseFare || 0}</span>
                </div>
                {booking.nightCharges > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Night Allowance</span>
                    <span className="font-medium">₹{booking.nightCharges}</span>
                  </div>
                )}
                {booking.stateTax > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">State Tax / Permit</span>
                    <span className="font-medium">₹{(booking.stateTax || 0) + (booking.permitCharges || 0)}</span>
                  </div>
                )}
                
                <div className="border-t my-2 pt-2" />
                
                <div className="flex justify-between py-1 font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{booking.totalFare}</span>
                </div>

                {isQuotation && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs mt-4">
                    <strong>Important Note:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Toll taxes and Parking charges are extra and payable as per actuals.</li>
                      <li>Extra KMs beyond the billable KMs will be charged at applicable rates.</li>
                    </ul>
                  </div>
                )}
              </div>

              {isQuotation && (
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-lg py-6" onClick={handleConfirm}>
                  <CheckCircle className="mr-2 h-5 w-5" /> Accept Quotation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
