"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { Route, Car, User, MapPin } from "lucide-react";

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

type TripItem = {
  id: string;
  tripNumber: string;
  status: string;
  scheduledPickupTime: string | null;
  actualPickupTime: string | null;
  actualDropTime: string | null;
  booking: {
    id: string; bookingNumber: string; status: string;
    pickupAddress: string; dropAddress: string;
    pickupDate: string; pickupTime: string;
    customer: { id: string; name: string; phone: string | null };
  } | null;
  vehicle: { id: string; name: string; plateNumber: string; model: string } | null;
  driver: { id: string; name: string; phone: string | null } | null;
};

export default function AdminTripsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (authStatus === "unauthenticated") return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ page: String(page), limit: "20" });
        if (statusFilter) queryParams.set("status", statusFilter);
        const res = await fetch(`/api/admin/trips?${queryParams}`, { signal: controller.signal });
        const data = await res.json();
        if (!controller.signal.aborted) {
          setTrips(data.trips ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        // ignore abort errors
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [authStatus, statusFilter, page]);

  if (authStatus === "loading") return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-500 mt-1">Total: {total} trips</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ""); setPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Status</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="VEHICLE_ASSIGNED">Vehicle Assigned</SelectItem>
              <SelectItem value="DRIVER_ASSIGNED">Driver Assigned</SelectItem>
              <SelectItem value="REACHED_PICKUP">Reached Pickup</SelectItem>
              <SelectItem value="PICKED_UP">Picked Up</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/admin/bookings")}>
            Schedule from Booking
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5" />
            Trip Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No trips found</div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/admin/trips/${trip.id}`}
                  className="block p-4 rounded-lg border hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {trip.booking?.customer?.name ?? "Unknown"}
                        </span>
                        <Badge className={STATUS_COLORS[trip.status] ?? ""}>
                          {trip.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-gray-400">{trip.tripNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {trip.booking?.pickupAddress?.slice(0, 30)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {trip.vehicle && (
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {trip.vehicle.name} ({trip.vehicle.plateNumber})
                          </span>
                        )}
                        {trip.driver && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {trip.driver.name}
                          </span>
                        )}
                        {trip.scheduledPickupTime && (
                          <span>{formatDateTime(trip.scheduledPickupTime)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {trip.booking && <p>#{trip.booking.bookingNumber}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {total > 20 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <span className="text-sm text-gray-500">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / 20)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
