import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
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
  CreditCard,
  UserPlus,
  IndianRupee,
  ArrowRight,
  Users,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    allBookings,
    todayBookings,
    vehicles,
    users
  ] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: true }
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: today } }
    }),
    prisma.vehicle.findMany(),
    prisma.user.findMany()
  ]);

  const customers = users.filter(u => u.role === 'CUSTOMER');
  const drivers = users.filter(u => u.role === 'DRIVER');

  const todayRevenue = todayBookings
    .filter(b => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.fare, 0);

  const stats = {
    todaysRequests: todayBookings.length,
    pendingQuotations: allBookings.filter(b => b.status === "PENDING" || b.status === "PRICE_SENT").length,
    confirmedBookings: allBookings.filter(b => b.status === "CONFIRMED" || b.status === "DRIVER_ASSIGNED").length,
    activeTrips: allBookings.filter(b => b.status === "STARTED").length,
    vehiclesAvailable: vehicles.filter(v => v.status === "AVAILABLE").length,
    vehiclesInMaintenance: vehicles.filter(v => v.status === "MAINTENANCE").length,
    totalCustomers: customers.length,
    totalDrivers: drivers.length,
    todayRevenue,
  };

  const statCards = [
    { label: "Today's Requests", value: stats.todaysRequests, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Pending Quotes", value: stats.pendingQuotations, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Active Trips", value: stats.activeTrips, icon: PlayCircle, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Bookings Today", value: stats.confirmedBookings, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Vehicles Available", value: stats.vehiclesAvailable, icon: Car, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-teal-600", bg: "bg-teal-100" },
    { label: "Drivers", value: stats.totalDrivers, icon: UserPlus, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Today's Revenue", value: `₹${stats.todayRevenue}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Real-time business metrics</p>
        </div>
        <Link href="/admin/bookings">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <CalendarCheck className="h-4 w-4 mr-2" /> View All Bookings
          </Button>
        </Link>
      </div>

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
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/bookings">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <CalendarCheck className="h-4 w-4 text-red-600" />
                  Manage Bookings
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/vehicles">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <Car className="h-4 w-4 text-purple-600" />
                  Manage Vehicles
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <BarChart3Icon className="h-4 w-4 text-blue-600" />
                  View Reports
                </Button>
              </Link>
              <Link href="/admin/cms/settings">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200">
                  <SettingsIcon className="h-4 w-4 text-gray-600" />
                  Website Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-red-600" />
                Latest Bookings
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
                    {allBookings.slice(0, 5).map((booking: typeof allBookings[number]) => (
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'PRICE_SENT' ? 'bg-amber-100 text-amber-800' :
                            booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                            booking.status === 'STARTED' ? 'bg-purple-100 text-purple-800' :
                            booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/admin/bookings/${booking.id}`}>
                            <Button size="sm" variant="outline" className="border-gray-200">
                              {booking.status === 'PENDING' ? 'Send Quote' : 'View'}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {allBookings.length === 0 && (
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

function BarChart3Icon({ className }: { className?: string }) {
  return <TrendingUp className={className} />;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
