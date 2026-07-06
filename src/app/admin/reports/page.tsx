"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
  convertToCSV,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Download, BarChart3, TrendingUp } from "lucide-react";

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState("all");

  const { data: bookings } = useQuery({
    queryKey: ["reports-bookings"],
    queryFn: () => fetch("/api/bookings").then((res) => res.json()),
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  // Filter by period
  const filteredBookings = bookingsList.filter((b: { createdAt: string }) => {
    if (period === "all") return true;
    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(b.createdAt) >= cutoff;
  });

  // Revenue by day
  const revenueByDay = filteredBookings
    .filter((b: { status: string }) => b.status === "COMPLETED")
    .reduce((acc: Record<string, number>, b: { createdAt: string; fare: number }) => {
      const day = new Date(b.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      acc[day] = (acc[day] || 0) + b.fare;
      return acc;
    }, {});

  const revenueChartData = Object.entries(revenueByDay).map(
    ([day, revenue]) => ({
      day,
      revenue,
    })
  );

  // Revenue by type
  const revenueByType = filteredBookings
    .filter((b: { status: string }) => b.status === "COMPLETED")
    .reduce(
      (
        acc: Record<string, number>,
        b: { bookingType: string; fare: number }
      ) => {
        const type = getBookingTypeName(b.bookingType);
        acc[type] = (acc[type] || 0) + b.fare;
        return acc;
      },
      {}
    );

  const typeChartData = Object.entries(revenueByType).map(
    ([type, revenue]) => ({
      type,
      revenue,
    })
  );

  // Summary stats
  const totalRevenue = filteredBookings
    .filter((b: { status: string }) => b.status === "COMPLETED")
    .reduce((sum: number, b: { fare: number }) => sum + b.fare, 0);
  const totalRides = filteredBookings.length;
  const completedRides = filteredBookings.filter(
    (b: { status: string }) => b.status === "COMPLETED"
  ).length;
  const avgFare =
    completedRides > 0
      ? totalRevenue / completedRides
      : 0;

  // Export CSV
  const handleExportCSV = () => {
    const csvData = filteredBookings.map(
      (b: {
        id: string;
        customer: { name: string };
        driver: { name: string } | null;
        bookingType: string;
        status: string;
        fare: number;
        distance: number | null;
        paymentStatus: string;
        pickupAddress: string;
        dropAddress: string;
        createdAt: string;
      }) => ({
        "Booking ID": b.id,
        Customer: b.customer?.name || "N/A",
        Driver: b.driver?.name || "Not Assigned",
        Type: getBookingTypeName(b.bookingType),
        Status: b.status,
        Fare: b.fare,
        Distance: b.distance || 0,
        Payment: b.paymentStatus,
        Pickup: b.pickupAddress,
        Drop: b.dropAddress,
        Date: formatDateTime(b.createdAt),
      })
    );

    const csv = convertToCSV(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aradhana-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading") {
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">
            Analytics and data export
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value) => setPeriod(value ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Rides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRides}</div>
            <p className="text-xs text-gray-500">{completedRides} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Avg Fare per Ride
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgFare)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Revenue by Service Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Rides</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Driver
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Fare
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Distance
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings
                  .slice(0, 20)
                  .map(
                    (b: {
                      id: string;
                      customer: { name: string };
                      driver: { name: string } | null;
                      bookingType: string;
                      fare: number;
                      distance: number | null;
                      status: string;
                      createdAt: string;
                    }) => (
                      <tr key={b.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {b.customer?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {b.driver?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {getBookingTypeName(b.bookingType)}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(b.fare)}
                        </td>
                        <td className="py-3 px-4">
                          {b.distance ? `${b.distance.toFixed(1)} km` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              b.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : b.status === "REQUESTED"
                                ? "bg-yellow-100 text-yellow-700"
                                : b.status === "ACCEPTED"
                                ? "bg-blue-100 text-blue-700"
                                : b.status === "STARTED"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDateTime(b.createdAt)}
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
