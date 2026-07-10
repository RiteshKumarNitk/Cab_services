"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";

const EVENT_TYPES = [
  "BOOKING_CREATED", "BOOKING_STATUS_CHANGED", "BOOKING_CANCELLED",
  "LEAD_CREATED", "LEAD_STATUS_CHANGED",
  "QUOTATION_CREATED", "QUOTATION_APPROVED", "QUOTATION_REJECTED",
  "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED",
  "DISPATCH_FINALIZED",
  "TRIP_STARTED", "TRIP_COMPLETED",
  "PAYMENT_RECEIVED", "INVOICE_GENERATED",
  "MAINTENANCE_SCHEDULED", "REMINDER_DUE",
] as const;

interface Webhook {
  id: string;
  url: string;
  secret: string | null;
  events: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const res = await fetch("/api/admin/webhooks");
      if (res.ok) setWebhooks(await res.json());
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!url) return;
    const res = await fetch("/api/admin/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret, events: selectedEvents }),
    });
    if (res.ok) {
      setOpen(false);
      setUrl("");
      setSecret("");
      setSelectedEvents([]);
      fetchWebhooks();
    }
  }

  async function handleToggle(webhook: Webhook) {
    await fetch("/api/admin/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: webhook.id, isActive: !webhook.isActive }),
    });
    fetchWebhooks();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook?")) return;
    await fetch("/api/admin/webhooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchWebhooks();
  }

  function toggleEvent(type: string) {
    setSelectedEvents((prev) =>
      prev.includes(type) ? prev.filter((e) => e !== type) : [...prev, type]
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <Label htmlFor="secret">Secret (optional)</Label>
                <Input
                  id="secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="HMAC signing secret"
                />
              </div>
              <div>
                <Label>Events (leave empty for all)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {EVENT_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedEvents.includes(type)}
                        onCheckedChange={() => toggleEvent(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No webhooks configured
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook) => {
                  const events = JSON.parse(webhook.events || "[]") as string[];
                  return (
                    <TableRow key={webhook.id}>
                      <TableCell className="max-w-[250px] truncate font-mono text-sm">
                        {webhook.url}
                      </TableCell>
                      <TableCell>
                        {events.length === 0 ? (
                          <Badge variant="outline">All events</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {events.slice(0, 3).map((e) => (
                              <Badge key={e} variant="secondary" className="text-xs">
                                {e}
                              </Badge>
                            ))}
                            {events.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{events.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {webhook.lastTriggeredAt
                          ? new Date(webhook.lastTriggeredAt).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={webhook.failureCount > 0 ? "text-red-500 font-medium" : ""}>
                          {webhook.failureCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggle(webhook)}
                            title={webhook.isActive ? "Deactivate" : "Activate"}
                          >
                            {webhook.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(webhook.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
