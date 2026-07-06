"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBookings, useUpdateBookingStatus } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import { useState } from "react";
import {
  MapPin,
  Navigation,
  CheckCircle,
  XCircle,
  PlayCircle,
  CalendarCheck,
} from "lucide-react";

export default function DriverRidesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: bookings, isLoading } = useBookings(
    statusFilter ? { status: statusFilter } : undefined
  );
  const updateStatus = useUpdateBookingStatus();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "DRIVER") {
      router.push("/");
    }
  }, [session, status, router]);

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: string
  ) => {
    await updateStatus.mutateAsync({ id: bookingId, status: newStatus });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">My Rides</h1>
          <p className="text-gray-500 mt-1">View and manage all your rides</p>
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="REQUESTED">Requested</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="STARTED">Started</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
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
            customer: { name: string; phone: string };
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
                    <Badge
                      variant={
                        booking.status === "COMPLETED"
                          ? "default"
                          : booking.status === "CANCELLED"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {booking.status}
                    </Badge>
                    <span className="font-semibold text-lg">
                      {formatCurrency(booking.fare)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>{booking.pickupAddress}</span>
                  </div>
                  {booking.dropAddress && (
                    <div className="flex items-start gap-2">
                      <Navigation className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{booking.dropAddress}</span>
                    </div>
                  )}
                  <p>
                    Customer: {booking.customer?.name} -{" "}
                    {booking.customer?.phone}
                  </p>
                </div>

                <div className="flex gap-2">
                  {booking.status === "ACCEPTED" && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(booking.id, "STARTED")
                      }
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Ride
                    </Button>
                  )}
                  {booking.status === "STARTED" && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(booking.id, "COMPLETED")
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Ride
                    </Button>
                  )}
                  {(booking.status === "ACCEPTED" ||
                    booking.status === "STARTED") && (
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() =>
                        handleUpdateStatus(booking.id, "CANCELLED")
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
        {bookingsList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No rides found</p>
          </div>
        )}
      </div>
    </div>
  );
}
