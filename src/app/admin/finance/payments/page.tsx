import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IndianRupee } from "lucide-react";
import { RecordPaymentDialog } from "../_components/finance-dialogs";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [payments, bookings] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { receivedAt: "desc" },
      include: {
        booking: { select: { bookingNumber: true } },
        customer: { select: { name: true } },
        receivedBy: { select: { name: true } },
      },
    }),
    prisma.booking.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, bookingNumber: true, fare: true, customer: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Manage advance payments, installments, and refunds</p>
        </div>
        <RecordPaymentDialog bookings={bookings} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Payment#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Booking#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Received By</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono text-xs">{p.paymentNumber}</td>
                    <td className="py-3 px-4">{p.booking?.bookingNumber ?? "-"}</td>
                    <td className="py-3 px-4">{p.customer?.name ?? "-"}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4"><Badge variant="secondary">{p.method}</Badge></td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.type === "REFUND" ? "bg-red-50 text-red-700" :
                        p.type === "ADVANCE" ? "bg-blue-50 text-blue-700" :
                        p.type === "FULL" ? "bg-emerald-50 text-emerald-700" :
                        "bg-purple-50 text-purple-700"
                      }`}>{p.type}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(p.receivedAt)}</td>
                    <td className="py-3 px-4 text-gray-500">{p.receivedBy?.name ?? "-"}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                    <IndianRupee className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No payments yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
