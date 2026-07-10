"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Fuel, Calendar, Car, IndianRupee, Gauge } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface FuelEntryForm {
  vehicleId: string;
  date: string;
  liters: string;
  cost: string;
  fuelType: string;
  odometer: string;
  station: string;
  notes: string;
}

const defaultForm: FuelEntryForm = {
  vehicleId: "", date: new Date().toISOString().slice(0, 10),
  liters: "", cost: "", fuelType: "PETROL",
  odometer: "", station: "", notes: "",
};

export default function AdminFuelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; plateNumber: string; model: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FuelEntryForm>(defaultForm);

  const fetchData = async () => {
    try {
      const [entriesRes, vehiclesRes] = await Promise.all([
        fetch("/api/admin/expenses?type=FUEL"),
        fetch("/api/admin/vehicles"),
      ]);
      const entriesData = await entriesRes.json();
      const vehiclesData = await vehiclesRes.json();
      if (Array.isArray(entriesData)) setEntries(entriesData);
      if (Array.isArray(vehiclesData)) setVehicles(vehiclesData);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/admin/login"); return; }
    if (session?.user?.role !== "ADMIN") { router.push("/"); return; }
    fetchData();
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          type: "FUEL",
          amount: parseFloat(form.cost),
          description: `${form.liters}L ${form.fuelType} at ${form.station} (odo: ${form.odometer}km) - ${form.notes}`,
          date: form.date,
        }),
      });
      setDialogOpen(false);
      setForm(defaultForm);
      fetchData();
    } catch {}
  };

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Tracking</h1>
          <p className="text-gray-500 mt-1">Log and monitor fuel expenses across the fleet</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button onClick={() => setForm(defaultForm)}><Plus className="h-4 w-4 mr-2" /> Add Fuel Entry</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Fuel Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.plateNumber} - {v.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select value={form.fuelType} onValueChange={(v) => setForm({ ...form, fuelType: v ?? "PETROL" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PETROL">Petrol</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="CNG">CNG</SelectItem>
                      <SelectItem value="EV">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Liters</Label>
                  <Input type="number" step="0.1" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Cost (₹)</Label>
                  <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Odometer (km)</Label>
                  <Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <Input value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} placeholder="Fuel station name" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
              </div>
              <Button type="submit" className="w-full">Add Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.filter((e: Record<string, unknown>) => (e as Record<string, string>).type === "FUEL").map((entry: Record<string, unknown>, i: number) => {
          const e = entry as { id: string; amount: number; description: string; date: string; vehicle?: { plateNumber: string } };
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-sm">{e.vehicle?.plateNumber || "Unknown"}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(e.amount)}</div>
                  <p className="text-xs text-gray-500">{e.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {entries.filter((e: Record<string, unknown>) => (e as Record<string, string>).type === "FUEL").length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Fuel className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p>No fuel entries yet. Click "Add Fuel Entry" to log the first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
