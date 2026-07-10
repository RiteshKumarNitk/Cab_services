import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, TrendingUp, DollarSign, BadgePercent, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function SalesReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();
  const dateFilter = { createdAt: { gte: start, lte: end } };

  const totalQuotations = await prisma.quotation.count({ where: dateFilter });
  const approvedQuotations = await prisma.quotation.count({ where: { ...dateFilter, status: "APPROVED" } });
  const winRate = totalQuotations > 0 ? ((approvedQuotations / totalQuotations) * 100).toFixed(1) : "0.0";

  const avgResult = await prisma.quotation.aggregate({ where: dateFilter, _avg: { totalFare: true } });
  const avgQuoteValue = avgResult._avg.totalFare ?? 0;

  const revenueResult = await prisma.quotation.aggregate({
    where: { ...dateFilter, status: "APPROVED" },
    _sum: { totalFare: true },
  });
  const totalRevenue = revenueResult._sum.totalFare ?? 0;

  const quotationsByStatus = await prisma.quotation.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: true,
    orderBy: { _count: { status: "desc" } },
  });

  const winRateByVehicle = await prisma.quotation.groupBy({
    by: ["vehicleType"],
    where: dateFilter,
    _count: true,
  });

  const approvedByVehicle = await prisma.quotation.groupBy({
    by: ["vehicleType"],
    where: { ...dateFilter, status: "APPROVED" },
    _count: true,
  });

  const approvedMap = new Map(approvedByVehicle.map((a) => [a.vehicleType, a._count]));
  const vehicleTypes = winRateByVehicle.map((v) => ({
    type: v.vehicleType ?? "UNSPECIFIED",
    total: v._count,
    approved: approvedMap.get(v.vehicleType) ?? 0,
    rate: v._count > 0 ? (((approvedMap.get(v.vehicleType) ?? 0) / v._count) * 100).toFixed(1) : "0.0",
  }));

  const maxStatusCount = Math.max(...quotationsByStatus.map((s) => s._count), 1);
  const noData = totalQuotations === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <p className="text-gray-500">Quotation win rates, revenue by type, sales trends</p>
      </div>

      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input type="date" name="startDate" defaultValue={startDate ?? ""} className="border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input type="date" name="endDate" defaultValue={endDate ?? ""} className="border rounded px-3 py-1.5 text-sm" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Apply</button>
          </form>
        </CardContent>
      </Card>

      {noData ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-gray-400">No data for selected period</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quotations</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalQuotations.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><FileSpreadsheet className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{winRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Quote Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{avgQuoteValue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><BadgePercent className="h-5 w-5 text-amber-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Quotations by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quotationsByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.status}</span>
                        <span className="text-gray-500">{item._count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item._count / maxStatusCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Win Rate by Vehicle Type</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Vehicle Type</th>
                      <th className="pb-2 font-medium">Total</th>
                      <th className="pb-2 font-medium">Approved</th>
                      <th className="pb-2 font-medium">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleTypes.map((v) => (
                      <tr key={v.type} className="border-b last:border-0">
                        <td className="py-2 text-gray-900 font-medium">{v.type}</td>
                        <td className="py-2 text-gray-600">{v.total}</td>
                        <td className="py-2 text-gray-600">{v.approved}</td>
                        <td className="py-2 text-gray-600">{v.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="sales" />
              <input type="hidden" name="startDate" value={startDate ?? ""} />
              <input type="hidden" name="endDate" value={endDate ?? ""} />
              <button type="submit" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800"><Download className="h-4 w-4" /> Export CSV</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
