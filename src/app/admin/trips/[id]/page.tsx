"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft, Route, Car, User, MapPin, Phone, Calendar,
  Clock, Gauge, CheckCircle2, XCircle,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-gray-100 text-gray-800",
  VEHICLE_ASSIGNED: "bg-blue-100 text-blue-800",
  DRIVER_ASSIGNED: "bg-indigo-100 text-indigo-800",
  REACHED_PICKUP: "bg-yellow-100 text-yellow-800",
  PICKED_UP: "bg-purple-100 text-purple-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  REACHED_DESTINATION: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_FLOW = [
  "SCHEDULED", "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED",
  "REACHED_PICKUP", "PICKED_UP", "IN_PROGRESS",
  "REACHED_DESTINATION", "COMPLETED",
];

type VehicleItem = { id: string; name: string; plateNumber: string; model: string; type: string; status: string };
type DriverItem = { id: string; name: string; phone: string | null; email: string; driverStatus: { online: boolean } | null };

type TripDetail = {
  id: string; tripNumber: string; status: string;
  pickupAddress: string | null; dropAddress: string | null;
  pickupLat: number | null; pickupLng: number | null;
  dropLat: number | null; dropLng: number | null;
  waypoints: string | null;
  otp: string | null;
  startOdometer: number | null; endOdometer: number | null; actualDistance: number | null;
  scheduledPickupTime: string | null;
  actualPickupTime: string | null; actualDropTime: string | null;
  driverNotes: string | null; adminNotes: string | null;
  booking: {
    id: string; bookingNumber: string; status: string;
    pickupAddress: string; dropAddress: string;
    pickupDate: string; pickupTime: string;
    specialInstructions: string | null;
    customer: { id: string; name: string; phone: string | null; email: string | null };
    lead: { id: string; leadNumber: string; notes: string | null } | null;
  } | null;
  vehicle: VehicleItem | null;
  driver: DriverItem | null;
};

export default function TripDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  const [startOdometer, setStartOdometer] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [saving, setSaving] = useState(false);
  const [tripInitialized, setTripInitialized] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/admin/login");
    if (authStatus === "authenticated") { fetchTrip(); fetchVehicles(); fetchDrivers(); }
  }, [authStatus]);

  async function fetchTrip() {
    try {
      const res = await fetch(`/api/admin/trips/${params.id}`);
      if (!res.ok) { router.push("/admin/trips"); return; }
      const data = await res.json();
      setTrip(data);
      if (!tripInitialized) {
        setSelectedVehicleId(data.vehicle?.id ?? "");
        setSelectedDriverId(data.driver?.id ?? "");
        setAdminNotes(data.adminNotes ?? "");
        setDriverNotes(data.driverNotes ?? "");
        setStartOdometer(data.startOdometer?.toString() ?? "");
        setEndOdometer(data.endOdometer?.toString() ?? "");
        setTripInitialized(true);
      }
    } finally { setLoading(false); }
  }

  async function fetchVehicles() {
    const res = await fetch("/api/admin/vehicles");
    if (res.ok) setVehicles(await res.json());
  }

  async function fetchDrivers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const allUsers = await res.json();
      setDrivers(allUsers.filter((u: { role: string }) => u.role === "DRIVER"));
    }
  }

  async function updateTrip(data: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/admin/trips/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    fetchTrip();
  }

  function handleAssignVehicle() {
    updateTrip({ vehicleId: selectedVehicleId || null, status: "VEHICLE_ASSIGNED" });
  }

  function handleAssignDriver() {
    updateTrip({ driverId: selectedDriverId || null, status: "DRIVER_ASSIGNED" });
  }

  function handleStatusAdvance() {
    const currentIdx = STATUS_FLOW.indexOf(trip?.status ?? "");
    if (currentIdx < STATUS_FLOW.length - 1) {
      updateTrip({ status: STATUS_FLOW[currentIdx + 1] });
    }
  }

  function handleSaveTracking() {
    updateTrip({
      startOdometer: startOdometer ? parseFloat(startOdometer) : null,
      endOdometer: endOdometer ? parseFloat(endOdometer) : null,
      actualDistance: startOdometer && endOdometer ? Math.abs(parseFloat(endOdometer) - parseFloat(startOdometer)) : null,
      driverNotes,
      adminNotes,
    });
  }

  if (authStatus === "loading" || loading) return <div className="p-8">Loading...</div>;
  if (!trip) return <div className="p-8">Trip not found</div>;

  const currentIdx = STATUS_FLOW.indexOf(trip.status);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 && trip.status !== "COMPLETED" && trip.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/trips")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Trip {trip.tripNumber}</h1>
            <Badge className={STATUS_COLORS[trip.status] ?? ""}>
              {trip.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {trip.booking?.bookingNumber && `Booking: ${trip.booking.bookingNumber}`}
            {trip.scheduledPickupTime && ` · Scheduled: ${formatDateTime(trip.scheduledPickupTime)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer & Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{trip.booking?.customer.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {trip.booking?.customer.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{trip.booking.customer.phone}</span>
                      )}
                      {trip.booking?.customer.email && <span>{trip.booking.customer.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <span className="text-gray-500">Pickup</span>
                      <p className="font-medium">{trip.pickupAddress ?? trip.booking?.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <span className="text-gray-500">Drop</span>
                      <p className="font-medium">{trip.dropAddress ?? trip.booking?.dropAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">
                      {trip.scheduledPickupTime ? formatDateTime(trip.scheduledPickupTime) : formatDateTime(trip.booking?.pickupDate ?? "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">{trip.booking?.pickupTime}</span>
                  </div>
                </div>
                {trip.booking?.specialInstructions && (
                  <div className="text-sm p-2 bg-yellow-50 rounded">
                    <span className="text-gray-500">Instructions:</span>
                    <p className="font-medium">{trip.booking.specialInstructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vehicle & Driver Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Assign Vehicle</Label>
                  <Select value={selectedVehicleId} onValueChange={(v) => setSelectedVehicleId(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.filter(v => v.status === "AVAILABLE" || v.id === trip.vehicle?.id).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} ({v.plateNumber}) - {v.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {trip.vehicle ? (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                      <Car className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{trip.vehicle.name}</span>
                      <span className="text-gray-500">({trip.vehicle.plateNumber})</span>
                    </div>
                  ) : (
                    <Button size="sm" onClick={handleAssignVehicle} disabled={!selectedVehicleId || saving}>
                      Assign Vehicle
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Assign Driver</Label>
                  <Select value={selectedDriverId} onValueChange={(v) => setSelectedDriverId(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} {d.driverStatus?.online ? "(Online)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {trip.driver ? (
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded text-sm">
                      <User className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium">{trip.driver.name}</span>
                      {trip.driver.phone && <span className="text-gray-500">({trip.driver.phone})</span>}
                    </div>
                  ) : (
                    <Button size="sm" onClick={handleAssignDriver} disabled={!selectedDriverId || saving}>
                      Assign Driver
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tracking & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Start Odometer (km)</Label>
                  <Input
                    type="number"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(e.target.value)}
                    disabled={trip.status === "COMPLETED" || trip.status === "CANCELLED"}
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Odometer (km)</Label>
                  <Input
                    type="number"
                    value={endOdometer}
                    onChange={(e) => setEndOdometer(e.target.value)}
                    disabled={trip.status === "COMPLETED" || trip.status === "CANCELLED"}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Distance (auto)</Label>
                  <div className="flex items-center gap-2 h-9 px-3 bg-gray-50 rounded border text-sm text-gray-500">
                    <Gauge className="h-4 w-4" />
                    {startOdometer && endOdometer
                      ? `${Math.abs(parseFloat(endOdometer) - parseFloat(startOdometer))} km`
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Driver Notes</Label>
                <Textarea
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  rows={2}
                  disabled={trip.status === "COMPLETED" || trip.status === "CANCELLED"}
                />
              </div>
              <div className="space-y-1">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSaveTracking} disabled={saving}>
                Save Tracking
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {STATUS_FLOW.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      i < currentIdx ? "bg-green-500" : i === currentIdx ? "bg-blue-500" : "bg-gray-300"
                    }`} />
                    <span className={i <= currentIdx ? "font-medium" : "text-gray-400"}>
                      {s.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canAdvance && (
                <Button className="w-full" onClick={handleStatusAdvance} disabled={saving}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as {STATUS_FLOW[currentIdx + 1].replace(/_/g, " ")}
                </Button>
              )}
              {(trip.status === "SCHEDULED" || trip.status === "VEHICLE_ASSIGNED" || trip.status === "DRIVER_ASSIGNED") && (
                <Button variant="destructive" className="w-full" onClick={() => updateTrip({ status: "CANCELLED" })}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Trip
                </Button>
              )}
              {trip.status === "COMPLETED" && trip.booking && (
                <div className="p-3 bg-green-50 rounded text-sm text-green-700">
                  Trip completed successfully
                </div>
              )}
              {trip.status === "CANCELLED" && (
                <div className="p-3 bg-red-50 rounded text-sm text-red-700">
                  Trip cancelled
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled</span>
                <span>{trip.scheduledPickupTime ? formatDateTime(trip.scheduledPickupTime) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual Pickup</span>
                <span>{trip.actualPickupTime ? formatDateTime(trip.actualPickupTime) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual Drop</span>
                <span>{trip.actualDropTime ? formatDateTime(trip.actualDropTime) : "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
