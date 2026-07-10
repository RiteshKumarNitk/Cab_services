"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Users, Phone, Mail, Car, MapPin, Clock, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DriverForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const defaultForm: DriverForm = { name: "", email: "", phone: "", password: "" };

export default function AdminDriversPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: users, isLoading } = useAdminUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<{ id: string; data: DriverForm } | null>(null);
  const [form, setForm] = useState<DriverForm>(defaultForm);

  const drivers = Array.isArray(users) ? users.filter((u: { role: string }) => u.role === "DRIVER") : [];

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/");
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriver) {
      await updateUser.mutateAsync({ id: editingDriver.id, data: form as unknown as Record<string, unknown> });
    } else {
      await createUser.mutateAsync({ ...form, role: "DRIVER" } as unknown as Record<string, unknown>);
    }
    setDialogOpen(false);
    setEditingDriver(null);
    setForm(defaultForm);
  };

  const handleEdit = (driver: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  }) => {
    setEditingDriver({
      id: driver.id,
      data: { name: driver.name, email: driver.email, phone: driver.phone || "", password: "" },
    });
    setForm({ name: driver.name, email: driver.email, phone: driver.phone || "", password: "" });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      await deleteUser.mutateAsync(id);
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Drivers</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage driver profiles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button onClick={() => { setEditingDriver(null); setForm(defaultForm); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Rahul Sharma" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="driver@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingDriver ? "New Password (leave blank to keep)" : "Password"}</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingDriver} placeholder="Min 6 characters" />
              </div>
              <Button type="submit" className="w-full">
                {editingDriver ? "Update Driver" : "Add Driver"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          profilePic: string | null;
          driverStatus: { online: boolean } | null;
          _count: { bookingsAsCustomer: number; bookingsAsDriver: number; driverVehicles: number };
          createdAt: string;
        }) => (
          <Card key={driver.id} className="border-0 shadow-lg shadow-gray-200/50 card-hover overflow-hidden">
            <div className={`h-1.5 ${driver.driverStatus?.online ? "bg-emerald-500" : "bg-gray-300"}`} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                    {driver.profilePic ? (
                      <img src={driver.profilePic} alt={driver.name} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-red-50 text-red-700 text-lg font-semibold">
                        {driver.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{driver.name}</CardTitle>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`h-2 w-2 rounded-full ${driver.driverStatus?.online ? "bg-emerald-500" : "bg-gray-400"}`} />
                      <span className={`text-xs font-medium ${driver.driverStatus?.online ? "text-emerald-600" : "text-gray-400"}`}>
                        {driver.driverStatus?.online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{driver.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{driver.phone || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg py-2 px-1">
                  <p className="text-lg font-bold text-gray-800">{driver._count.driverVehicles}</p>
                  <p className="text-[11px] text-gray-400">Vehicles</p>
                </div>
                <div className="bg-gray-50 rounded-lg py-2 px-1">
                  <p className="text-lg font-bold text-gray-800">{driver._count.bookingsAsDriver}</p>
                  <p className="text-[11px] text-gray-400">Trips</p>
                </div>
                <div className="bg-gray-50 rounded-lg py-2 px-1">
                  <p className="text-lg font-bold text-gray-800">{formatDate(driver.createdAt).slice(0, 5)}</p>
                  <p className="text-[11px] text-gray-400">Joined</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(driver)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700" onClick={() => handleDelete(driver.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {drivers.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-400 mb-1">No drivers added yet</p>
            <p className="text-sm">Click "Add Driver" to create the first driver profile</p>
          </div>
        )}
      </div>
    </div>
  );
}
