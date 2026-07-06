"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateTime, getBookingTypeName } from "@/lib/utils";
import {
  Car,
  Users,
  CalendarCheck,
  IndianRupee,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const statCards = [
  {
    key: "bookings",
    label: "Total Bookings",
    icon: CalendarCheck,
    gradient: "from-blue-500 to-blue-600",
    shadow: "shadow-blue-500/20",
  },
  {
    key: "revenue",
    label: "Total Revenue",
    icon: IndianRupee,
    gradient: "from-emerald-500 to-emerald-600",
    shadow: "shadow-emerald-500/20",
  },
  {
    key: "users",
    label: "Total Users",
    icon: Users,
    gradient: "from-purple-500 to-purple-600",
    shadow: "shadow-purple-500/20",
  },
  {
    key: "drivers",
    label: "Active Drivers",
    icon: Car,
    gradient: "from-orange-500 to-orange-600",
    shadow: "shadow-orange-500/20",
  },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings-dash"],
    queryFn: () => fetch("/api/bookings").then((res) => res.json()),
    refetchInterval: 5000,
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users-dash"],
    queryFn: () => fetch("/api/admin/users").then((res) => res.json()),
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600" />
          <div className="absolute inset-0 animate-pulse-glow rounded-full" />
        </div>
      </div>
    );
  }

  const stats = {
    bookings: Array.isArray(bookings) ? bookings.length : 0,
    completedBookings: Array.isArray(bookings)
      ? bookings.filter((b: { status: string }) => b.status === "COMPLETED").length
      : 0,
    totalRevenue: Array.isArray(bookings)
      ? bookings
          .filter((b: { status: string }) => b.status === "COMPLETED")
          .reduce((sum: number, b: { fare: number }) => sum + b.fare, 0)
      : 0,
    totalUsers: Array.isArray(users) ? users.length : 0,
    activeDrivers: Array.isArray(users)
      ? users.filter(
          (u: { role: string; driverStatus: { online: boolean } | null }) =>
            u.role === "DRIVER" && u.driverStatus?.online
        ).length
      : 0,
  };

  const bookingsByDay = Array.isArray(bookings)
    ? bookings.reduce(
        (acc: Record<string, number>, b: { createdAt: string }) => {
          const day = new Date(b.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        },
        {}
      )
    : {};

  const chartData = Object.entries(bookingsByDay).map(([day, count]) => ({
    day,
    bookings: count,
  }));

  const bookingsByType = Array.isArray(bookings)
    ? bookings.reduce(
        (acc: Record<string, number>, b: { bookingType: string }) => {
          acc[b.bookingType] = (acc[b.bookingType] || 0) + 1;
          return acc;
        },
        {}
      )
    : {};

  const pieData = Object.entries(bookingsByType).map(([type, count]) => ({
    name: getBookingTypeName(type),
    value: count,
  }));

  const recentBookings = Array.isArray(bookings) ? bookings.slice(0, 5) : [];

  const statValues = [
    { value: stats.bookings, sub: `${stats.completedBookings} completed` },
    { value: formatCurrency(stats.totalRevenue), sub: "From completed rides" },
    { value: stats.totalUsers, sub: "Registered users" },
    { value: stats.activeDrivers, sub: "Currently online" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-gray-500 ml-[52px]">
          Welcome back, <span className="font-medium text-gray-700">{session?.user?.name}</span>
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const stat = statValues[index];
          return (
            <motion.div key={card.key} variants={fadeInUp}>
              <Card className={`border-0 shadow-lg ${card.shadow} overflow-hidden card-hover stat-card ${card.key === "bookings" ? "blue" : card.key === "revenue" ? "green" : card.key === "users" ? "purple" : "orange"}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {card.label}
                  </CardTitle>
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg shadow-gray-200/50 card-hover">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                Bookings Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#bookingsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg shadow-gray-200/50 card-hover">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                Bookings by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg shadow-gray-200/50 card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-emerald-600" />
              </div>
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Fare
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking: {
                    id: string;
                    customer: { name: string };
                    bookingType: string;
                    status: string;
                    fare: number;
                    createdAt: string;
                  }, index: number) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{booking.customer?.name}</td>
                      <td className="py-3 px-4">{getBookingTypeName(booking.bookingType)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700"
                              : booking.status === "REQUESTED"
                              ? "bg-amber-50 text-amber-700"
                              : booking.status === "ACCEPTED"
                              ? "bg-blue-50 text-blue-700"
                              : booking.status === "STARTED"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            booking.status === "COMPLETED"
                              ? "bg-emerald-500"
                              : booking.status === "REQUESTED"
                              ? "bg-amber-500"
                              : booking.status === "ACCEPTED"
                              ? "bg-blue-500"
                              : booking.status === "STARTED"
                              ? "bg-purple-500"
                              : "bg-red-500"
                          }`} />
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(booking.fare)}</td>
                      <td className="py-3 px-4 text-gray-500">{formatDateTime(booking.createdAt)}</td>
                    </motion.tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
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
      </motion.div>
    </div>
  );
}
