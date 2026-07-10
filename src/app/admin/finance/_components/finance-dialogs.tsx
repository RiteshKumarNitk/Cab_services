"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

interface BookingOption {
  id: string;
  bookingNumber: string;
  customer: { name: string } | null;
  fare: number;
}

interface VehicleOption {
  id: string;
  plateNumber: string;
}

interface DriverOption {
  id: string;
  name: string;
}

export function RecordPaymentDialog({
  bookings,
  onSuccess,
}: {
  bookings: BookingOption[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bookingId: "",
    amount: "",
    type: "ADVANCE",
    method: "CASH",
    reference: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      setOpen(false);
      setForm({ bookingId: "", amount: "", type: "ADVANCE", method: "CASH", reference: "", notes: "" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Record Payment</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Booking</Label>
            <Select value={form.bookingId} onValueChange={(v) => setForm({ ...form, bookingId: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select booking (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No booking</SelectItem>
                {bookings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.bookingNumber} - {b.customer?.name ?? "Unknown"} (₹{b.fare})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADVANCE">Advance</SelectItem>
                  <SelectItem value="FULL">Full Payment</SelectItem>
                  <SelectItem value="INSTALLMENT">Installment</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                  <SelectItem value="SECURITY_DEPOSIT">Security Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v ?? "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reference (optional)</Label>
            <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Transaction ID / Cheque No." />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GenerateInvoiceDialog({
  bookings,
  onSuccess,
}: {
  bookings: BookingOption[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bookingId: "",
    subtotal: "",
    gst: "",
    discount: "0",
    dueDate: "",
    notes: "",
  });

  const selectedBooking = bookings.find((b) => b.id === form.bookingId);
  const total = (parseFloat(form.subtotal) || 0) + (parseFloat(form.gst) || 0) - (parseFloat(form.discount) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        bookingId: form.bookingId || null,
        subtotal: parseFloat(form.subtotal) || 0,
        gst: parseFloat(form.gst) || 0,
        discount: parseFloat(form.discount) || 0,
        dueDate: form.dueDate || null,
        customerId: selectedBooking?.customer ? undefined : null,
        notes: form.notes || null,
      };
      if (selectedBooking?.customer?.name) {
        body.customerId = selectedBooking.customer.name;
      }
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to generate invoice");
      setOpen(false);
      setForm({ bookingId: "", subtotal: "", gst: "", discount: "0", dueDate: "", notes: "" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><Plus className="h-4 w-4 mr-2" />Generate Invoice</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Generate Invoice</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Booking *</Label>
            <Select value={form.bookingId} onValueChange={(v) => {
              const b = bookings.find((bk) => bk.id === v);
              setForm({
                ...form,
                bookingId: v ?? "",
                subtotal: b ? String(b.fare) : "",
                gst: b ? String(b.fare * 0.05) : "",
              });
            }}>
              <SelectTrigger><SelectValue placeholder="Select booking" /></SelectTrigger>
              <SelectContent>
                {bookings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.bookingNumber} - {b.customer?.name ?? "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Subtotal</Label>
              <Input type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>GST (5%)</Label>
              <Input type="number" step="0.01" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Discount</Label>
              <Input type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg flex justify-between text-sm font-medium">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LogExpenseDialog({
  vehicles,
  onSuccess,
}: {
  vehicles: VehicleOption[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "FUEL",
    vehicleId: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          vehicleId: form.vehicleId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to log expense");
      setOpen(false);
      setForm({ description: "", amount: "", category: "FUEL", vehicleId: "", notes: "", date: new Date().toISOString().split("T")[0] });
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><Plus className="h-4 w-4 mr-2" />Log Expense</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Log Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Fuel at Indian Oil" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUEL">Fuel</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="TOLL">Toll</SelectItem>
                  <SelectItem value="PARKING">Parking</SelectItem>
                  <SelectItem value="DRIVER_ALLOWANCE">Driver Allowance</SelectItem>
                  <SelectItem value="PERMIT">Permit</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No vehicle</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.plateNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DriverSettlementDialog({
  drivers,
  onSuccess,
}: {
  drivers: DriverOption[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    driverId: "",
    totalEarnings: "",
    advancePaid: "0",
    expenses: "0",
    notes: "",
  });

  const netPayable = (parseFloat(form.totalEarnings) || 0) - (parseFloat(form.advancePaid) || 0) - (parseFloat(form.expenses) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalEarnings: parseFloat(form.totalEarnings),
          advancePaid: parseFloat(form.advancePaid),
          expenses: parseFloat(form.expenses),
        }),
      });
      if (!res.ok) throw new Error("Failed to create settlement");
      setOpen(false);
      setForm({ driverId: "", totalEarnings: "", advancePaid: "0", expenses: "0", notes: "" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><Plus className="h-4 w-4 mr-2" />Driver Settlement</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Driver Settlement</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Driver *</Label>
            <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total Earnings</Label>
              <Input type="number" step="0.01" value={form.totalEarnings} onChange={(e) => setForm({ ...form, totalEarnings: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Advance Paid</Label>
              <Input type="number" step="0.01" value={form.advancePaid} onChange={(e) => setForm({ ...form, advancePaid: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Expenses</Label>
              <Input type="number" step="0.01" value={form.expenses} onChange={(e) => setForm({ ...form, expenses: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg flex justify-between text-sm font-medium">
            <span>Net Payable</span>
            <span className={netPayable < 0 ? "text-red-600" : "text-green-600"}>
              ₹{netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Settlement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
