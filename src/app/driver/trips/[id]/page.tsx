"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBooking, useUpdateBookingStatus } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Navigation as NavIcon,
  Phone,
  User,
  Car,
  PlayCircle,
  CheckCircle,
  KeyRound,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function TripDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: booking, isLoading } = useBooking(id);
  const updateStatus = useUpdateBookingStatus();

  const [otpInput, setOtpInput] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "DRIVER") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (booking?.trip?.driverNotes) {
      setDriverNotes(booking.trip.driverNotes);
    }
  }, [booking]);

  const handleUpdateStatus = async (newStatus: string) => {
    // Starting a trip requires the customer's OTP; the server verifies it.
    if (newStatus === "TRIP_STARTED" && otpInput.trim().length === 0) {
      toast.error("Enter the OTP from the customer to start the trip");
      return;
    }
    try {
      await updateStatus.mutateAsync({
        id,
        status: newStatus,
        otp: newStatus === "TRIP_STARTED" ? otpInput.trim() : undefined,
      });
      setOtpInput("");
    } catch {
      // error toast is shown by the mutation hook
    }
  };

  const handleSaveNotes = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverNotes }),
      });
      if (res.ok) {
        setNotesSaved(true);
        toast.success("Notes saved");
        setTimeout(() => setNotesSaved(false), 3000);
      } else {
        toast.error("Failed to save notes");
      }
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const getNextAction = () => {
    if (!booking) return null;
    const s = booking.status;
    if (["ACCEPTED", "READY_FOR_DISPATCH"].includes(s)) {
      return { label: "Start Trip", nextStatus: "TRIP_STARTED", icon: PlayCircle };
    }
    if (["STARTED", "TRIP_STARTED"].includes(s)) {
      return { label: "Complete Pickup", nextStatus: "PICKUP_COMPLETED", icon: CheckCircle };
    }
    if (s === "PICKUP_COMPLETED") {
      return { label: "Complete Drop", nextStatus: "DROP_COMPLETED", icon: CheckCircle };
    }
    if (s === "DROP_COMPLETED") {
      return { label: "End Trip", nextStatus: "TRIP_COMPLETED", icon: CheckCircle };
    }
    return null;
  };

  const nextAction = getNextAction();

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Trip not found</p>
        </div>
      </div>
    );
  }

  const trip = booking.trip;
  const terminalStatuses = ["CANCELLED", "TRIP_COMPLETED", "INVOICE_GENERATED", "CLOSED"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getBookingTypeName(booking.bookingType)}
          </h1>
          <p className="text-gray-500 mt-1">
            {booking.bookingNumber && `#${booking.bookingNumber}`} — {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <Badge className="text-sm px-3 py-1">{booking.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{booking.pickupAddress}</p>
                  {trip?.scheduledPickupTime && (
                    <p className="text-xs text-gray-400">
                      Scheduled: {formatDateTime(trip.scheduledPickupTime)}
                    </p>
                  )}
                </div>
              </div>
              {booking.dropAddress && (
                <div className="flex items-start gap-3">
                  <NavIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Drop</p>
                    <p className="font-medium">{booking.dropAddress}</p>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{booking.customer?.name}</p>
                  {booking.customer?.phone && (
                    <a
                      href={`tel:${booking.customer.phone}`}
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {booking.customer.phone}
                    </a>
                  )}
                </div>
              </div>
              {booking.vehicle && (
                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="font-medium">
                      {booking.vehicle.name} — {booking.vehicle.plateNumber}
                    </p>
                  </div>
                </div>
              )}
              {booking.fare > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Fare</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(booking.fare)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trip Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextAction && (
                <Button
                  className="w-full h-14 text-lg"
                  onClick={() => handleUpdateStatus(nextAction.nextStatus)}
                >
                  <nextAction.icon className="h-6 w-6 mr-2" />
                  {nextAction.label}
                </Button>
              )}
              {!nextAction && !terminalStatuses.includes(booking.status) && (
                <p className="text-sm text-gray-500 text-center py-2">
                  No actions available for current status
                </p>
              )}
              {terminalStatuses.includes(booking.status) && (
                <p className="text-sm text-gray-500 text-center py-2">
                  This trip has been {booking.status.toLowerCase().replace(/_/g, " ")}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* OTP */}
          {trip && nextAction?.nextStatus === "TRIP_STARTED" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Customer OTP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="otp-input">Ask the customer for their trip OTP</Label>
                <Input
                  id="otp-input"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter OTP"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500">
                  The customer sees this OTP in their booking. It is checked when you tap Start Trip.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Driver Notes */}
          {!terminalStatuses.includes(booking.status) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Driver Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={driverNotes}
                  onChange={(e) => {
                    setDriverNotes(e.target.value);
                    setNotesSaved(false);
                  }}
                  placeholder="Add notes about this trip..."
                  rows={4}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveNotes}
                  disabled={notesSaved}
                >
                  {notesSaved ? "Saved" : "Save Notes"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
