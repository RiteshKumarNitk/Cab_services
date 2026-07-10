"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

interface QuotationItem {
  id: string;
  quotationNumber: string;
  status: string;
  totalFare: number | null;
  validUntil: string | null;
  createdAt: string;
  booking?: {
    id: string;
    pickupAddress: string;
    dropAddress: string;
    pickupDate: string;
  } | null;
  lead?: {
    name: string;
    phone: string;
  } | null;
}

export default function CustomerQuotationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["customer-quotations"],
    queryFn: () =>
      fetch("/api/quotations?customerOnly=true").then((res) => res.json()),
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  const list: QuotationItem[] = Array.isArray(quotations) ? quotations : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Quotations</h1>
        <p className="text-gray-500 mt-1">Review and manage your price quotations</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading quotations...</div>
      ) : list.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-1">No quotations yet</p>
            <p className="text-sm mb-4">Quotations will appear here once you request a ride.</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Book a Ride
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((q) => (
            <Card key={q.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {q.quotationNumber}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[q.status] || "bg-gray-100 text-gray-700"}`}>
                        {q.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {q.booking && (
                      <>
                        <p className="text-sm text-gray-600 truncate">
                          {q.booking.pickupAddress} → {q.booking.dropAddress}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(q.booking.pickupDate)}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created {formatDateTime(q.createdAt)}
                      {q.validUntil && <> · Valid until {formatDateTime(q.validUntil)}</>}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(q.totalFare ?? 0)}
                    </p>
                    {q.booking && (
                      <Link href={`/customer/bookings/${q.booking.id}`}>
                        <Button variant="outline" size="sm" className="mt-2 border-red-200 text-red-600 hover:bg-red-50">
                          View Details <ArrowRight className="h-3 w-3 ml-1" />
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
