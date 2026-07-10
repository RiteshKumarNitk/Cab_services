"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

const invoiceStatusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const paymentStatusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-blue-100 text-blue-700",
};

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  paidAmount: number;
  dueDate: string | null;
  createdAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    pickupAddress: string;
    dropAddress: string;
  } | null;
}

export default function CustomerInvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["customer-invoices"],
    queryFn: () =>
      fetch("/api/invoices?customerOnly=true").then((res) => res.json()),
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  const list: InvoiceItem[] = Array.isArray(invoices) ? invoices : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-gray-500 mt-1">View and manage your invoices</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading invoices...</div>
      ) : list.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="p-12 text-center text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-1">No invoices yet</p>
            <p className="text-sm mb-4">Invoices will appear here once your trips are completed.</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Book a Ride
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((inv) => (
            <Card key={inv.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {inv.invoiceNumber}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${invoiceStatusStyles[inv.status] || "bg-gray-100 text-gray-700"}`}>
                        {inv.status.replace(/_/g, " ")}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusStyles[inv.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                        {inv.paymentStatus === "PARTIAL" ? "PARTIALLY PAID" : inv.paymentStatus}
                      </span>
                    </div>
                    {inv.booking && (
                      <p className="text-sm text-gray-600 truncate">
                        {inv.booking.pickupAddress}
                        {inv.booking.dropAddress && <> → {inv.booking.dropAddress}</>}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created {formatDateTime(inv.createdAt)}
                      {inv.dueDate && <> · Due {formatDateTime(inv.dueDate)}</>}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(inv.total)}
                    </p>
                    {inv.paidAmount > 0 && (
                      <p className="text-xs text-gray-500">
                        Paid: {formatCurrency(inv.paidAmount)}
                      </p>
                    )}
                    {inv.booking && (
                      <Link href={`/customer/bookings/${inv.booking.id}`}>
                        <Button variant="outline" size="sm" className="mt-2 border-red-200 text-red-600 hover:bg-red-50">
                          View Booking <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
