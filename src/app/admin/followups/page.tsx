"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PhoneCall, MessageSquare, Mail, Calendar, Plus, Clock, CheckCircle2, Phone, Timer, Search, TrendingUp, Target, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface FollowUp {
  id: string;
  type: string;
  notes: string;
  outcome: string | null;
  nextAction: string | null;
  leadScore: number | null;
  duration: number | null;
  reminderAt: string | null;
  completedAt: string | null;
  createdAt: string;
  user: { name: string };
  leadId?: string;
  bookingId?: string;
  lead?: { id: string; name: string; leadScore: number | null; status: string } | null;
}

interface LeadSearchResult {
  id: string;
  name: string;
  phone: string | null;
  leadScore: number | null;
  status: string;
}

const typeIcons: Record<string, React.ElementType> = {
  CALL: PhoneCall,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  VISIT: Calendar,
  SMS: MessageSquare,
};

const typeColors: Record<string, string> = {
  CALL: "bg-blue-100 text-blue-600",
  WHATSAPP: "bg-green-100 text-green-600",
  EMAIL: "bg-purple-100 text-purple-600",
  VISIT: "bg-orange-100 text-orange-600",
  SMS: "bg-gray-100 text-gray-600",
};

const outcomeColors: Record<string, string> = {
  INTERESTED: "bg-green-100 text-green-800 border-green-300",
  NOT_INTERESTED: "bg-red-100 text-red-800 border-red-300",
  CALL_BACK: "bg-amber-100 text-amber-800 border-amber-300",
  CONVERTED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  WRONG_NUMBER: "bg-gray-100 text-gray-600 border-gray-300",
  FOLLOW_UP: "bg-blue-100 text-blue-800 border-blue-300",
};

const nextActionColors: Record<string, string> = {
  SEND_QUOTE: "bg-purple-100 text-purple-800 border-purple-300",
  SCHEDULE_CALL: "bg-blue-100 text-blue-800 border-blue-300",
  VISIT: "bg-orange-100 text-orange-800 border-orange-300",
  SEND_INFO: "bg-teal-100 text-teal-800 border-teal-300",
  NONE: "bg-gray-100 text-gray-600 border-gray-300",
};

const outcomeOptions = [
  { value: "", label: "No outcome" },
  { value: "INTERESTED", label: "Interested" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "CALL_BACK", label: "Call Back Later" },
  { value: "WRONG_NUMBER", label: "Wrong Number" },
  { value: "CONVERTED", label: "Converted" },
  { value: "FOLLOW_UP", label: "Follow Up" },
];

const nextActionOptions = [
  { value: "", label: "No action" },
  { value: "SEND_QUOTE", label: "Send Quote" },
  { value: "SCHEDULE_CALL", label: "Schedule Call" },
  { value: "VISIT", label: "Visit" },
  { value: "SEND_INFO", label: "Send Info" },
  { value: "NONE", label: "None" },
];

const typeOptions = [
  { value: "CALL", label: "Phone Call", icon: PhoneCall },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "SMS", label: "SMS", icon: MessageSquare },
  { value: "VISIT", label: "Visit", icon: Calendar },
];

export default function FollowupsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LeadSearchResult[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadSearchResult | null>(null);
  const [form, setForm] = useState({
    leadId: "",
    bookingId: "",
    type: "CALL",
    notes: "",
    outcome: "",
    nextAction: "",
    leadScore: 5,
    duration: "",
    reminderAt: "",
  });

  useEffect(() => {
    fetch("/api/admin/followups")
      .then((r) => r.json())
      .then(setFollowUps)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/admin/leads?search=${encodeURIComponent(searchQuery)}&limit=10`)
        .then((r) => r.json())
        .then((data) => setSearchResults(data.leads || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectLead = (lead: LeadSearchResult) => {
    setSelectedLead(lead);
    setForm((f) => ({ ...f, leadId: lead.id }));
    setSearchQuery(lead.name);
    setSearchResults([]);
  };

  const clearLead = () => {
    setSelectedLead(null);
    setForm((f) => ({ ...f, leadId: "" }));
    setSearchQuery("");
  };

  const addFollowUp = async () => {
    if (!form.notes.trim() && !form.leadId) return;
    const res = await fetch("/api/admin/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        duration: form.type === "CALL" && form.duration ? parseInt(form.duration) : undefined,
        leadScore: form.leadScore ? form.leadScore : undefined,
      }),
    });
    if (res.ok) {
      const newF = await res.json();
      setFollowUps((prev) => [newF, ...prev]);
      setShowForm(false);
      setSelectedLead(null);
      setSearchQuery("");
      setForm({ leadId: "", bookingId: "", type: "CALL", notes: "", outcome: "", nextAction: "", leadScore: 5, duration: "", reminderAt: "" });
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const lastOutcome = followUps.find((f) => f.outcome)?.outcome || null;
  const lastNextAction = followUps.find((f) => f.nextAction)?.nextAction || null;
  const selectedLeadScore = selectedLead?.leadScore || (followUps.length > 0 ? followUps[0]?.lead?.leadScore : null);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-gray-500">Track all customer interactions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Follow-up
        </Button>
      </div>

      {selectedLead && (
        <Card className="border shadow-sm bg-gradient-to-r from-gray-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedLead.name}</p>
                  <p className="text-xs text-gray-500">{selectedLead.phone || "No phone"}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Lead Score</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-lg font-bold text-amber-600">{selectedLeadScore ?? 0}</span>
                      <span className="text-xs text-gray-400">/100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Last Outcome</p>
                    {lastOutcome ? (
                      <Badge variant="outline" className={`mt-0.5 ${outcomeColors[lastOutcome] || ""}`}>
                        {lastOutcome.replace(/_/g, " ")}
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-400">—</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Next Action</p>
                    {lastNextAction ? (
                      <Badge variant="outline" className={`mt-0.5 ${nextActionColors[lastNextAction] || ""}`}>
                        {lastNextAction.replace(/_/g, " ")}
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-400">—</p>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={clearLead} className="text-xs text-gray-400 hover:text-gray-600 underline">Change</button>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">New Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedLead && (
              <div className="space-y-2">
                <Label>Search Lead</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {searchResults.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => selectLead(lead)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="font-medium">{lead.name}</span>
                          {lead.phone && <span className="text-gray-400 ml-2">{lead.phone}</span>}
                        </div>
                        <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {form.type === "CALL" && (
                <div className="space-y-2">
                  <Label>Call Duration (seconds)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 120"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Follow-up notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Outcome</Label>
                <select
                  value={form.outcome}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  {outcomeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Next Action</Label>
                <select
                  value={form.nextAction}
                  onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                  className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  {nextActionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lead Score: {form.leadScore}/10</Label>
              <Input
                type="range"
                min="1"
                max="10"
                value={form.leadScore}
                onChange={(e) => setForm({ ...form, leadScore: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reminder</Label>
              <Input
                type="datetime-local"
                value={form.reminderAt}
                onChange={(e) => setForm({ ...form, reminderAt: e.target.value })}
              />
            </div>

            <Button onClick={addFollowUp} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Save Follow-up
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : followUps.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <PhoneCall className="h-16 w-16 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500">No follow-ups recorded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {followUps.map((fu) => {
            const Icon = typeIcons[fu.type] || PhoneCall;
            return (
              <Card key={fu.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[fu.type]?.split(" ")[0] || "bg-gray-100"}`}>
                    <Icon className={`h-5 w-5 ${typeColors[fu.type]?.split(" ")[1] || "text-gray-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{fu.type}</span>
                      <span className="text-xs text-gray-400">by {fu.user.name}</span>
                      {fu.completedAt && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {fu.outcome && (
                        <Badge variant="outline" className={`text-xs ${outcomeColors[fu.outcome] || ""}`}>
                          {fu.outcome.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {fu.nextAction && fu.nextAction !== "NONE" && (
                        <Badge variant="outline" className={`text-xs ${nextActionColors[fu.nextAction] || ""}`}>
                          {fu.nextAction.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{fu.notes}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>{formatDateTime(fu.createdAt)}</span>
                      {fu.leadScore != null && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Target className="h-3 w-3" />
                          Score: {fu.leadScore}/10
                        </span>
                      )}
                      {fu.duration != null && (
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatDuration(fu.duration)}
                        </span>
                      )}
                      {fu.reminderAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Reminder: {formatDateTime(fu.reminderAt)}
                        </span>
                      )}
                      {fu.lead && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {fu.lead.name}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
