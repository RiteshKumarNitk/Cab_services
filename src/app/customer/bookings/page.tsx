"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBookings } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
  getStatusColor,
} from "@/lib/utils";
import { CalendarCheck, Car } from "lucide-react";
import Link from "next/link";

export default function CustomerBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: bookings, isLoading } = useBookings();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">View all your ride bookings</p>
        </div>
        <Link href="/customer">
          <Button>
            <Car className="h-4 w-4 mr-2" />
            Book New Ride
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {bookingsList.map(
          (booking: {
            id: string;
            bookingType: string;
            status: string;
            fare: number;
            pickupAddress: string;
            dropAddress: string;
            driver: { name: string } | null;
            vehicle: { model: string; plateNumber: string } | null;
            createdAt: string;
          }) => (
            <Card key={booking.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {getBookingTypeName(booking.bookingType)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <span className="font-semibold">
                      {formatCurrency(booking.fare)}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Pickup:</span>{" "}
                    {booking.pickupAddress}
                  </p>
                  {booking.dropAddress && (
                    <p>
                      <span className="font-medium">Drop:</span>{" "}
                      {booking.dropAddress}
                    </p>
                  )}
                  {booking.driver && (
                    <p>
                      <span className="font-medium">Driver:</span>{" "}
                      {booking.driver.name}
                    </p>
                  )}
                  {booking.vehicle && (
                    <p>
                      <span className="font-medium">Vehicle:</span>{" "}
                      {booking.vehicle.model} - {booking.vehicle.plateNumber}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
        {bookingsList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No bookings yet</p>
            <Link href="/customer">
              <Button className="mt-4">Book Your First Ride</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
