"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBookings, useCreateRating } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CalendarCheck, Star } from "lucide-react";

export default function CustomerHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");
  const { data: bookings } = useBookings();
  const createRating = useCreateRating();

  const [ratingDialog, setRatingDialog] = useState<string | null>(null);
  const [ratingDriverId, setRatingDriverId] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  let bookingsList = Array.isArray(bookings) ? bookings : [];

  // Filter completed/cancelled only
  bookingsList = bookingsList.filter(
    (b: { status: string }) =>
      b.status === "COMPLETED" || b.status === "CANCELLED"
  );

  if (typeFilter) {
    bookingsList = bookingsList.filter(
      (b: { bookingType: string }) => b.bookingType === typeFilter
    );
  }

  const handleRateDriver = async (bookingId: string) => {
    await createRating.mutateAsync({
      bookingId,
      driverId: ratingDriverId,
      score: ratingScore,
      comment: ratingComment,
    });
    setRatingDialog(null);
    setRatingScore(5);
    setRatingComment("");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ride History</h1>
        <p className="text-gray-500 mt-1">View your past rides and rate drivers</p>
      </div>

      <div className="mb-6">
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? "")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="LOCAL">Local</SelectItem>
            <SelectItem value="OUTSTATION">Outstation</SelectItem>
            <SelectItem value="AIRPORT">Airport</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="EVENT">Event</SelectItem>
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
            driver: { id: string; name: string } | null;
            rating: { score: number; comment: string | null } | null;
            createdAt: string;
          }) => (
            <Card key={booking.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {getBookingTypeName(booking.bookingType)}
                      </h3>
                      <Badge
                        variant={
                          booking.status === "COMPLETED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(booking.createdAt)}
                    </p>
                    <p className="text-sm mt-2">
                      {booking.pickupAddress}
                      {booking.dropAddress && ` → ${booking.dropAddress}`}
                    </p>
                    {booking.driver && (
                      <p className="text-sm text-gray-600 mt-1">
                        Driver: {booking.driver.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatCurrency(booking.fare)}
                    </p>
                    {booking.status === "COMPLETED" && !booking.rating && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setRatingDialog(booking.id);
                          setRatingDriverId(booking.driver?.id || "");
                        }}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Rate Driver
                      </Button>
                    )}
                    {booking.rating && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-yellow-500 justify-end">
                          {Array.from({ length: booking.rating.score }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-current"
                              />
                            )
                          )}
                        </div>
                        {booking.rating.comment && (
                          <p className="text-xs text-gray-500 mt-1">
                            &ldquo;{booking.rating.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Dialog */}
                {ratingDialog === booking.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">
                      Rate your driver
                    </h4>
                    <div className="flex gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingScore(star)}
                          className={`h-8 w-8 ${
                            star <= ratingScore
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }`}
                        >
                          <Star className="h-full w-full fill-current" />
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Leave a comment (optional)"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRateDriver(booking.id)}
                      >
                        Submit Rating
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRatingDialog(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        )}
        {bookingsList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No ride history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
