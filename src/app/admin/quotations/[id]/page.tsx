"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Save,
  CheckCircle,
  XCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Users,
  Car,
  Calendar,
  IndianRupee,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
};

type QuotationDetail = {
  id: string;
  quotationNumber: string;
  status: string;
  validUntil: string | null;
  notes: string | null;
  bookingType: string;
  tripType: string;
  pickupAddress: string | null;
  dropAddress: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  passengers: number | null;
  vehicleType: string | null;
  baseFare: number | null;
  perKmCharge: number | null;
  totalKm: number | null;
  nightCharges: number | null;
  driverAllowance: number | null;
  parkingCharges: number | null;
  tollCharges: number | null;
  permitCharges: number | null;
  stateTax: number | null;
  discount: number | null;
  gst: number | null;
  totalFare: number | null;
  rejectionReason: string | null;
  createdAt: string;
  lead: {
    id: string; name: string; phone: string | null; email: string | null;
    city: string | null; bookingType: string | null; tripType: string | null;
    pickupAddress: string | null; dropAddress: string | null;
    pickupDate: string | null; passengers: number | null;
    preferredVehicle: string | null; notes: string | null; source: string | null;
  } | null;
  createdBy: { id: string; name: string; email: string };
  approvedBy: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  booking: { id: string; bookingNumber: string; status: string } | null;
};

export default function QuotationDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "";
  const canApprove = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"].includes(userRole);

  const [pricing, setPricing] = useState({
    baseFare: 0,
    perKmCharge: 11,
    totalKm: 350,
    nightCharges: 0,
    driverAllowance: 0,
    parkingCharges: 0,
    tollCharges: 0,
    permitCharges: 0,
    stateTax: 0,
    discount: 0,
    gst: 0,
  });
  const [pricingInitialized, setPricingInitialized] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/admin/login");
    if (authStatus === "authenticated") fetchQuotation();
  }, [authStatus]);

  async function fetchQuotation() {
    try {
      const res = await fetch(`/api/admin/quotations/${params.id}`);
      if (!res.ok) { router.push("/admin/quotations"); return; }
      const data = await res.json();
      setQuotation(data);
      if (!pricingInitialized) {
        setPricing({
          baseFare: data.baseFare ?? 0,
          perKmCharge: data.perKmCharge ?? 11,
          totalKm: data.totalKm ?? 350,
          nightCharges: data.nightCharges ?? 0,
          driverAllowance: data.driverAllowance ?? 0,
          parkingCharges: data.parkingCharges ?? 0,
          tollCharges: data.tollCharges ?? 0,
          permitCharges: data.permitCharges ?? 0,
          stateTax: data.stateTax ?? 0,
          discount: data.discount ?? 0,
          gst: data.gst ?? 0,
        });
        setPricingInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const vehicleCharge = pricing.perKmCharge * pricing.totalKm;
    const subtotal = vehicleCharge + pricing.nightCharges + pricing.driverAllowance +
      pricing.parkingCharges + pricing.tollCharges + pricing.permitCharges + pricing.stateTax;
    const gstAmount = subtotal * (pricing.gst / 100);
    const totalFare = subtotal + gstAmount - pricing.discount;

    await fetch(`/api/admin/quotations/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pricing, totalFare }),
    });
    setSaving(false);
    fetchQuotation();
  }

  async function handleStatusChange(status: string) {
    await fetch(`/api/admin/quotations/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason: status === "REJECTED" ? rejectReason : undefined }),
    });
    setRejectDialogOpen(false);
    fetchQuotation();
  }

  const vehicleCharge = pricing.perKmCharge * pricing.totalKm;
  const subtotal = vehicleCharge + pricing.nightCharges + pricing.driverAllowance +
    pricing.parkingCharges + pricing.tollCharges + pricing.permitCharges + pricing.stateTax;
  const gstAmount = subtotal * (pricing.gst / 100);
  const calculatedTotal = subtotal + gstAmount - pricing.discount;

  if (authStatus === "loading" || loading) return <div className="p-8">Loading...</div>;
  if (!quotation) return <div className="p-8">Quotation not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/quotations")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Quotation {quotation.quotationNumber}
            </h1>
            <Badge className={STATUS_COLORS[quotation.status] ?? ""}>
              {quotation.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Created by {quotation.createdBy.name} &middot; {formatDateTime(quotation.createdAt)}
            {quotation.branch && ` &middot; ${quotation.branch.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {quotation.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => handleStatusChange("SENT")}>
                <Send className="h-4 w-4 mr-2" /> Send to Customer
              </Button>
            </>
          )}
          {quotation.status === "SENT" && canApprove && (
            <>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange("APPROVED")}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              {quotation.lead ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-base">{quotation.lead.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-500">
                    {quotation.lead.phone && (
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> {quotation.lead.phone}
                      </span>
                    )}
                    {quotation.lead.email && (
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> {quotation.lead.email}
                      </span>
                    )}
                    {quotation.lead.city && (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {quotation.lead.city}
                      </span>
                    )}
                    {quotation.lead.source && (
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Source: {quotation.lead.source}
                      </span>
                    )}
                  </div>
                  {quotation.lead.notes && (
                    <p className="mt-2 p-2 bg-gray-50 rounded text-gray-600">{quotation.lead.notes}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Walk-in customer (no lead)</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trip Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{quotation.bookingType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Trip:</span>
                  <span className="font-medium">{quotation.tripType.replace(/_/g, " ")}</span>
                </div>
                {quotation.vehicleType && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="font-medium">{quotation.vehicleType.replace(/_/g, " ")}</span>
                  </div>
                )}
                {quotation.passengers && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Passengers:</span>
                    <span className="font-medium">{quotation.passengers}</span>
                  </div>
                )}
                {quotation.pickupDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Pickup:</span>
                    <span className="font-medium">{formatDateTime(quotation.pickupDate)}</span>
                  </div>
                )}
                {quotation.validUntil && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Valid till:</span>
                    <span className="font-medium">{formatDateTime(quotation.validUntil)}</span>
                  </div>
                )}
              </div>
              {quotation.pickupAddress && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Pickup:</span>
                  <p className="font-medium">{quotation.pickupAddress}</p>
                </div>
              )}
              {quotation.dropAddress && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Drop:</span>
                  <p className="font-medium">{quotation.dropAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Per KM Rate (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.perKmCharge}
                    onChange={(e) => setPricing({ ...pricing, perKmCharge: parseFloat(e.target.value) || 0 })}
                    disabled={quotation.status !== "DRAFT"}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Total KM</Label>
                  <Input
                    type="number"
                    value={pricing.totalKm}
                    onChange={(e) => setPricing({ ...pricing, totalKm: parseFloat(e.target.value) || 0 })}
                    disabled={quotation.status !== "DRAFT"}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Base Fare (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.baseFare}
                    onChange={(e) => setPricing({ ...pricing, baseFare: parseFloat(e.target.value) || 0 })}
                    disabled={quotation.status !== "DRAFT"}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Night Charges (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.nightCharges}
                    onChange={(e) => setPricing({ ...pricing, nightCharges: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Driver Allowance (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.driverAllowance}
                    onChange={(e) => setPricing({ ...pricing, driverAllowance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Parking Charges (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.parkingCharges}
                    onChange={(e) => setPricing({ ...pricing, parkingCharges: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Toll Charges (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.tollCharges}
                    onChange={(e) => setPricing({ ...pricing, tollCharges: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Permit Charges (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.permitCharges}
                    onChange={(e) => setPricing({ ...pricing, permitCharges: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>State Tax (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.stateTax}
                    onChange={(e) => setPricing({ ...pricing, stateTax: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>GST (%)</Label>
                  <Input
                    type="number"
                    value={pricing.gst}
                    onChange={(e) => setPricing({ ...pricing, gst: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Discount (₹)</Label>
                  <Input
                    type="number"
                    value={pricing.discount}
                    onChange={(e) => setPricing({ ...pricing, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Vehicle Charge ({pricing.perKmCharge} × {pricing.totalKm} km)</span>
                    <span>₹{vehicleCharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Night Charges</span>
                    <span>₹{pricing.nightCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver Allowance</span>
                    <span>₹{pricing.driverAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parking + Toll + Permit</span>
                    <span>₹{(pricing.parkingCharges + pricing.tollCharges + pricing.permitCharges).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>State Tax</span>
                    <span>₹{pricing.stateTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>GST @{pricing.gst}%</span>
                    <span>₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-₹{pricing.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-gray-300 pt-2 font-bold text-lg">
                    <span>Total Fare</span>
                    <span className="text-blue-600">₹{calculatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {quotation.status === "DRAFT" && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Pricing"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                {quotation.status === "DRAFT" && (
                  <Button onClick={() => handleStatusChange("SENT")}>
                    <Send className="h-4 w-4 mr-2" /> Send to Customer
                  </Button>
                )}
                {quotation.status === "SENT" && canApprove && (
                  <>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange("APPROVED")}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </>
                )}
                {quotation.status === "UNDER_REVIEW" && canApprove && (
                  <>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange("APPROVED")}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </>
                )}
                {(quotation.status === "APPROVED" || quotation.status === "SENT") && !quotation.booking && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (quotation.lead) {
                        const res = await fetch(`/api/admin/leads/${quotation.lead.id}/convert`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ quotationId: quotation.id }),
                        });
                        if (res.ok) fetchQuotation();
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Convert to Booking
                  </Button>
                )}
              </div>

              {quotation.approvedBy && (
                <div className="p-2 bg-green-50 rounded text-sm text-green-700">
                  Approved by {quotation.approvedBy.name}
                </div>
              )}
              {quotation.rejectionReason && (
                <div className="p-2 bg-red-50 rounded text-sm text-red-700">
                  Rejected: {quotation.rejectionReason}
                </div>
              )}
              {quotation.booking && (
                <div className="p-2 bg-blue-50 rounded text-sm">
                  <span className="text-blue-700">Booking:</span>
                  <a href={`/admin/bookings/${quotation.booking.id}`} className="ml-1 text-blue-600 underline">
                    {quotation.booking.bookingNumber}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleStatusChange("REJECTED")}>
              Reject Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
