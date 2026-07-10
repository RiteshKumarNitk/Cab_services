"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Car, User, MapPin, ArrowRight, AlertTriangle, CheckCircle2, Gauge, RefreshCw } from "lucide-react";

interface DispatchItem {
  id: string;
  bookingId: string;
  status: string;
  vehicleCheckStatus: string | null;
  driverCheckStatus: string | null;
  vehicleId: string | null;
  driverId: string | null;
  createdAt: string;
  booking: {
    pickupAddress: string;
    dropAddress: string;
    pickupDate: string;
    pickupTime: string;
    customer: { name: string; phone: string } | null;
  };
  vehicle: { name: string; plateNumber: string } | null;
  driver: { name: string } | null;
}

interface Lane {
  id: string;
  label: string;
  color: string;
  filter: (d: DispatchItem) => boolean;
}

const lanes: Lane[] = [
  { id: "awaiting", label: "Awaiting Assignment", color: "border-t-amber-500", filter: (d) => d.status === "PENDING" },
  { id: "assigning", label: "Assigning", color: "border-t-blue-500", filter: (d) => d.status === "VEHICLE_ASSIGNING" || d.status === "DRIVER_ASSIGNING" },
  { id: "ready", label: "Ready", color: "border-t-emerald-500", filter: (d) => Boolean(d.vehicleId && d.driverId && d.status !== "DISPATCHED") },
  { id: "delayed", label: "Delayed", color: "border-t-red-500", filter: (d) => {
    if (d.status === "DISPATCHED") return false;
    const created = new Date(d.createdAt).getTime();
    const hoursAgo = (Date.now() - created) / 3600000;
    return hoursAgo > 2;
  }},
  { id: "running", label: "Running", color: "border-t-purple-500", filter: (d) => d.status === "DISPATCHED" },
];

export default function DispatchBoard() {
  const [items, setItems] = useState<DispatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Array<{id:string;name:string;plateNumber:string;type:string;status:string}>>([]);
  const [drivers, setDrivers] = useState<Array<{id:string;name:string;phone:string|null}>>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dispatchRes, vehicleRes, driverRes] = await Promise.all([
        fetch("/api/admin/dispatch?all=true"),
        fetch("/api/admin/vehicles?all=true"),
        fetch("/api/admin/users?role=DRIVER"),
      ]);
      setItems(await dispatchRes.json());
      setVehicles(await vehicleRes.json());
      setDrivers(await driverRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const assignVehicle = async (dispatchId: string, vehicleId: string) => {
    setAssigning(dispatchId);
    await fetch(`/api/admin/dispatch/${dispatchId}/assign-vehicle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId }),
    });
    await fetchData();
    setAssigning(null);
  };

  const assignDriver = async (dispatchId: string, driverId: string) => {
    setAssigning(dispatchId);
    await fetch(`/api/admin/dispatch/${dispatchId}/assign-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId }),
    });
    await fetchData();
    setAssigning(null);
  };

  const finalize = async (dispatchId: string) => {
    setAssigning(dispatchId);
    await fetch(`/api/admin/dispatch/${dispatchId}/finalize`, { method: "POST" });
    await fetchData();
    setAssigning(null);
  };

  const getLaneItems = (lane: Lane) => {
    const filtered = items.filter(lane.filter);
    // Delayed lane only shows items that are actually delayed
    if (lane.id === "delayed") {
      return filtered.filter(d => {
        if (d.vehicleId && d.driverId && d.status !== "DISPATCHED") return true;
        const created = new Date(d.createdAt).getTime();
        return (Date.now() - created) / 3600000 > 2;
      }).slice(0, 10);
    }
    return filtered.slice(0, 10);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading dispatch board...</div>;

  return (
    <div className="max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch Board</h1>
          <p className="text-gray-500">{items.filter(d => d.status !== "DISPATCHED").length} pending · {items.filter(d => d.status === "DISPATCHED").length} dispatched</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-gray-200">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4" style={{ minHeight: "70vh" }}>
        {lanes.map((lane) => {
          const laneItems = getLaneItems(lane);
          return (
            <div key={lane.id} className="bg-gray-50 rounded-xl border border-gray-200">
              <div className={`p-3 border-t-4 ${lane.color} rounded-t-xl bg-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-gray-700">{lane.label}</h3>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{laneItems.length}</span>
                </div>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
                {laneItems.map((item) => (
                  <DispatchCard
                    key={item.id}
                    item={item}
                    vehicles={vehicles}
                    drivers={drivers}
                    assigning={assigning}
                    onAssignVehicle={assignVehicle}
                    onAssignDriver={assignDriver}
                    onFinalize={finalize}
                  />
                ))}
                {laneItems.length === 0 && (
                  <div className="p-4 text-center text-xs text-gray-400">
                    <Gauge className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DispatchCard({
  item, vehicles, drivers, assigning, onAssignVehicle, onAssignDriver, onFinalize
}: {
  item: DispatchItem;
  vehicles: Array<{id:string;name:string;plateNumber:string;type:string;status:string}>;
  drivers: Array<{id:string;name:string;phone:string|null}>;
  assigning: string | null;
  onAssignVehicle: (id: string, vehicleId: string) => void;
  onAssignDriver: (id: string, driverId: string) => void;
  onFinalize: (id: string) => void;
}) {
  const created = new Date(item.createdAt);
  const hoursAgo = (Date.now() - created.getTime()) / 3600000;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-grab">
      <CardContent className="p-3 space-y-2">
        {/* Customer info */}
        <div className="text-xs">
          <span className="font-medium text-gray-900">{item.booking.customer?.name || "Guest"}</span>
          {hoursAgo > 1 && <span className="ml-2 text-amber-600 font-medium">{Math.round(hoursAgo)}h ago</span>}
        </div>
        <div className="text-xs text-gray-500 truncate flex items-center gap-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{item.booking.pickupAddress}</span>
        </div>

        {/* Vehicle slot */}
        <div className="flex items-center gap-2">
          <Car className="h-3 w-3 text-gray-400" />
          {item.vehicle ? (
            <span className="text-xs text-gray-700">{item.vehicle.name} ({item.vehicle.plateNumber})</span>
          ) : (
            <select
              onChange={(e) => e.target.value && onAssignVehicle(item.id, e.target.value)}
              disabled={assigning === item.id}
              className="text-xs border border-gray-200 rounded px-1 py-0.5 flex-1"
            >
              <option value="">Assign vehicle...</option>
              {vehicles.filter(v => v.status === "AVAILABLE").map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.plateNumber})</option>
              ))}
            </select>
          )}
        </div>

        {/* Driver slot */}
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-gray-400" />
          {item.driver ? (
            <span className="text-xs text-gray-700">{item.driver.name}</span>
          ) : (
            <select
              onChange={(e) => e.target.value && onAssignDriver(item.id, e.target.value)}
              disabled={assigning === item.id}
              className="text-xs border border-gray-200 rounded px-1 py-0.5 flex-1"
            >
              <option value="">Assign driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Finalize button */}
        {item.vehicle && item.driver && item.status !== "DISPATCHED" && (
          <Button
            size="sm"
            onClick={() => onFinalize(item.id)}
            disabled={assigning === item.id}
            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white mt-1"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Dispatch
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
