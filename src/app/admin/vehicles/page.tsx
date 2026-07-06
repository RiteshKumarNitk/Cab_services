"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  useAdminVehicles,
  useAdminUsers,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Car } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface VehicleForm extends Record<string, unknown> {
  plateNumber: string;
  model: string;
  color: string;
  capacity: string;
  type: string;
  driverId: string;
}

const defaultForm: VehicleForm = {
  plateNumber: "",
  model: "",
  color: "",
  capacity: "4",
  type: "SEDAN",
  driverId: "",
};

export default function AdminVehiclesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: vehicles, isLoading } = useAdminVehicles();
  const { data: users } = useAdminUsers();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<{
    id: string;
    data: VehicleForm;
  } | null>(null);
  const [form, setForm] = useState<VehicleForm>(defaultForm);

  const drivers = Array.isArray(users)
    ? users.filter((u: { role: string }) => u.role === "DRIVER")
    : [];

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicle) {
      await updateVehicle.mutateAsync({
        id: editingVehicle.id,
        data: form,
      });
    } else {
      await createVehicle.mutateAsync(form);
    }
    setDialogOpen(false);
    setEditingVehicle(null);
    setForm(defaultForm);
  };

  const handleEdit = (vehicle: {
    id: string;
    plateNumber: string;
    model: string;
    color: string;
    capacity: number;
    type: string;
    driver: { id: string; name: string } | null;
  }) => {
    setEditingVehicle({
      id: vehicle.id,
      data: {
        plateNumber: vehicle.plateNumber,
        model: vehicle.model,
        color: vehicle.color,
        capacity: String(vehicle.capacity),
        type: vehicle.type,
        driverId: vehicle.driver?.id || "",
      },
    });
    setForm({
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      color: vehicle.color,
      capacity: String(vehicle.capacity),
      type: vehicle.type,
      driverId: vehicle.driver?.id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      await deleteVehicle.mutateAsync(id);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Vehicles
          </h1>
          <p className="text-gray-500 mt-1">
            Add, edit, and manage fleet vehicles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button
              onClick={() => {
                setEditingVehicle(null);
                setForm(defaultForm);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number</Label>
                <Input
                  id="plateNumber"
                  value={form.plateNumber}
                  onChange={(e) =>
                    setForm({ ...form, plateNumber: e.target.value })
                  }
                  required
                  placeholder="RJ-14-XX-XXXX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={form.model}
                    onChange={(e) =>
                      setForm({ ...form, model: e.target.value })
                    }
                    required
                    placeholder="e.g. Toyota Etios"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    required
                    placeholder="e.g. White"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm({ ...form, type: value ?? "SEDAN" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEDAN">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigned Driver</Label>
                <Select
                  value={form.driverId}
                  onValueChange={(value) =>
                    setForm({ ...form, driverId: value ?? "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No driver</SelectItem>
                    {drivers.map(
                      (driver: { id: string; name: string }) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(vehicles) &&
          vehicles.map(
            (vehicle: {
              id: string;
              plateNumber: string;
              model: string;
              color: string;
              capacity: number;
              type: string;
              isActive: boolean;
              driver: { id: string; name: string } | null;
              _count: { bookings: number };
              createdAt: string;
            }) => (
              <Card key={vehicle.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {vehicle.plateNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {vehicle.model} - {vehicle.color}
                      </p>
                    </div>
                    <Badge
                      variant={vehicle.isActive ? "default" : "secondary"}
                    >
                      {vehicle.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium">
                        {vehicle.type === "SEDAN" ? "Sedan" : "SUV"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Capacity</span>
                      <span className="font-medium">
                        {vehicle.capacity} seats
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Driver</span>
                      <span className="font-medium">
                        {vehicle.driver?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Bookings</span>
                      <span className="font-medium">
                        {vehicle._count.bookings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Added</span>
                      <span className="font-medium">
                        {formatDate(vehicle.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        {(!vehicles || (Array.isArray(vehicles) && vehicles.length === 0)) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No vehicles added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
