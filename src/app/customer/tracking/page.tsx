"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Car, MapPin, User, Phone, Navigation, CheckCircle } from "lucide-react";
import Link from "next/link";

interface TimelineEntry {
  label: string;
  order: number;
  completed: boolean;
  active: boolean;
}

export default function CustomerTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: activeBookings, isLoading } = useQuery({
    queryKey: ["customer-tracking"],
    queryFn: () =>
      fetch("/api/bookings?status=TRIP_STARTED,READY_FOR_DISPATCH").then(
        (res) => res.json()
      ),
    refetchInterval: 10000,
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  const bookings: Array<{
    id: string;
    bookingType: string;
    status: string;
    pickupAddress: string;
    dropAddress: string;
    pickupDate: string;
    fare: number;
    totalFare?: number;
    driver?: { id: string; name: string; phone: string } | null;
    vehicle?: { name: string; plateNumber: string; model: string } | null;
    timeline?: TimelineEntry[];
  }> = Array.isArray(activeBookings) ? activeBookings : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-500 mt-1">Track your active trips in real-time</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading active trips...</div>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="p-12 text-center text-gray-500">
            <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-1">No active trips</p>
            <p className="text-sm mb-4">You don&apos;t have any trips in progress right now.</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Book a Ride
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const timeline = booking.timeline || [];

            return (
              <Card key={booking.id} className="shadow-sm border-l-4 border-l-emerald-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-5 w-5 text-emerald-600" />
                      {booking.bookingType} Trip
                    </CardTitle>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 animate-pulse">
                      {booking.status === "TRIP_STARTED" ? "LIVE" : "READY"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Driver & Vehicle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {booking.driver && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{booking.driver.name}</p>
                          <a
                            href={`tel:${booking.driver.phone}`}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {booking.driver.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {booking.vehicle && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.vehicle.name || booking.vehicle.model}</p>
                          <p className="text-sm text-gray-500">{booking.vehicle.plateNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pickup & Drop */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <MapPin className="h-3 w-3 text-white" />
                        </div>
                        <div className="w-0.5 h-6 bg-gray-200" />
                        <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                          <MapPin className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900">{booking.pickupAddress}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(booking.pickupDate)}</p>
                        <p className="text-sm font-medium text-gray-900 mt-2">{booking.dropAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Timeline */}
                  {timeline.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-medium text-gray-400 uppercase mb-3">Trip Progress</p>
                      <div className="space-y-0">
                        {timeline.map((step, i) => (
                          <div key={i} className="flex items-start gap-3 pb-3 last:pb-0">
                            <div className="flex flex-col items-center">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                                step.completed ? "bg-emerald-500" : step.active ? "bg-blue-500" : "bg-gray-200"
                              }`}>
                                {step.completed && <CheckCircle className="h-3 w-3 text-white" />}
                                {step.active && !step.completed && (
                                  <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                                )}
                              </div>
                              {i < timeline.length - 1 && <div className="w-0.5 h-5 bg-gray-200" />}
                            </div>
                            <span className={`text-xs ${
                              step.active ? "font-medium text-blue-600" : step.completed ? "text-gray-600" : "text-gray-400"
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link href={`/customer/bookings/${booking.id}`}>
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                      View Full Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
