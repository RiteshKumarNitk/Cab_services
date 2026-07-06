"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBookings } from "@/lib/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import { DollarSign, CalendarCheck, TrendingUp } from "lucide-react";

export default function DriverEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: bookings, isLoading } = useBookings();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "DRIVER") {
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
  const completedBookings = bookingsList.filter(
    (b: { status: string }) => b.status === "COMPLETED"
  );

  const totalEarnings = completedBookings.reduce(
    (sum: number, b: { fare: number }) => sum + b.fare,
    0
  );
  const totalRides = completedBookings.length;
  const avgFare = totalRides > 0 ? totalEarnings / totalRides : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
        <p className="text-gray-500 mt-1">Track your earnings and ride history</p>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totalEarnings)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-600" />
              Total Rides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalRides}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Average per Ride
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(avgFare)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completed Rides</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Fare
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {completedBookings.map(
                  (booking: {
                    id: string;
                    bookingType: string;
                    fare: number;
                    customer: { name: string };
                    createdAt: string;
                  }) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {getBookingTypeName(booking.bookingType)}
                      </td>
                      <td className="py-3 px-4">
                        {booking.customer?.name || "N/A"}
                      </td>
                      <td className="py-3 px-4 font-medium text-green-600">
                        {formatCurrency(booking.fare)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDateTime(booking.createdAt)}
                      </td>
                    </tr>
                  )
                )}
                {completedBookings.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-gray-500"
                    >
                      No completed rides yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
