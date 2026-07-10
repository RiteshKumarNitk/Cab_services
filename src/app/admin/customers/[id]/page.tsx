"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Calendar, Car, Clock, User } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function CustomerDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/admin/login"); return; }
    if (!params?.id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${params.id}`);
        const data = await res.json();
        setCustomer(data);
      } catch {} finally { setLoading(false); }
    })();
  }, [status, params?.id, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <User className="h-16 w-16 mx-auto mb-4 text-gray-200" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h2>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const c = customer as {
    id: string; name: string; email: string; phone: string | null;
    role: string; profilePic: string | null; createdAt: string;
    _count: { bookingsAsCustomer: number };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Customers
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-lg shadow-gray-200/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20 ring-4 ring-gray-100">
                {c.profilePic ? (
                  <img src={c.profilePic} alt={c.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-red-50 text-red-700 text-3xl font-semibold">
                    {c.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{c.name}</h1>
                    <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-700">{c.role}</Badge>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Customer since {formatDate(c.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mt-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="h-4 w-4" /> {c.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="h-4 w-4" /> {c.phone || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Car className="h-4 w-4" /> {c._count.bookingsAsCustomer} bookings
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="text-lg">Booking History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p>Booking history coming soon</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
