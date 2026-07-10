import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import { GenerateInvoiceDialog } from "../_components/finance-dialogs";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [invoices, bookings] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: { select: { bookingNumber: true } },
        customer: { select: { name: true } },
        payments: { select: { amount: true } },
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
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Generate and manage invoices</p>
        </div>
        <GenerateInvoiceDialog bookings={bookings} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Invoice#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Booking</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Subtotal</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">GST</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Total</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Paid</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">{inv.booking?.bookingNumber ?? "-"}</td>
                    <td className="py-3 px-4">{inv.customer?.name ?? "-"}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(inv.gst)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(inv.paidAmount)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        inv.status === "PAID" ? "default" :
                        inv.status === "PARTIALLY_PAID" ? "secondary" :
                        inv.status === "OVERDUE" ? "destructive" : "outline"
                      } className={
                        inv.status === "PAID" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                        inv.status === "OVERDUE" ? "bg-red-50 text-red-700" :
                        inv.status === "SENT" ? "bg-blue-50 text-blue-700" :
                        inv.status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" : ""
                      }>{inv.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : "-"}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={9} className="py-16 text-center text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No invoices yet</p>
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
