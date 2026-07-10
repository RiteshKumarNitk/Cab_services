"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Car,
  Users,
  Wrench,
  CalendarCheck,
  AlertTriangle,
  Calendar as CalendarIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface BookingItem {
  id: string;
  bookingNumber: string;
  status: string;
  pickupDate: string;
  returnDate: string | null;
  pickupAddress: string;
  dropAddress: string;
  pickupTime: string;
  customer: { id: string; name: string; phone?: string | null };
  vehicle: { id: string; name: string; plateNumber: string } | null;
  driver: { id: string; name: string } | null;
}

interface MaintenanceItem {
  id: string;
  type: string;
  description: string | null;
  status: string;
  scheduledDate: string;
  completedDate: string | null;
  cost: number | null;
  notes: string | null;
  vehicle: { id: string; name: string; plateNumber: string };
}

interface VehicleItem {
  id: string;
  name: string;
  plateNumber: string;
  bookings: BookingItem[];
  maintenance: MaintenanceItem[];
}

interface TripAssignment {
  id: string;
  status: string;
  scheduledPickupTime: string | null;
  booking: {
    id: string;
    bookingNumber: string;
    pickupAddress: string;
    dropAddress: string;
    pickupDate: string;
  } | null;
}

interface DriverItem {
  id: string;
  name: string;
  driverStatus: { online: boolean } | null;
  tripAssignments: TripAssignment[];
  driverLeaves: {
    id: string;
    startDate: string;
    endDate: string;
    reason: string | null;
  }[];
  driverShifts: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

interface CalendarData {
  bookings?: BookingItem[];
  vehicles?: VehicleItem[];
  drivers?: DriverItem[];
  maintenance?: MaintenanceItem[];
}

// ── Color helpers ──────────────────────────────────────

const BOOKING_BAR_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-500",
  BOOKING_CONFIRMED: "bg-green-500",
  QUOTE_ACCEPTED: "bg-green-500",
  WAITING_ASSIGNMENT: "bg-blue-500",
  VEHICLE_ASSIGNED: "bg-blue-500",
  DRIVER_ASSIGNED: "bg-indigo-500",
  READY_FOR_DISPATCH: "bg-blue-500",
  TRIP_STARTED: "bg-purple-500",
  PICKUP_COMPLETED: "bg-purple-500",
  DROP_COMPLETED: "bg-purple-500",
  TRIP_COMPLETED: "bg-purple-500",
  INVOICE_GENERATED: "bg-teal-500",
  CLOSED: "bg-gray-400",
  CANCELLED: "bg-red-500",
  IN_PROGRESS: "bg-purple-500",
  STARTED: "bg-purple-500",
  COMPLETED: "bg-purple-500",
  PENDING: "bg-gray-300",
  PRICE_SENT: "bg-yellow-500",
  VEHICLE_READY: "bg-blue-500",
};

function getBookingBarColor(status: string): string {
  return BOOKING_BAR_COLORS[status] ?? "bg-gray-400";
}

const MAINTENANCE_COLORS: Record<string, string> = {
  INSURANCE: "bg-blue-500",
  FITNESS: "bg-green-500",
  PERMIT: "bg-amber-500",
  SERVICE: "bg-orange-500",
  REPAIR: "bg-red-500",
  RC: "bg-teal-500",
  ACCIDENT: "bg-red-700",
  OTHER: "bg-gray-500",
};

function getMaintenanceColor(type: string): string {
  return MAINTENANCE_COLORS[type] ?? "bg-gray-500";
}

// ── Calendar helpers ───────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(iso: string): Date {
  const d = new Date(iso);
  return d;
}

function isItemOnDay(itemDate: string, day: number, month: number, year: number): boolean {
  const d = new Date(itemDate);
  return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusBadgeColor(status: string): string {
  if (["CANCELLED"].includes(status)) return "bg-red-100 text-red-800";
  if (["BOOKING_CONFIRMED", "WAITING_ASSIGNMENT", "CONFIRMED", "QUOTE_ACCEPTED"].includes(status))
    return "bg-green-100 text-green-800";
  if (["VEHICLE_ASSIGNED", "DRIVER_ASSIGNED", "READY_FOR_DISPATCH"].includes(status))
    return "bg-blue-100 text-blue-800";
  if (["TRIP_STARTED", "PICKUP_COMPLETED", "DROP_COMPLETED", "TRIP_COMPLETED", "IN_PROGRESS", "STARTED"].includes(status))
    return "bg-purple-100 text-purple-800";
  return "bg-gray-100 text-gray-800";
}

function getMaintenanceStatusColor(status: string): string {
  if (status === "SCHEDULED") return "bg-yellow-100 text-yellow-800";
  if (status === "IN_PROGRESS") return "bg-blue-100 text-blue-800";
  if (status === "COMPLETED") return "bg-green-100 text-green-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

// ── Conflict detection ─────────────────────────────────

function hasOverlappingBookings(bookings: BookingItem[]): boolean {
  const active = bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "CLOSED");
  if (active.length < 2) return false;
  const ranges = active.map((b) => ({
    id: b.id,
    start: new Date(b.pickupDate).getTime(),
    end: b.returnDate ? new Date(b.returnDate).getTime() : new Date(b.pickupDate).getTime(),
  }));
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (ranges[i].start <= ranges[j].end && ranges[j].start <= ranges[i].end) return true;
    }
  }
  return false;
}

function isOnLeaveOnDay(leave: { startDate: string; endDate: string }, day: number, month: number, year: number): boolean {
  const target = new Date(year, month, day).getTime();
  const start = new Date(leave.startDate).getTime();
  const end = new Date(leave.endDate).getTime();
  return target >= start && target <= end;
}

function hasShiftOnDay(shifts: { dayOfWeek: number }[], day: number, month: number, year: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return shifts.some((s) => s.dayOfWeek === dow);
}

// ── Component ──────────────────────────────────────────

export function CalendarView({
  initialView,
  initialYear,
  initialMonth,
}: {
  initialView: string;
  initialYear: number;
  initialMonth: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentDate, setCurrentDate] = useState(() => new Date(initialYear, initialMonth, 1));
  const [view, setView] = useState(initialView);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── URL sync ──

  const updateUrl = (v: string, y: number, m: number) => {
    const sp = new URLSearchParams();
    sp.set("view", v);
    sp.set("year", String(y));
    sp.set("month", String(m));
    router.push(`${pathname}?${sp.toString()}`);
  };

  // ── Data fetching ──

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
    setLoading(true);
    setUpdateMsg(null);
    fetch(`/api/admin/calendar?view=${view}&start=${start}&end=${end}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [view, year, month]);

  // ── Derived ──

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const daysGrid = useMemo(() => {
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    return grid;
  }, [firstDay, daysInMonth]);

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // ── Navigation ──

  const goToMonth = (y: number, m: number) => {
    setCurrentDate(new Date(y, m, 1));
    setSelectedDay(null);
    updateUrl(view, y, m);
  };

  const changeView = (v: string) => {
    setView(v);
    setSelectedDay(null);
    updateUrl(v, year, month);
  };

  // ── Drag and drop ──

  const handleDragStart = (e: React.DragEvent, bookingId: string) => {
    e.dataTransfer.setData("text/plain", bookingId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem(bookingId);
  };

  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData("text/plain");
    if (!bookingId) return;
    setDragOverDay(null);
    setDraggedItem(null);

    const newDate = new Date(year, month, day);
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, pickupDate: newDate.toISOString() }),
      });
      if (!res.ok) throw new Error("Update failed");
      setUpdateMsg("Booking rescheduled successfully");
      // Re-fetch
      const start = new Date(year, month, 1).toISOString().split("T")[0];
      const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
      const r = await fetch(`/api/admin/calendar?view=${view}&start=${start}&end=${end}`);
      const d = await r.json();
      setData(d);
      setTimeout(() => setUpdateMsg(null), 3000);
    } catch {
      setUpdateMsg("Failed to reschedule booking");
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  // ── Helpers ──

  const getDayBookings = (day: number) =>
    (data?.bookings ?? []).filter((b) => isItemOnDay(b.pickupDate, day, month, year));

  const getDayVehicleItems = (day: number) => {
    const items: { vehicle: VehicleItem; type: "booking" | "maintenance"; item: BookingItem | MaintenanceItem }[] = [];
    for (const v of data?.vehicles ?? []) {
      for (const b of v.bookings) {
        if (isItemOnDay(b.pickupDate, day, month, year)) items.push({ vehicle: v, type: "booking", item: b });
      }
      for (const m of v.maintenance) {
        if (isItemOnDay(m.scheduledDate, day, month, year)) items.push({ vehicle: v, type: "maintenance", item: m });
      }
    }
    return items;
  };

  const getDayDriverItems = (day: number) => {
    const items: {
      driver: DriverItem;
      type: "trip" | "leave" | "shift";
      label: string;
      color: string;
    }[] = [];
    for (const d of data?.drivers ?? []) {
      for (const t of d.tripAssignments) {
        if (t.scheduledPickupTime && isItemOnDay(t.scheduledPickupTime, day, month, year)) {
          items.push({
            driver: d,
            type: "trip",
            label: `${d.name}: Trip${t.booking ? ` to ${t.booking.dropAddress?.slice(0, 20)}` : ""}`,
            color: "bg-blue-500",
          });
        }
      }
      for (const l of d.driverLeaves) {
        if (isOnLeaveOnDay(l, day, month, year)) {
          items.push({
            driver: d,
            type: "leave",
            label: `${d.name}: Leave${l.reason ? ` (${l.reason})` : ""}`,
            color: "bg-red-400",
          });
        }
      }
      if (hasShiftOnDay(d.driverShifts, day, month, year)) {
        const shift = d.driverShifts.find((s) => s.dayOfWeek === new Date(year, month, day).getDay());
        items.push({
          driver: d,
          type: "shift",
          label: `${d.name}: ${shift ? `${shift.startTime}-${shift.endTime}` : "On duty"}`,
          color: "bg-green-400",
        });
      }
    }
    return items;
  };

  const getDayMaintenance = (day: number) =>
    (data?.maintenance ?? []).filter((m) => isItemOnDay(m.scheduledDate, day, month, year));

  // ── Render helpers ──

  const renderDayHeader = () => (
    <div className="grid grid-cols-7 border-l border-t">
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className="border-r border-b bg-gray-50 px-2 py-1.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
        >
          {d}
        </div>
      ))}
    </div>
  );

  const renderDayCell = (day: number | null, idx: number) => {
    if (day === null) {
      return <div key={`empty-${idx}`} className="border-r border-b bg-gray-50/30 min-h-[100px]" />;
    }

    const isSelected = selectedDay === day;
    const isDragOver = dragOverDay === day;
    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === month &&
      new Date().getFullYear() === year;

    let items: React.ReactNode = null;
    let itemCount = 0;

    if (view === "bookings") {
      const dayBookings = getDayBookings(day);
      itemCount = dayBookings.length;
      items = (
        <div className="space-y-1">
          {dayBookings.slice(0, 3).map((b) => (
            <Tooltip key={b.id}>
              <TooltipTrigger>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, b.id)}
                  className={`text-[11px] leading-tight px-1 py-0.5 rounded-sm cursor-grab active:cursor-grabbing text-white truncate ${getBookingBarColor(b.status)}`}
                >
                  {b.customer.name}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
                <p className="font-medium">{b.customer.name}</p>
                <p>Booking #{b.bookingNumber}</p>
                <p>
                  {b.pickupAddress?.slice(0, 30)} → {b.dropAddress?.slice(0, 30)}
                </p>
                <p>Status: {b.status.replace(/_/g, " ")}</p>
                <p>Time: {b.pickupTime}</p>
                {b.vehicle && <p>Vehicle: {b.vehicle.name} ({b.vehicle.plateNumber})</p>}
                {b.driver && <p>Driver: {b.driver.name}</p>}
              </TooltipContent>
            </Tooltip>
          ))}
          {dayBookings.length > 3 && (
            <span className="text-[10px] text-gray-400">+{dayBookings.length - 3} more</span>
          )}
        </div>
      );
    } else if (view === "vehicles") {
      const dayItems = getDayVehicleItems(day);
      itemCount = dayItems.length;
      items = (
        <div className="space-y-1">
          {dayItems.slice(0, 3).map((vi, i) => (
            <Tooltip key={`${vi.type}-${(vi.item as any).id}-${i}`}>
              <TooltipTrigger>
                <div
                  className={`text-[11px] leading-tight px-1 py-0.5 rounded-sm text-white truncate ${
                    vi.type === "booking" ? "bg-blue-500" : getMaintenanceColor((vi.item as MaintenanceItem).type)
                  }`}
                >
                  {vi.vehicle.name}: {vi.type === "booking" ? (vi.item as BookingItem).customer.name : (vi.item as MaintenanceItem).type}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {vi.type === "booking" ? (
                  <>
                    <p>Vehicle: {vi.vehicle.name}</p>
                    <p>Customer: {(vi.item as BookingItem).customer.name}</p>
                    <p>Status: {(vi.item as BookingItem).status}</p>
                  </>
                ) : (
                  <>
                    <p>Vehicle: {vi.vehicle.name}</p>
                    <p>Type: {(vi.item as MaintenanceItem).type}</p>
                    <p>Status: {(vi.item as MaintenanceItem).status}</p>
                    {(vi.item as MaintenanceItem).description && <p>{(vi.item as MaintenanceItem).description}</p>}
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
          {dayItems.length > 3 && (
            <span className="text-[10px] text-gray-400">+{dayItems.length - 3} more</span>
          )}
        </div>
      );
    } else if (view === "drivers") {
      const dayItems = getDayDriverItems(day);
      itemCount = dayItems.length;
      items = (
        <div className="space-y-1">
          {dayItems.slice(0, 3).map((di, i) => (
            <Tooltip key={`${di.type}-${di.driver.id}-${i}`}>
              <TooltipTrigger>
                <div
                  className={`text-[11px] leading-tight px-1 py-0.5 rounded-sm text-white truncate ${di.color}`}
                >
                  {di.label}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>Driver: {di.driver.name}</p>
                <p>Type: {di.type === "trip" ? "Trip" : di.type === "leave" ? "Leave" : "Shift"}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {dayItems.length > 3 && (
            <span className="text-[10px] text-gray-400">+{dayItems.length - 3} more</span>
          )}
        </div>
      );
    } else if (view === "maintenance") {
      const dayItems = getDayMaintenance(day);
      itemCount = dayItems.length;
      items = (
        <div className="space-y-1">
          {dayItems.slice(0, 3).map((m) => (
            <Tooltip key={m.id}>
              <TooltipTrigger>
                <div
                  className={`text-[11px] leading-tight px-1 py-0.5 rounded-sm text-white truncate ${getMaintenanceColor(m.type)}`}
                >
                  {m.vehicle.name}: {m.type}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs space-y-1">
                <p className="font-medium">{m.type}</p>
                <p>Vehicle: {m.vehicle.name} ({m.vehicle.plateNumber})</p>
                {m.description && <p>{m.description}</p>}
                <p>Status: {m.status}</p>
                {m.cost != null && <p>Cost: ₹{m.cost.toLocaleString("en-IN")}</p>}
                {m.notes && <p>Notes: {m.notes}</p>}
              </TooltipContent>
            </Tooltip>
          ))}
          {dayItems.length > 3 && (
            <span className="text-[10px] text-gray-400">+{dayItems.length - 3} more</span>
          )}
        </div>
      );
    }

    const hasConflict = view === "vehicles" && data?.vehicles?.some((v) => {
      const dayBookingsForVehicle = v.bookings.filter((b) =>
        isItemOnDay(b.pickupDate, day, month, year)
      );
      return dayBookingsForVehicle.length > 0 && hasOverlappingBookings(v.bookings);
    });

    return (
      <div
        key={`day-${day}`}
        className={`min-h-[100px] border-r border-b p-1.5 cursor-pointer transition-colors ${
          isSelected ? "bg-blue-50 ring-2 ring-blue-400 ring-inset" : ""
        } ${isDragOver ? "bg-blue-100" : ""} ${isToday ? "bg-yellow-50" : ""} ${
          hasConflict ? "ring-2 ring-red-400 ring-inset" : ""
        } hover:bg-gray-50`}
        onClick={() => setSelectedDay(day)}
        onDragOver={(e) => handleDragOver(e, day)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day)}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs font-medium ${
              isToday ? "bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center" : "text-gray-400"
            }`}
          >
            {day}
          </span>
          {itemCount > 0 && (
            <span className="text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">
              {itemCount}
            </span>
          )}
        </div>
        {hasConflict && (
          <div className="flex items-center gap-0.5 mb-1 text-red-500" title="Schedule conflict detected">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px]">Conflict</span>
          </div>
        )}
        {items}
      </div>
    );
  };

  const renderDayDetail = () => {
    if (selectedDay === null) return null;

    if (view === "bookings") {
      const dayBookings = getDayBookings(selectedDay);
      if (dayBookings.length === 0)
        return (
          <Card>
            <CardContent className="p-4 text-center text-gray-400 text-sm">No bookings on this day</CardContent>
          </Card>
        );
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Bookings for {monthName} {selectedDay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  <div className={`w-2 h-8 rounded-full ${getBookingBarColor(b.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{b.customer.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {b.pickupAddress} → {b.dropAddress}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusBadgeColor(b.status)}>{b.status.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-gray-400">#{b.bookingNumber}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {b.pickupTime}
                    {b.vehicle && <p>{b.vehicle.plateNumber}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (view === "vehicles") {
      const dayItems = getDayVehicleItems(selectedDay);
      if (dayItems.length === 0)
        return (
          <Card>
            <CardContent className="p-4 text-center text-gray-400 text-sm">No vehicle activity on this day</CardContent>
          </Card>
        );
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Vehicle Activity for {monthName} {selectedDay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayItems.map((vi, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  <div
                    className={`w-2 h-8 rounded-full ${
                      vi.type === "booking" ? "bg-blue-500" : getMaintenanceColor((vi.item as MaintenanceItem).type)
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{vi.vehicle.name}</p>
                    <p className="text-xs text-gray-500">{vi.vehicle.plateNumber}</p>
                    {vi.type === "booking" ? (
                      <div className="mt-1">
                        <p className="text-xs">
                          Booking: {(vi.item as BookingItem).customer.name} → {(vi.item as BookingItem).dropAddress?.slice(0, 40)}
                        </p>
                        <Badge className={getStatusBadgeColor((vi.item as BookingItem).status)}>
                          {(vi.item as BookingItem).status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="text-xs">
                          {(vi.item as MaintenanceItem).type}
                          {(vi.item as MaintenanceItem).description && ` - ${(vi.item as MaintenanceItem).description}`}
                        </p>
                        <Badge className={getMaintenanceStatusColor((vi.item as MaintenanceItem).status)}>
                          {(vi.item as MaintenanceItem).status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (view === "drivers") {
      const dayItems = getDayDriverItems(selectedDay);
      if (dayItems.length === 0)
        return (
          <Card>
            <CardContent className="p-4 text-center text-gray-400 text-sm">No driver activity on this day</CardContent>
          </Card>
        );
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Driver Activity for {monthName} {selectedDay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayItems.map((di, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  <div className={`w-2 h-8 rounded-full ${di.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{di.driver.name}</p>
                    <p className="text-xs text-gray-500">
                      {di.type === "trip"
                        ? `Trip: ${di.driver.tripAssignments.find((t) => t.scheduledPickupTime && isItemOnDay(t.scheduledPickupTime, selectedDay, month, year))?.booking?.pickupAddress ?? ""} → ...`
                        : di.type === "leave"
                          ? `Leave`
                          : `Shift: ${di.driver.driverShifts.find((s) => s.dayOfWeek === new Date(year, month, selectedDay).getDay())?.startTime}-${di.driver.driverShifts.find((s) => s.dayOfWeek === new Date(year, month, selectedDay).getDay())?.endTime}`}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{di.type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (view === "maintenance") {
      const dayItems = getDayMaintenance(selectedDay);
      if (dayItems.length === 0)
        return (
          <Card>
            <CardContent className="p-4 text-center text-gray-400 text-sm">No maintenance on this day</CardContent>
          </Card>
        );
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Maintenance for {monthName} {selectedDay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayItems.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  <div className={`w-2 h-8 rounded-full ${getMaintenanceColor(m.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {m.type} — {m.vehicle.name}
                    </p>
                    <p className="text-xs text-gray-500">{m.vehicle.plateNumber}</p>
                    {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getMaintenanceStatusColor(m.status)}>{m.status}</Badge>
                      {m.cost != null && (
                        <span className="text-xs text-gray-500">₹{m.cost.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // ── Main render ──

  const views = [
    { key: "bookings", label: "Booking Timeline", icon: CalendarCheck },
    { key: "vehicles", label: "Vehicle Schedule", icon: Car },
    { key: "drivers", label: "Driver Schedule", icon: Users },
    { key: "maintenance", label: "Maintenance Calendar", icon: Wrench },
  ];

  return (
    <TooltipProvider delay={200}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operations Calendar</h1>
            <p className="text-sm text-gray-500 mt-1">Drag bookings to reschedule, click a day for details</p>
          </div>
          {updateMsg && (
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                updateMsg.includes("Failed") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {updateMsg}
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {views.map((v) => (
            <Button
              key={v.key}
              variant={view === v.key ? "default" : "outline"}
              size="sm"
              onClick={() => changeView(v.key)}
            >
              <v.icon className="h-4 w-4" />
              {v.label}
            </Button>
          ))}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => goToMonth(year, month - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">{monthName}</span>
            <Button variant="outline" size="icon-sm" onClick={() => goToMonth(year, month + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const now = new Date();
                goToMonth(now.getFullYear(), now.getMonth());
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              Today
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {view === "bookings" && (
              <>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Confirmed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Assigned</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Running</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Cancelled</span>
              </>
            )}
            {view === "maintenance" && (
              <>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Insurance</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Fitness</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Permit</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Service</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Repair</span>
              </>
            )}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading calendar...</div>
          ) : (
            <>
              {renderDayHeader()}
              <div className="grid grid-cols-7">{daysGrid.map((day, idx) => renderDayCell(day, idx))}</div>
            </>
          )}
        </div>

        {/* Empty state */}
        {!loading && data && (
          <>
            {view === "bookings" && (data.bookings?.length ?? 0) === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-400">
                  <CalendarCheck className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p>No bookings this month</p>
                </CardContent>
              </Card>
            )}
            {view === "maintenance" && (data.maintenance?.length ?? 0) === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-400">
                  <Wrench className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p>No maintenance scheduled this month</p>
                </CardContent>
              </Card>
            )}
            {view === "vehicles" && (data.vehicles?.length ?? 0) === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-400">
                  <Car className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p>No vehicles found</p>
                </CardContent>
              </Card>
            )}
            {view === "drivers" && (data.drivers?.length ?? 0) === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p>No drivers found</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Day detail panel */}
        {selectedDay !== null && !loading && renderDayDetail()}
      </div>
    </TooltipProvider>
  );
}
