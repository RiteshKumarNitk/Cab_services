"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useBookings, useMarkPaymentPaid } from "@/lib/hooks";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import { CalendarCheck, IndianRupee, Eye, Filter } from "lucide-react";

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { data: bookings, isLoading } = useBookings({
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter }),
  });
  const markPaymentPaid = useMarkPaymentPaid();

  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/");
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600" />
          <div className="absolute inset-0 animate-pulse-glow rounded-full" />
        </div>
      </div>
    );
  }

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-gray-500 mt-1">View and manage all ride bookings</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filters:</span>
        </div>
        <div className="w-44">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "")}>
            <SelectTrigger className="h-9 rounded-lg border-gray-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="REQUESTED">Requested</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="STARTED">Started</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? "")}>
            <SelectTrigger className="h-9 rounded-lg border-gray-200">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="LOCAL">Local</SelectItem>
              <SelectItem value="OUTSTATION">Outstation</SelectItem>
              <SelectItem value="AIRPORT">Airport</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="EVENT">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-lg shadow-gray-200/50 card-hover">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-gray-50 to-blue-50/50">
                    {["Customer", "Type", "Pickup", "Status", "Fare", "Payment", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  
                    {bookingsList.map((booking: {
                      id: string;
                      customer: { name: string };
                      bookingType: string;
                      pickupAddress: string;
                      status: string;
                      fare: number;
                      paymentStatus: string;
                      createdAt: string;
                      driver: { name: string } | null;
                    }, index: number) => (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{booking.customer?.name}</td>
                        <td className="py-3 px-4">{getBookingTypeName(booking.bookingType)}</td>
                        <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">{booking.pickupAddress}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                            booking.status === "REQUESTED" ? "bg-amber-50 text-amber-700" :
                            booking.status === "ACCEPTED" ? "bg-blue-50 text-blue-700" :
                            booking.status === "STARTED" ? "bg-purple-50 text-purple-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              booking.status === "COMPLETED" ? "bg-emerald-500" :
                              booking.status === "REQUESTED" ? "bg-amber-500" :
                              booking.status === "ACCEPTED" ? "bg-blue-500" :
                              booking.status === "STARTED" ? "bg-purple-500" : "bg-red-500"
                            }`} />
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(booking.fare)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={booking.paymentStatus === "PAID" ? "default" : "secondary"} className={
                            booking.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""
                          }>
                            {booking.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(booking.createdAt)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600" onClick={() => { setSelectedBooking(booking as unknown as Record<string, unknown>); setDetailOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.paymentStatus === "PENDING" && booking.status === "COMPLETED" && (
                              <Button variant="ghost" size="icon" className="hover:bg-emerald-50 text-emerald-600" onClick={() => markPaymentPaid.mutate(booking.id)}>
                                <IndianRupee className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  
                  {bookingsList.length === 0 && (
                    <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                      <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                      <p>No bookings found</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
          <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                {[
                  { label: "Type", value: getBookingTypeName((selectedBooking as Record<string, string>).bookingType) },
                  { label: "Status", value: (selectedBooking as Record<string, string>).status },
                  { label: "Customer", value: (selectedBooking as Record<string, { name: string }>).customer?.name },
                  { label: "Driver", value: (selectedBooking as Record<string, { name: string } | null>).driver?.name || "Not assigned" },
                  { label: "Fare", value: formatCurrency((selectedBooking as Record<string, number>).fare) },
                  { label: "Payment", value: (selectedBooking as Record<string, string>).paymentStatus },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
                    <p className="font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400 text-xs uppercase tracking-wider">Pickup</span><p className="font-medium">{(selectedBooking as Record<string, string>).pickupAddress}</p></div>
                <div><span className="text-gray-400 text-xs uppercase tracking-wider">Drop</span><p className="font-medium">{(selectedBooking as Record<string, string>).dropAddress || "N/A"}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
