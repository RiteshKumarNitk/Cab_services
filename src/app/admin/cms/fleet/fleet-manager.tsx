"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { saveVehicle, deleteVehicle } from "@/lib/admin-cms";
import { Plus, Pencil, Trash2, Eye, Car, Star } from "lucide-react";
import Link from "next/link";

type VehicleData = {
  id: string;
  name: string;
  slug: string | null;
  model: string;
  plateNumber: string;
  type: string;
  seats: number;
  luggage: number;
  ac: boolean;
  fuelType: string;
  transmission: string;
  pricePerKm: number;
  minKmPerDay: number;
  nightCharge: number;
  shortDescription: string | null;
  longDescription: string | null;
  features: string[];
  images: string[];
  isFeatured: boolean;
  displayOrder: number;
  seoTitle: string | null;
  seoDesc: string | null;
  isActive: boolean;
};

export function FleetManager({ vehicles: initial }: { vehicles: VehicleData[] }) {
  const [vehicles, setVehicles] = useState(initial);
  const [editVehicle, setEditVehicle] = useState<VehicleData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editVehicle?.id || null;
    try {
      const result = await saveVehicle(id, formData);
      if (result.success) {
        toast.success(editVehicle ? "Vehicle updated" : "Vehicle created");
        setDialogOpen(false);
        setEditVehicle(null);
      }
    } catch {
      toast.error("Failed to save vehicle");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vehicle deleted");
    } catch {
      toast.error("Failed to delete vehicle");
    }
  };

  const openCreate = () => {
    setEditVehicle(null);
    setDialogOpen(true);
  };

  const openEdit = (v: VehicleData) => {
    setEditVehicle(v);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (open && !editVehicle) setEditVehicle(null);
          }}
        >
          <DialogTrigger
            render={
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> Add Vehicle
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vehicle Name (Display)</Label>
                  <Input id="name" name="name" defaultValue={editVehicle?.name || ""} placeholder="e.g. Toyota Innova Crysta" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" defaultValue={editVehicle?.slug || ""} placeholder="e.g. innova-crysta" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Category</Label>
                  <Select name="type" defaultValue={editVehicle?.type || "SEDAN"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEDAN">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                      <SelectItem value="TEMPO_TRAVELLER">Tempo Traveller</SelectItem>
                      <SelectItem value="LUXURY">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Seats</Label>
                  <Input id="seats" name="seats" type="number" defaultValue={editVehicle?.seats || 4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="luggage">Luggage</Label>
                  <Input id="luggage" name="luggage" type="number" defaultValue={editVehicle?.luggage || 2} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select name="fuelType" defaultValue={editVehicle?.fuelType || "DIESEL"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PETROL">Petrol</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="CNG">CNG</SelectItem>
                      <SelectItem value="EV">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Select name="transmission" defaultValue={editVehicle?.transmission || "MANUAL"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="AUTO">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch id="ac" name="ac" defaultChecked={editVehicle?.ac ?? true} />
                  <Label htmlFor="ac">AC Available</Label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerKm">Price Per KM (₹)</Label>
                    <Input id="pricePerKm" name="pricePerKm" type="number" step="0.01" defaultValue={editVehicle?.pricePerKm || 0} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minKmPerDay">Minimum KM</Label>
                    <Input id="minKmPerDay" name="minKmPerDay" type="number" step="0.01" defaultValue={editVehicle?.minKmPerDay || 0} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nightCharge">Night Charges (₹)</Label>
                    <Input id="nightCharge" name="nightCharge" type="number" step="0.01" defaultValue={editVehicle?.nightCharge || 0} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Description</h3>
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea id="shortDescription" name="shortDescription" defaultValue={editVehicle?.shortDescription || ""} rows={2} />
                </div>
                <div className="space-y-2 mt-3">
                  <Label htmlFor="longDescription">Long Description</Label>
                  <Textarea id="longDescription" name="longDescription" defaultValue={editVehicle?.longDescription || ""} rows={4} />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Features (one per line)</h3>
                <Textarea id="features" name="features" defaultValue={(editVehicle?.features || []).join("\n")} rows={4} placeholder="GPS Tracking&#10;Music System&#10;Pushback Seats&#10;Charging Points" />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Images (one URL per line)</h3>
                <Textarea id="images" name="images" defaultValue={(editVehicle?.images || []).join("\n")} rows={3} placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Status & Display</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="isFeatured" name="isFeatured" defaultChecked={editVehicle?.isFeatured || false} />
                    <Label htmlFor="isFeatured">Featured Vehicle</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input id="displayOrder" name="displayOrder" type="number" defaultValue={editVehicle?.displayOrder || 0} />
                  </div>
                </div>
              </div>

              <details className="border rounded-lg p-4">
                <summary className="text-sm font-medium cursor-pointer">SEO & Advanced</summary>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model (internal)</Label>
                    <Input id="model" name="model" defaultValue={editVehicle?.model || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input id="seoTitle" name="seoTitle" defaultValue={editVehicle?.seoTitle || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoDesc">SEO Description</Label>
                    <Textarea id="seoDesc" name="seoDesc" defaultValue={editVehicle?.seoDesc || ""} rows={2} />
                  </div>
                </div>
              </details>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                {editVehicle ? "Update Vehicle" : "Create Vehicle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles.map((v) => (
          <Card key={v.id} className="border-0 shadow-md overflow-hidden">
            <div className="flex h-full">
              {v.images?.length > 0 && (
                <div className="w-48 shrink-0 bg-gray-100">
                  <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{v.name}</h3>
                    <p className="text-xs text-gray-500">{v.type} &middot; {v.seats} seats</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {v.isFeatured && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-amber-600 font-bold">₹{v.pricePerKm}/km</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/fleet/${v.slug}`} target="_blank">
                    <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {vehicles.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Car className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p>No vehicles in fleet yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
