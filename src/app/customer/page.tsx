"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBookings, useCreateBooking } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  getStatusColor,
  calculateFare,
} from "@/lib/utils";
import {
  Car,
  Clock,
  MapPin,
  IndianRupee,
  Navigation,
  Star,
} from "lucide-react";
import { useCreateRating } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: bookings } = useBookings();
  const createBooking = useCreateBooking();

  const [bookingType, setBookingType] = useState("LOCAL");
  const [vehicleType, setVehicleType] = useState("SEDAN");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [ratingDialog, setRatingDialog] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const createRating = useCreateRating();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  // Fetch pricing for estimation
  const { data: pricingData } = useQuery({
    queryKey: ["pricing-estimate", vehicleType],
    queryFn: () =>
      fetch(`/api/admin/pricing`).then((res) => res.json()),
  });

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const pricing = Array.isArray(pricingData)
        ? pricingData.find((p: { vehicleType: string }) => p.vehicleType === vehicleType)
        : null;

      if (pricing) {
        const result = calculateFare({
          vehicleType: vehicleType as "SEDAN" | "SUV",
          bookingType: bookingType as "LOCAL" | "OUTSTATION" | "AIRPORT" | "MONTHLY" | "EVENT",
          distance: 10, // default estimate
          duration: 20,
          pricing,
        });
        setEstimatedFare(result.fare);
      }
    } catch {
      setEstimatedFare(null);
    } finally {
      setEstimating(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBooking.mutateAsync({
      bookingType,
      vehicleType,
      pickupAddress,
      dropAddress,
      scheduledTime: scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : null,
      flightNumber: flightNumber || undefined,
      paymentMethod,
    });
    // Reset form
    setPickupAddress("");
    setDropAddress("");
    setEstimatedFare(null);
  };

  const handleRateDriver = async (bookingId: string, driverId: string) => {
    await createRating.mutateAsync({
      bookingId,
      driverId,
      score: ratingScore,
      comment: ratingComment,
    });
    setRatingDialog(null);
    setRatingScore(5);
    setRatingComment("");
  };

  const bookingsList = Array.isArray(bookings) ? bookings : [];
  const activeBookings = bookingsList.filter(
    (b: { status: string }) =>
      !["COMPLETED", "CANCELLED"].includes(b.status)
  );
  const pastBookings = bookingsList.filter(
    (b: { status: string }) =>
      ["COMPLETED", "CANCELLED"].includes(b.status)
  );

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session?.user?.name}!
        </h1>
        <p className="text-gray-500 mt-1">
          Book a ride or track your existing bookings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                Book a Ride
              </CardTitle>
              <CardDescription>
                Fill in the details to get a fare estimate and book
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Booking Type</Label>
                    <Select
                      value={bookingType}
                      onValueChange={(value) => setBookingType(value ?? "LOCAL")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOCAL">Local</SelectItem>
                        <SelectItem value="OUTSTATION">Outstation</SelectItem>
                        <SelectItem value="AIRPORT">Airport Transfer</SelectItem>
                        <SelectItem value="MONTHLY">Monthly Rental</SelectItem>
                        <SelectItem value="EVENT">Event Package</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Type</Label>
                    <Select
                      value={vehicleType}
                      onValueChange={(value) => setVehicleType(value ?? "SEDAN")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEDAN">Sedan</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pickup Address</Label>
                  <Textarea
                    placeholder="Enter pickup location"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                  />
                </div>

                {bookingType !== "MONTHLY" && bookingType !== "EVENT" && (
                  <div className="space-y-2">
                    <Label>Drop Address</Label>
                    <Textarea
                      placeholder="Enter destination"
                      value={dropAddress}
                      onChange={(e) => setDropAddress(e.target.value)}
                    />
                  </div>
                )}

                {bookingType === "AIRPORT" && (
                  <div className="space-y-2">
                    <Label>Flight Number (optional)</Label>
                    <Input
                      placeholder="e.g. AI-123"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date (optional)</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time (optional)</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value ?? "CASH")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="COMPANY">Company Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEstimate}
                    disabled={estimating}
                  >
                    <IndianRupee className="h-4 w-4 mr-2" />
                    {estimating ? "Calculating..." : "Estimate Fare"}
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Car className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </div>

                {estimatedFare !== null && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">
                      Estimated Fare: {formatCurrency(estimatedFare)}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      *Final fare may vary based on actual distance
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Active Bookings */}
          {activeBookings.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Bookings
              </h2>
              {activeBookings.map(
                (booking: {
                  id: string;
                  bookingType: string;
                  status: string;
                  fare: number;
                  pickupAddress: string;
                  dropAddress: string;
                  driver: { id: string; name: string; phone: string } | null;
                  vehicle: { model: string; plateNumber: string; color: string } | null;
                  createdAt: string;
                }) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">
                            {getBookingTypeName(booking.bookingType)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDateTime(booking.createdAt)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>

                      {/* Status Timeline */}
                      <div className="flex items-center gap-2 mb-4">
                        {["REQUESTED", "ACCEPTED", "STARTED", "COMPLETED"].map(
                          (step, i) => {
                            const statusOrder = [
                              "REQUESTED",
                              "ACCEPTED",
                              "STARTED",
                              "COMPLETED",
                            ];
                            const currentIndex = statusOrder.indexOf(
                              booking.status
                            );
                            const stepIndex = statusOrder.indexOf(step);
                            const isActive = stepIndex <= currentIndex;
                            const isCurrent = step === booking.status;

                            return (
                              <div key={step} className="flex items-center flex-1">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                    isActive
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200 text-gray-500"
                                  } ${isCurrent ? "ring-2 ring-blue-300" : ""}`}
                                >
                                  {i + 1}
                                </div>
                                {i < 3 && (
                                  <div
                                    className={`flex-1 h-1 ${
                                      isActive && i < currentIndex
                                        ? "bg-blue-600"
                                        : "bg-gray-200"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Pickup:</span>
                            <p>{booking.pickupAddress}</p>
                          </div>
                        </div>
                        {booking.dropAddress && (
                          <div className="flex items-start gap-2">
                            <Navigation className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="text-gray-500">Drop:</span>
                              <p>{booking.dropAddress}</p>
                            </div>
                          </div>
                        )}
                        {booking.driver && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>
                              Driver: {booking.driver.name} -{" "}
                              {booking.driver.phone}
                            </span>
                          </div>
                        )}
                        {booking.vehicle && (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <span>
                              {booking.vehicle.model} ({booking.vehicle.color}) -{" "}
                              {booking.vehicle.plateNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t flex justify-between items-center">
                        <span className="font-semibold text-lg">
                          {formatCurrency(booking.fare)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Past Bookings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Rides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastBookings.slice(0, 5).map(
                (booking: {
                  id: string;
                  bookingType: string;
                  status: string;
                  fare: number;
                  driver: { id: string; name: string } | null;
                  rating: { score: number } | null;
                  createdAt: string;
                }) => (
                  <div
                    key={booking.id}
                    className="border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          {getBookingTypeName(booking.bookingType)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(booking.createdAt)}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          {formatCurrency(booking.fare)}
                        </p>
                      </div>
                      <div className="text-right">
                        {booking.status === "COMPLETED" && !booking.rating && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRatingDialog(booking.id)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Rate
                          </Button>
                        )}
                        {booking.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-xs">{booking.rating.score}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rating Dialog */}
                    {ratingDialog === booking.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingScore(star)}
                              className={`h-6 w-6 ${
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
                          placeholder="Comment (optional)"
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              booking.driver &&
                              handleRateDriver(booking.id, booking.driver.id)
                            }
                          >
                            Submit
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
                  </div>
                )
              )}
              {pastBookings.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No ride history yet
                </p>
              )}
              {pastBookings.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => router.push("/customer/history")}
                >
                  View all rides
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
