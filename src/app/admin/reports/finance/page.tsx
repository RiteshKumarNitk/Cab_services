import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, TrendingDown, Landmark, AlertTriangle, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function FinanceReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();
  const dateFilter = { createdAt: { gte: start, lte: end } };

  const totalRevenueResult = await prisma.invoice.aggregate({
    where: { ...dateFilter, status: "PAID" },
    _sum: { total: true },
  });
  const totalRevenue = totalRevenueResult._sum.total ?? 0;

  const totalExpensesResult = await prisma.expense.aggregate({
    where: { date: { gte: start, lte: end } },
    _sum: { amount: true },
  });
  const totalExpenses = totalExpensesResult._sum.amount ?? 0;

  const netProfit = totalRevenue - totalExpenses;

  const outstandingResult = await prisma.invoice.aggregate({
    where: { status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] } },
    _sum: { total: true },
  });
  const paidResult = await prisma.invoice.aggregate({
    where: { status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] } },
    _sum: { paidAmount: true },
  });
  const outstanding = (outstandingResult._sum.total ?? 0) - (paidResult._sum.paidAmount ?? 0);

  const allInvoices = await prisma.invoice.findMany({
    where: dateFilter,
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const revenueByMonthMap = new Map<string, number>();
  for (const inv of allInvoices) {
    const key = inv.createdAt.toISOString().slice(0, 7);
    revenueByMonthMap.set(key, (revenueByMonthMap.get(key) ?? 0) + (inv.total ?? 0));
  }
  const revenueByMonth = Array.from(revenueByMonthMap.entries()).slice(-12);
  const maxRevenue = Math.max(...revenueByMonth.map(([, v]) => v), 1);

  const expensesByCategory = await prisma.expense.groupBy({
    by: ["category"],
    where: { date: { gte: start, lte: end } },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
  });

  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { method: true, amount: true },
  });
  const paymentTypeMap = new Map<string, { count: number; total: number }>();
  for (const p of payments) {
    const entry = paymentTypeMap.get(p.method) ?? { count: 0, total: 0 };
    entry.count++;
    entry.total += p.amount;
    paymentTypeMap.set(p.method, entry);
  }
  const paymentTypes = Array.from(paymentTypeMap.entries()).map(([method, data]) => ({
    method,
    count: data.count,
    total: data.total,
  }));

  const noData = allInvoices.length === 0 && payments.length === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance Reports</h1>
        <p className="text-gray-500">Revenue, expenses, profitability analysis</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><PiggyBank className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-red-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{netProfit.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Landmark className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{outstanding.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Revenue by Month</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueByMonth.map(([month, amount]) => (
                    <div key={month}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{month}</span>
                        <span className="text-gray-500">₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(amount / maxRevenue) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Count</th>
                      <th className="pb-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesByCategory.map((item) => (
                      <tr key={item.category} className="border-b last:border-0">
                        <td className="py-2 text-gray-900 font-medium">{item.category}</td>
                        <td className="py-2 text-gray-600">{item._count}</td>
                        <td className="py-2 text-gray-600">₹{(item._sum.amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm mb-6">
            <CardHeader><CardTitle>Payment Types</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Count</th>
                    <th className="pb-2 font-medium">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentTypes.map((item) => (
                    <tr key={item.method} className="border-b last:border-0">
                      <td className="py-2 text-gray-900 font-medium">{item.method}</td>
                      <td className="py-2 text-gray-600">{item.count}</td>
                      <td className="py-2 text-gray-600">₹{item.total.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="finance" />
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
