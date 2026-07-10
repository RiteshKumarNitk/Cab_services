"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
};

type QuotationItem = {
  id: string;
  quotationNumber: string;
  status: string;
  totalFare: number | null;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  lead: { id: string; name: string; phone: string | null; email: string | null } | null;
  createdBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
};

export default function AdminQuotationsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authStatus === "unauthenticated") return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ page: String(page), limit: "20" });
        if (statusFilter) queryParams.set("status", statusFilter);
        const res = await fetch(`/api/admin/quotations?${queryParams}`, { signal: controller.signal });
        const data = await res.json();
        if (!controller.signal.aborted) {
          setQuotations(data.quotations ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        // ignore abort errors
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [authStatus, statusFilter, page]);

  if (authStatus === "loading") return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500 mt-1">Total: {total}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ""); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/admin/bookings")}>
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Quotations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No quotations found</div>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => (
                <Link
                  key={q.id}
                  href={`/admin/quotations/${q.id}`}
                  className="block p-4 rounded-lg border hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {q.lead?.name ?? "Walk-in Customer"}
                        </span>
                        <Badge className={STATUS_COLORS[q.status] ?? ""}>
                          {q.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-gray-400">{q.quotationNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {q.lead?.phone && <span>{q.lead.phone}</span>}
                        {q.totalFare != null && (
                          <span className="font-medium text-gray-700">
                            ₹{q.totalFare.toLocaleString()}
                          </span>
                        )}
                        <span>by {q.createdBy.name}</span>
                        {q.branch && <span>{q.branch.name}</span>}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>{formatDateTime(q.createdAt)}</p>
                      {q.validUntil && <p>Valid till: {formatDateTime(q.validUntil)}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {total > 20 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <span className="text-sm text-gray-500">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / 20)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
