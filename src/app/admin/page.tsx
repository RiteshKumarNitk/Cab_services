import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOperationsDashboard } from "@/lib/operations-queue";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Car,
  CalendarCheck,
  ClipboardList,
  CheckCircle,
  Clock,
  PlayCircle,
  AlertTriangle,
  UserPlus,
  Users,
  Truck,
  Wrench,
  XCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const statusStyle = (status: string) => {
  if (status === "BOOKING_CONFIRMED" || status === "WAITING_ASSIGNMENT") return "bg-amber-100 text-amber-800";
  if (status === "TRIP_STARTED" || status === "PICKUP_COMPLETED") return "bg-purple-100 text-purple-800";
  if (status === "TRIP_COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const ops = await getOperationsDashboard();

  const recentBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { customer: { select: { name: true, phone: true } } },
  });

  const statCards = [
    { label: "Today's Pickups", value: ops.todaysPickups, icon: MapPin, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Awaiting Assignment", value: ops.awaitingAssignment, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Trips Running", value: ops.tripsRunning, icon: PlayCircle, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Delayed Trips", value: ops.delayedTrips, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Vehicles Free", value: `${ops.vehiclesFree}/${ops.vehiclesFree + ops.vehiclesBusy}`, icon: Car, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Drivers Online", value: `${ops.driversFree}/${ops.driversFree + ops.driversBusy}`, icon: Users, color: "text-teal-600", bg: "bg-teal-100" },
    { label: "Cancelled Today", value: ops.cancelledToday, icon: XCircle, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Today's Drop-offs", value: ops.todaysDropoffs, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-500">Real-time operations metrics</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/dispatch">
            <Button variant="outline" className="border-gray-200">
              <ClipboardList className="h-4 w-4 mr-2" /> Dispatch Queue
            </Button>
          </Link>
          <Link href="/admin/calendar">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <CalendarCheck className="h-4 w-4 mr-2" /> Operations Calendar
            </Button>
          </Link>
        </div>
      </div>

      {/* Operations KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {card.label}
                </CardTitle>
                <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/dispatch">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                  Dispatch Queue ({ops.awaitingAssignment})
                </Button>
              </Link>
              <Link href="/admin/bookings">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <CalendarCheck className="h-4 w-4 text-red-600" />
                  Manage Bookings
                </Button>
              </Link>
              <Link href="/admin/trips">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <Truck className="h-4 w-4 text-purple-600" />
                  Active Trips ({ops.tripsRunning})
                </Button>
              </Link>
              <Link href="/admin/vehicles">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <Car className="h-4 w-4 text-indigo-600" />
                  Fleet Status
                </Button>
              </Link>
              <Link href="/admin/maintenance">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <Wrench className="h-4 w-4 text-gray-600" />
                  Maintenance
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-red-600" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Route</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{booking.customer?.name || "Guest"}</div>
                          <div className="text-xs text-gray-500">{booking.customer?.phone || ""}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="font-medium truncate">{booking.pickupAddress}</div>
                          <div className="text-xs text-gray-500 truncate">to {booking.dropAddress}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle(booking.status)}`}>
                            {booking.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/admin/bookings/${booking.id}`}>
                            <Button size="sm" variant="outline" className="border-gray-200">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {recentBookings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400">
                          <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                          <p>No bookings yet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
