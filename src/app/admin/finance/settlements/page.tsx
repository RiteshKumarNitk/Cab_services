import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserCheck } from "lucide-react";
import { DriverSettlementDialog } from "../_components/finance-dialogs";

export default async function SettlementsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [settlements, drivers] = await Promise.all([
    prisma.settlement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { name: true, phone: true } },
        trip: { select: { id: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "DRIVER", isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Settlements</h1>
          <p className="text-gray-500 mt-1">Settle driver earnings and expenses</p>
        </div>
        <div className="flex gap-2">
          <DriverSettlementDialog drivers={drivers} />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Driver</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Trip</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Total Earnings</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Advance Paid</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Expenses</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Net Payable</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Created</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium">{s.driver.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{s.trip?.id?.slice(0, 8) ?? "-"}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(s.totalEarnings)}</td>
                    <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(s.advancePaid)}</td>
                    <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(s.expenses)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(s.netPayable)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        s.status === "PAID" ? "default" :
                        s.status === "PARTIALLY_PAID" ? "secondary" : "outline"
                      } className={
                        s.status === "PAID" ? "bg-emerald-50 text-emerald-700" :
                        s.status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700"
                      }>{s.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                    <UserCheck className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No settlements yet</p>
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
