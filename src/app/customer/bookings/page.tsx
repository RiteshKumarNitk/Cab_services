"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBookings } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import { CalendarCheck, Car, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BookingItem {
  id: string;
  bookingType: string;
  createdAt: string;
  status: string;
  fare: number | null;
  pickupAddress: string;
  dropAddress?: string | null;
  driver?: { name: string } | null;
  vehicle?: { model: string; plateNumber: string } | null;
}

export default function CustomerBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: bookings, isLoading } = useBookings();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  const bookingsList: BookingItem[] = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">View all your ride bookings</p>
        </div>
        <Link href="/">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <Car className="h-4 w-4 mr-2" />
            Book New Ride
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {bookingsList.map((booking) => (
          <Link key={booking.id} href={`/customer/bookings/${booking.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getBookingTypeName(booking.bookingType)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'PRICE_SENT' ? 'bg-amber-100 text-amber-800' :
                      booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      booking.status === 'STARTED' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status.replace(/_/g, " ")}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(booking.fare ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{booking.pickupAddress}</span>
                    {booking.dropAddress && <><ArrowRight className="h-3 w-3 text-gray-300" /><span>{booking.dropAddress}</span></>}
                  </div>
                  {booking.driver && (
                    <p className="ml-5"><span className="font-medium">Driver:</span> {booking.driver.name}</p>
                  )}
                  {booking.vehicle && (
                    <p className="ml-5"><span className="font-medium">Vehicle:</span> {booking.vehicle.model} - {booking.vehicle.plateNumber}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {bookingsList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No bookings yet</p>
            <Link href="/">
              <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white">Book Your First Ride</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
