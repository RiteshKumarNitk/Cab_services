"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { POLL, useBookings, useUpdateBookingStatus, useUpdateDriverLocation } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import {
  Car,
  MapPin,
  Navigation,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  PlayCircle,
  DollarSign,
  AlertTriangle,
  Camera,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function DriverDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Polls so newly dispatched trips appear without a manual refresh.
  const { data: bookings, isLoading } = useBookings(undefined, { refetchInterval: POLL.queue });
  const updateStatus = useUpdateBookingStatus();
  const updateLocation = useUpdateDriverLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "DRIVER") {
      router.push("/");
    }

    if (status === "authenticated") {
      fetch("/api/drivers/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: false }),
      }).catch(() => {});
    }
  }, [session, status, router]);

  const startLocationTracking = useCallback(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          updateLocation.mutate({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast.error("Failed to get location. Please enable GPS.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      setLocationWatchId(watchId);
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  }, [updateLocation]);

  const stopLocationTracking = useCallback(() => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
  }, [locationWatchId]);

  const handleToggleOnline = async (online: boolean) => {
    setIsOnline(online);
    try {
      await updateLocation.mutateAsync({ lat: 0, lng: 0, online });
      if (online) {
        startLocationTracking();
        toast.success("You are now online and accepting rides!");
      } else {
        stopLocationTracking();
        toast.info("You are now offline");
      }
    } catch {
      setIsOnline(!online);
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    return () => {
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string, reason?: string) => {
    await updateStatus.mutateAsync({ id: bookingId, status: newStatus, reason });
  };

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  const requestedBookings = bookingsList.filter(
    (b: { status: string }) => b.status === "REQUESTED"
  );
  const activeBookings = bookingsList.filter((b: { status: string }) =>
    ["ACCEPTED", "STARTED", "TRIP_STARTED", "PICKUP_COMPLETED"].includes(b.status)
  );
  const completedBookings = bookingsList.filter(
    (b: { status: string }) =>
      b.status === "COMPLETED" || b.status === "TRIP_COMPLETED" || b.status === "CANCELLED"
  );

  const totalEarnings = completedBookings
    .filter((b: { status: string }) => b.status === "COMPLETED" || b.status === "TRIP_COMPLETED")
    .reduce((sum: number, b: { fare: number }) => sum + b.fare, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayBookings = bookingsList.filter(
    (b: { createdAt: string }) => new Date(b.createdAt) >= today
  );
  const todayStats = {
    total: todayBookings.length,
    completed: todayBookings.filter(
      (b: { status: string }) => b.status === "COMPLETED" || b.status === "TRIP_COMPLETED"
    ).length,
    active: todayBookings.filter(
      (b: { status: string }) =>
        ["ACCEPTED", "STARTED", "TRIP_STARTED", "PICKUP_COMPLETED"].includes(b.status)
    ).length,
    cancelled: todayBookings.filter(
      (b: { status: string }) => b.status === "CANCELLED"
    ).length,
  };

  const nextTrip = bookingsList.find(
    (b: { status: string }) =>
      ["DRIVER_ASSIGNED", "READY_FOR_DISPATCH", "ACCEPTED"].includes(b.status)
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Driver Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome, {session?.user?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="online-toggle"
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
            />
            <Label
              htmlFor="online-toggle"
              className={`flex items-center gap-1 text-sm font-medium ${
                isOnline ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  Offline
                </>
              )}
            </Label>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requestedBookings.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Rides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeBookings.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEarnings)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              Today&apos;s Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {todayStats.total}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {todayStats.completed}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {todayStats.active}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                {todayStats.cancelled}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          disabled={!nextTrip}
          onClick={() => nextTrip && router.push(`/driver/trips/${nextTrip.id}`)}
        >
          <PlayCircle className="h-6 w-6 text-green-600" />
          <span className="text-xs font-normal">Start Trip</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => router.push("/driver/incidents")}
        >
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <span className="text-xs font-normal">Report Incident</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => router.push("/driver/expenses")}
        >
          <DollarSign className="h-6 w-6 text-blue-600" />
          <span className="text-xs font-normal">Log Expense</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          disabled={!nextTrip}
          onClick={() => nextTrip && router.push(`/driver/trips/${nextTrip.id}`)}
        >
          <Camera className="h-6 w-6 text-purple-600" />
          <span className="text-xs font-normal">Upload Images</span>
        </Button>
      </div>

      {/* Next Trip Guidance */}
      {nextTrip && (
        <Card className="mb-8 border-l-4 border-l-green-500 bg-green-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Navigation className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Next Trip</p>
                  <p className="text-sm text-green-700">
                    {getBookingTypeName(nextTrip.bookingType)} — {nextTrip.customer?.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {nextTrip.pickupAddress}
                    {nextTrip.dropAddress ? ` → ${nextTrip.dropAddress}` : ""}
                  </p>
                </div>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 shrink-0"
                onClick={() => router.push(`/driver/trips/${nextTrip.id}`)}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Go to Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ride Requests */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ride Requests
          </h2>
          {requestedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No pending ride requests</p>
                <p className="text-sm mt-1">
                  {isOnline
                    ? "Waiting for new bookings..."
                    : "Go online to receive ride requests"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requestedBookings.map(
                (booking: {
                  id: string;
                  bookingType: string;
                  pickupAddress: string;
                  dropAddress: string;
                  fare: number;
                  distance: number | null;
                  customer: { name: string; phone: string };
                  createdAt: string;
                }) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {getBookingTypeName(booking.bookingType)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(booking.createdAt)}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(booking.fare)}
                        </span>
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
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {booking.customer?.name} - {booking.customer?.phone}
                          </span>
                        </div>
                        {booking.distance && (
                          <p className="text-gray-500">
                            Distance: {booking.distance.toFixed(1)} km
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() =>
                            handleUpdateStatus(booking.id, "ACCEPTED")
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 text-red-600"
                          onClick={() =>
                            handleUpdateStatus(booking.id, "CANCELLED", "Driver rejected")
                          }
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </div>

        {/* Active Rides */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Rides
          </h2>
          {activeBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active rides</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeBookings.map(
                (booking: {
                  id: string;
                  bookingType: string;
                  status: string;
                  pickupAddress: string;
                  dropAddress: string;
                  fare: number;
                  customer: { name: string; phone: string };
                  createdAt: string;
                }) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {getBookingTypeName(booking.bookingType)}
                          </h3>
                          <Badge
                            variant={
                              booking.status === "ACCEPTED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold">
                          {formatCurrency(booking.fare)}
                        </span>
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
                            className="flex-1"
                            onClick={() =>
                              handleUpdateStatus(booking.id, "TRIP_STARTED")
                            }
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Ride
                          </Button>
                        )}
                        {(booking.status === "STARTED" || booking.status === "TRIP_STARTED") && (
                          <Button
                            className="flex-1"
                            onClick={() =>
                              handleUpdateStatus(booking.id, "PICKUP_COMPLETED")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Pickup
                          </Button>
                        )}
                        {booking.status === "PICKUP_COMPLETED" && (
                          <Button
                            className="flex-1"
                            onClick={() =>
                              handleUpdateStatus(booking.id, "DROP_COMPLETED")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Drop
                          </Button>
                        )}
                        {booking.status === "DROP_COMPLETED" && (
                          <Button
                            className="flex-1"
                            onClick={() =>
                              handleUpdateStatus(booking.id, "TRIP_COMPLETED")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            End Trip
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="text-red-600"
                          onClick={() =>
                            handleUpdateStatus(
                              booking.id,
                              "CANCELLED",
                              "Cancelled by driver"
                            )
                          }
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          {/* Recent Completed */}
          {completedBookings.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Rides
              </h2>
              <div className="space-y-3">
                {completedBookings.slice(0, 5).map(
                  (booking: {
                    id: string;
                    bookingType: string;
                    status: string;
                    fare: number;
                    customer: { name: string };
                    createdAt: string;
                  }) => (
                    <Card key={booking.id}>
                      <CardContent className="py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">
                              {getBookingTypeName(booking.bookingType)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.customer?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatCurrency(booking.fare)}
                            </p>
                            <Badge
                              variant={
                                booking.status === "COMPLETED" || booking.status === "TRIP_COMPLETED"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
