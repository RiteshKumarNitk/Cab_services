"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/hooks";
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
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserForm extends Record<string, unknown> {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

const defaultForm: UserForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "CUSTOMER",
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: users, isLoading } = useAdminUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    data: UserForm;
  } | null>(null);
  const [form, setForm] = useState<UserForm>(defaultForm);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await updateUser.mutateAsync({
        id: editingUser.id,
        data: form,
      });
    } else {
      await createUser.mutateAsync(form);
    }
    setDialogOpen(false);
    setEditingUser(null);
    setForm(defaultForm);
  };

  const handleEdit = (user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  }) => {
    setEditingUser({
      id: user.id,
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        password: "",
        role: user.role,
      },
    });
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 mt-1">
            Create, edit, and manage system users
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button
              onClick={() => {
                setEditingUser(null);
                setForm(defaultForm);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create User"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser && "(leave blank to keep)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm({ ...form, role: value ?? "CUSTOMER" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) &&
                  users.map((user: {
                    id: string;
                    name: string;
                    email: string;
                    phone: string | null;
                    role: string;
                    driverStatus: { online: boolean } | null;
                    createdAt: string;
                  }) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.phone || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            user.role === "ADMIN"
                              ? "default"
                              : user.role === "DRIVER"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          <UserCog className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {user.role === "DRIVER" && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.driverStatus?.online
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.driverStatus?.online
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />
                            {user.driverStatus?.online ? "Online" : "Offline"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
