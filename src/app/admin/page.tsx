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
  MessageSquare,
  FileText,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  // Fetch real data from Prisma
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    allBookings,
    todayBookings,
    vehicles,
    drivers
  ] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: true }
    }),
    prisma.booking.findMany({
      where: {
        createdAt: { gte: today }
      }
    }),
    prisma.vehicle.findMany(),
    prisma.user.findMany({ where: { role: 'DRIVER' } })
  ]);

  const stats = {
    todaysRequests: todayBookings.length,
    pendingQuotations: allBookings.filter(b => b.status === "PENDING" || b.status === "PRICE_SENT").length,
    confirmedBookings: allBookings.filter(b => b.status === "CONFIRMED").length,
    tripsStartingToday: allBookings.filter(b => {
      if (!b.pickupDate) return false;
      const pickupDate = new Date(b.pickupDate);
      return pickupDate.toDateString() === new Date().toDateString();
    }).length,
    vehiclesAvailable: vehicles.filter(v => v.status === "AVAILABLE").length,
    vehiclesInMaintenance: vehicles.filter(v => v.status === "MAINTENANCE").length,
    driversAvailable: drivers.length, // Ideally we check driver status, but let's count all for now
    paymentsPending: allBookings.filter(b => b.paymentStatus === "PENDING").length,
  };

  const statCards = [
    { label: "Today's Requests", value: stats.todaysRequests, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Pending Quotations", value: stats.pendingQuotations, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Confirmed Bookings", value: stats.confirmedBookings, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Trips Starting Today", value: stats.tripsStartingToday, icon: PlayCircle, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Vehicles Available", value: stats.vehiclesAvailable, icon: Car, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "In Maintenance", value: stats.vehiclesInMaintenance, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Drivers Available", value: stats.driversAvailable, icon: UserPlus, color: "text-teal-600", bg: "bg-teal-100" },
    { label: "Payments Pending", value: stats.paymentsPending, icon: CreditCard, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Real-time business metrics and recent activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="border-0 shadow-md">
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
          <Card className="border-0 shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <FileText className="h-4 w-4 text-blue-600" />
                Create Custom Quote
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                Assign Driver to Trip
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Car className="h-4 w-4 text-purple-600" />
                Update Vehicle Status
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <MessageSquare className="h-4 w-4 text-green-600" />
                Send WhatsApp Update
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Mail className="h-4 w-4 text-red-500" />
                Email Invoice
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Latest Customer Requests */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-600" />
                Latest Customer Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Route</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.slice(0, 6).map((booking: any) => (
                      <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{booking.customer?.name}</div>
                          <div className="text-xs text-gray-500">{booking.customer?.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{booking.pickupAddress}</div>
                          <div className="text-xs text-gray-500">to {booking.dropAddress}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDateTime(booking.pickupDate || booking.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'PRICE_SENT' ? 'bg-amber-100 text-amber-800' :
                            booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/admin/bookings/${booking.id}`}>
                            <Button size="sm" variant="outline">
                              {booking.status === 'PENDING' ? 'Send Quote' : 'View'}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {allBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                          <p>No trip requests yet</p>
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
