"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Car,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  QUALIFIED: "bg-purple-100 text-purple-800",
  QUOTATION_SENT: "bg-indigo-100 text-indigo-800",
  NEGOTIATION: "bg-orange-100 text-orange-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

type LeadDetail = {
  id: string;
  leadNumber: string;
  status: string;
  source: string;
  name: string;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  city: string | null;
  bookingType: string | null;
  tripType: string | null;
  pickupAddress: string | null;
  dropAddress: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  passengers: number | null;
  preferredVehicle: string | null;
  notes: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string; email: string; phone: string | null } | null;
  branch: { id: string; name: string; city: string | null } | null;
  quotations: Array<{
    id: string;
    quotationNumber: string;
    status: string;
    totalFare: number | null;
    createdAt: string;
    createdBy: { id: string; name: string };
    approvedBy: { id: string; name: string } | null;
  }>;
  booking: { id: string; bookingNumber: string; status: string; totalFare: number | null; createdAt: string } | null;
};

export default function LeadDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/admin/login");
    if (authStatus === "authenticated") fetchLead();
  }, [authStatus]);

  async function fetchLead() {
    try {
      const res = await fetch(`/api/admin/leads/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/admin/leads");
        return;
      }
      setLead(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(value: string | null) {
    if (!value) return;
    fetch(`/api/admin/leads/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    }).then(() => fetchLead());
  }

  if (authStatus === "loading" || loading) return <div className="p-8">Loading...</div>;
  if (!lead) return <div className="p-8">Lead not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/leads")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <Badge className={STATUS_COLORS[lead.status] ?? ""}>
              {lead.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-gray-400">{lead.leadNumber}</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Source: {lead.source} &middot; Created: {formatDateTime(lead.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{lead.phone ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{lead.email ?? "—"}</span>
                </div>
                {lead.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{lead.city}</span>
                  </div>
                )}
                {lead.branch && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{lead.branch.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Travel Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {lead.bookingType && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{lead.bookingType}</span>
                  </div>
                )}
                {lead.tripType && (
                  <div>
                    <span className="text-gray-500">Trip:</span>
                    <span className="font-medium ml-1">{lead.tripType.replace(/_/g, " ")}</span>
                  </div>
                )}
                {lead.passengers && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Passengers:</span>
                    <span className="font-medium">{lead.passengers}</span>
                  </div>
                )}
                {lead.preferredVehicle && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="font-medium">{lead.preferredVehicle.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
              {lead.pickupAddress && (
                <div className="text-sm">
                  <span className="text-gray-500">Pickup:</span>
                  <p className="font-medium mt-1">{lead.pickupAddress}</p>
                </div>
              )}
              {lead.dropAddress && (
                <div className="text-sm">
                  <span className="text-gray-500">Drop:</span>
                  <p className="font-medium mt-1">{lead.dropAddress}</p>
                </div>
              )}
              {lead.pickupDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Pickup Date:</span>
                  <span className="font-medium">{formatDateTime(lead.pickupDate)}</span>
                </div>
              )}
              {lead.notes && (
                <div className="text-sm">
                  <span className="text-gray-500">Notes:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-gray-700">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Quotations</CardTitle>
              <Button
                size="sm"
                onClick={() => router.push(`/admin/bookings?id=${lead.id}`)}
                disabled={lead.status === "LOST" || lead.status === "ARCHIVED"}
              >
                <FileText className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </CardHeader>
            <CardContent>
              {lead.quotations.length === 0 ? (
                <p className="text-sm text-gray-500">No quotations yet</p>
              ) : (
                <div className="space-y-2">
                  {lead.quotations.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between p-3 rounded border"
                    >
                      <div>
                        <span className="font-medium text-sm">{q.quotationNumber}</span>
                        <Badge className="ml-2 text-xs">{q.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          By {q.createdBy.name} &middot; {formatDateTime(q.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        {q.totalFare && (
                          <p className="font-medium">₹{q.totalFare.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="QUOTATION_SENT">Quotation Sent</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="WON">Won</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.assignedTo ? (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{lead.assignedTo.name}</p>
                  <p className="text-gray-500">{lead.assignedTo.email}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.booking ? (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium text-sm">Converted to Booking</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {lead.booking.bookingNumber}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Not yet converted</p>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/leads/${lead.id}/convert`, {
                        method: "POST",
                      });
                      if (res.ok) fetchLead();
                    }}
                    disabled={lead.status === "LOST" || lead.status === "ARCHIVED"}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Convert to Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
