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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Building2,
} from "lucide-react";
import type { LeadStatus } from "@prisma/client";

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

type LeadItem = {
  id: string;
  leadNumber: string;
  status: LeadStatus;
  source: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  bookingType: string | null;
  pickupDate: Date | null;
  notes: string | null;
  createdAt: Date;
  assignedTo: { id: string; name: string; email: string } | null;
  branch: { id: string; name: string } | null;
  _count: { quotations: number };
};

export default function AdminLeadsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "WEBSITE",
    notes: "",
  });

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "unauthenticated") return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/admin/leads?${params}`, { signal: controller.signal });
        const data = await res.json();
        if (!controller.signal.aborted) {
          setLeads(data.leads ?? []);
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

  async function handleCreate() {
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setCreateOpen(false);
      setFormData({ name: "", email: "", phone: "", source: "WEBSITE", notes: "" });
      fetchLeads();
    }
  }

  function handleStatusChange(leadId: string, value: string | null) {
    if (!value) return;
    fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    }).then(() => fetchLeads());
  }

  if (authStatus === "loading") return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">
            Total: {total} lead{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ""); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Status</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="QUALIFIED">Qualified</SelectItem>
              <SelectItem value="QUOTATION_SENT">Quotation Sent</SelectItem>
              <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
              <SelectItem value="WON">Won</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lead Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No leads found</div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="block p-4 rounded-lg border hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{lead.name}</span>
                        <Badge className={STATUS_COLORS[lead.status] ?? ""}>
                          {lead.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-gray-400">{lead.leadNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </span>
                        )}
                        {lead.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {lead.city}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Source: {lead.source}</span>
                        {lead.bookingType && <span>Type: {lead.bookingType}</span>}
                        {lead.assignedTo && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lead.assignedTo.name}
                          </span>
                        )}
                        <span>{formatDateTime(lead.createdAt)}</span>
                      </div>
                    </div>
                    <Select
                      value={lead.status}
                      onValueChange={(v) => handleStatusChange(lead.id, v)}
                    >
                      <SelectTrigger
                        className="w-36 h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Enter lead details manually</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Source</Label>
              <Select
                value={formData.source}
                onValueChange={(v) => setFormData({ ...formData, source: v ?? "WEBSITE" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="WALKIN">Walk-in</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name}>
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
