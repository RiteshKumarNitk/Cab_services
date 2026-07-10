"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAdminUsers } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Phone, Mail, Calendar, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");

  const customers = (Array.isArray(users) ? users.filter((u: { role: string }) => u.role === "CUSTOMER") : [])
    .filter((c: { name: string; email: string; phone: string | null }) =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
    );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/");
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">View and manage all registered customers</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-gray-200"
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-lg shadow-gray-200/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-gray-50 to-blue-50/50">
                    {["Customer", "Email", "Phone", "Bookings", "Joined", ""].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer: {
                    id: string;
                    name: string;
                    email: string;
                    phone: string | null;
                    profilePic: string | null;
                    _count: { bookingsAsCustomer: number };
                    createdAt: string;
                  }, index: number) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                            {customer.profilePic ? (
                              <img src={customer.profilePic} alt={customer.name} className="object-cover" />
                            ) : (
                              <AvatarFallback className="bg-red-50 text-red-700 text-sm font-semibold">
                                {customer.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium text-gray-900">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{customer.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{customer.phone || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium">
                          {customer._count.bookingsAsCustomer} bookings
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(customer.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="h-4 w-4 text-gray-300 inline" />
                      </td>
                    </motion.tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                        <p>{search ? "No customers match your search" : "No customers registered yet"}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
