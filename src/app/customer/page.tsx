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
import { formatDateTime } from "@/lib/utils";
import {
  Car,
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: myBookings, isLoading } = useQuery({
    queryKey: ["customer-bookings"],
    queryFn: () => fetch("/api/customer/bookings").then((res) => res.json()),
  });

  if (status === "loading" || isLoading) {
    return <div className="p-8 text-center">Loading your dashboard...</div>;
  }

  const bookings = Array.isArray(myBookings) ? myBookings : [];
  
  const pendingQuotes = bookings.filter(b => b.status === "PRICE_SENT");
  const upcomingTrips = bookings.filter(b => ["CONFIRMED", "DRIVER_ASSIGNED", "VEHICLE_READY"].includes(b.status));
  const activeTrips = bookings.filter(b => b.status === "STARTED");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(" ")[0]}</h1>
        <p className="text-gray-500">Manage your trips, quotations, and invoices here.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Alerts & Quotations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Trip Banner if any */}
          {activeTrips.length > 0 && (
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <div className="bg-blue-600 rounded-xl p-6 text-white shadow-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Car className="animate-pulse" /> Trip in Progress
                  </h3>
                  <p className="text-blue-100 mt-1">Your driver is currently navigating.</p>
                </div>
                <Link href={`/customer/bookings/${activeTrips[0].id}`}>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50">View Live Trip</Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Pending Quotations */}
          {pendingQuotes.length > 0 && (
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="text-amber-500 h-5 w-5" /> Pending Quotations
              </h2>
              <div className="space-y-4">
                {pendingQuotes.map(quote => (
                  <Card key={quote.id} className="border-amber-200 bg-amber-50/50 shadow-sm">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{quote.pickupAddress} → {quote.dropAddress}</p>
                        <p className="text-sm text-gray-500">Pickup: {formatDateTime(quote.pickupDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">₹{quote.totalFare}</p>
                        <Link href={`/customer/bookings/${quote.id}`}>
                          <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700">Review & Confirm</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Upcoming Trips */}
          <motion.div variants={fadeInUp} initial="initial" animate="animate">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CalendarCheck className="text-blue-500 h-5 w-5" /> Upcoming Trips
            </h2>
            {upcomingTrips.length === 0 ? (
              <Card className="border-dashed border-2 bg-gray-50/50">
                <CardContent className="p-8 text-center text-gray-500">
                  <Car className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>You have no upcoming trips.</p>
                  <Link href="/request-cab">
                    <Button variant="outline" className="mt-4">Request a Cab</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingTrips.map(trip => (
                  <Card key={trip.id} className="shadow-sm">
                    <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            {trip.status.replace("_", " ")}
                          </span>
                          <span className="text-sm font-medium text-gray-500">{trip.bookingType}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{trip.pickupAddress}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{formatDateTime(trip.pickupDate)}</p>
                        </div>
                      </div>
                      <div>
                        <Link href={`/customer/bookings/${trip.id}`}>
                          <Button variant="outline" className="w-full sm:w-auto">View Details <ArrowRight className="h-4 w-4 ml-2"/></Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Quick Links & Support */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/request-cab" className="block">
                <Button className="w-full justify-start h-12 bg-blue-600 hover:bg-blue-700 text-white">
                  <Car className="h-4 w-4 mr-3" /> New Trip Request
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start h-12">
                <FileText className="h-4 w-4 mr-3 text-gray-500" /> My Invoices
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Clock className="h-4 w-4 mr-3 text-gray-500" /> Trip History
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-gray-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Need Support?</h3>
              <p className="text-sm text-gray-600 mb-4">Our support team is available 24/7 for any assistance.</p>
              <div className="space-y-3">
                <Button variant="default" className="w-full justify-start bg-green-600 hover:bg-green-700">
                  <MessageSquare className="h-4 w-4 mr-2" /> Chat on WhatsApp
                </Button>
                <Button variant="outline" className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50">
                  <ShieldAlert className="h-4 w-4 mr-2" /> Emergency Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
