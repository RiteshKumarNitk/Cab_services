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
  ArrowRight,
  CalendarCheck,
  Phone,
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
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: myBookings, isLoading } = useQuery({
    queryKey: ["customer-bookings"],
    queryFn: () => fetch("/api/bookings").then((res) => res.json()),
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(" ")[0]}</h1>
        <p className="text-gray-500">Manage your trips, quotations, and invoices here.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTrips.length > 0 && (
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <div className="bg-red-700 rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Car className="animate-pulse" /> Trip in Progress
                  </h3>
                  <p className="text-red-100 mt-1">Your driver is currently navigating.</p>
                </div>
                <Link href={`/customer/bookings/${activeTrips[0].id}`}>
                  <Button className="bg-white text-red-700 hover:bg-red-50">View Live Trip</Button>
                </Link>
              </div>
            </motion.div>
          )}

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
                        <p className="text-2xl font-bold text-gray-900">₹{quote.totalFare || quote.fare}</p>
                        <Link href={`/customer/bookings/${quote.id}`}>
                          <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700">Review & Confirm</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeInUp} initial="initial" animate="animate">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CalendarCheck className="text-blue-500 h-5 w-5" /> Upcoming Trips
            </h2>
            {upcomingTrips.length === 0 ? (
              <Card className="border-dashed border-2 bg-gray-50/50">
                <CardContent className="p-8 text-center text-gray-500">
                  <Car className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>You have no upcoming trips.</p>
                  <Link href="/">
                    <Button variant="outline" className="mt-4 border-red-200 text-red-600 hover:bg-red-50">Book a Cab</Button>
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
                            {trip.status.replace(/_/g, " ")}
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
                          <Button variant="outline" className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50">View Details <ArrowRight className="h-4 w-4 ml-2" /></Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/">
                <Button className="w-full justify-start h-12 bg-red-600 hover:bg-red-700 text-white">
                  <Car className="h-4 w-4 mr-3" /> Book a Cab
                </Button>
              </Link>
              <Link href="/customer/bookings">
                <Button variant="outline" className="w-full justify-start h-12 border-gray-200">
                  <FileText className="h-4 w-4 mr-3 text-gray-500" /> My Bookings
                </Button>
              </Link>
              <Link href="/customer/history">
                <Button variant="outline" className="w-full justify-start h-12 border-gray-200">
                  <Clock className="h-4 w-4 mr-3 text-gray-500" /> Trip History
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-gray-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Need Support?</h3>
              <p className="text-sm text-gray-600 mb-4">Our support team is available 24/7 for any assistance.</p>
              <div className="space-y-3">
                <a href="tel:+917353019999">
                  <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                    <Phone className="h-4 w-4 mr-2" /> Call Us
                  </Button>
                </a>
                <Button variant="outline" className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50">
                  <ShieldAlert className="h-4 w-4 mr-2" /> Emergency
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
