"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Car,
  FileText,
  CreditCard,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: myBookings, isLoading } = useQuery({
    queryKey: ["customer-bookings"],
    queryFn: () =>
      fetch("/api/bookings?customerOnly=true").then((res) => res.json()),
  });

  if (status === "loading" || isLoading) {
    return <div className="p-8 text-center">Loading your dashboard...</div>;
  }

  const bookings = Array.isArray(myBookings) ? myBookings : [];

  const activeBookings = bookings.filter((b: { status: string }) =>
    ["BOOKING_CONFIRMED", "WAITING_ASSIGNMENT", "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED", "READY_FOR_DISPATCH", "TRIP_STARTED", "PICKUP_COMPLETED"].includes(b.status)
  );
  const pendingQuotes = bookings.filter((b: { status: string }) =>
    ["QUOTE_PREPARING", "QUOTE_SENT", "PRICE_SENT"].includes(b.status)
  );
  const invoiceStatuses = bookings.filter((b: { status: string }) =>
    ["INVOICE_GENERATED", "CLOSED", "COMPLETED"].includes(b.status)
  );
  const recentTrips = bookings.filter((b: { status: string }) =>
    ["TRIP_STARTED", "PICKUP_COMPLETED", "DROP_COMPLETED", "TRIP_COMPLETED"].includes(b.status)
  );
  const recentBookings = bookings.slice(0, 5);

  const countCards = [
    {
      label: "Active Bookings",
      value: activeBookings.length,
      icon: Car,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Quotes",
      value: pendingQuotes.length,
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Invoices",
      value: invoiceStatuses.length,
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Recent Trips",
      value: recentTrips.length,
      icon: MapPin,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const quickLinks = [
    { label: "My Bookings", href: "/customer/bookings", icon: Car },
    { label: "Quotations", href: "/customer/quotations", icon: FileText },
    { label: "Invoices", href: "/customer/invoices", icon: CreditCard },
    { label: "Payments", href: "/customer/bookings", icon: CreditCard },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500 mt-1">Manage your trips, quotations, and invoices here.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {countCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full ${card.bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.label} href={link.href}>
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-gray-900">{link.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>No data yet</p>
              <Link href="/">
                <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                  Book Your First Ride
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking: {
                id: string;
                bookingType: string;
                status: string;
                pickupAddress: string;
                dropAddress?: string;
                pickupDate: string;
                fare?: number;
                totalFare?: number;
              }) => {
                const isCompleted = booking.status === "TRIP_COMPLETED" || booking.status === "COMPLETED";
                return (
                  <Link key={booking.id} href={`/customer/bookings/${booking.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {booking.pickupAddress}
                            {booking.dropAddress && <> → {booking.dropAddress}</>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(booking.pickupDate)} · {booking.bookingType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(booking.totalFare ?? booking.fare ?? 0)}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {booking.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
