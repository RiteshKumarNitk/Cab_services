import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, UserPlus, Repeat, DollarSign, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function CustomersReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();

  const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const newThisMonth = await prisma.user.count({
    where: { role: "CUSTOMER", createdAt: { gte: monthStart } },
  });

  const customersWithBookings = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      _count: { select: { bookingsAsCustomer: true } },
    },
  });
  const multiBookingCustomers = customersWithBookings.filter((c) => c._count.bookingsAsCustomer > 1).length;
  const repeatRate = totalCustomers > 0 ? ((multiBookingCustomers / totalCustomers) * 100).toFixed(1) : "0.0";

  const avgSpendResult = await prisma.booking.aggregate({
    where: { createdAt: { gte: start, lte: end } },
    _avg: { totalFare: true },
  });
  const avgSpend = avgSpendResult._avg.totalFare ?? 0;

  const topCustomers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      name: true,
      email: true,
      phone: true,
      bookingsAsCustomer: { select: { totalFare: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const customerSpend = topCustomers
    .map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      totalSpend: c.bookingsAsCustomer.reduce((s, b) => s + (b.totalFare ?? 0), 0),
      bookings: c.bookingsAsCustomer.length,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10);

  const maxCustomerSpend = Math.max(...customerSpend.map((c) => c.totalSpend), 1);
  const noData = totalCustomers === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Analytics</h1>
        <p className="text-gray-500">Customer retention, demographics, lifetime value</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalCustomers.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">New This Month</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{newThisMonth}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><UserPlus className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Repeat Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{repeatRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><Repeat className="h-5 w-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Spend</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{avgSpend.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm mb-6">
            <CardHeader><CardTitle>Top Customers by Spend</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customerSpend.map((item, i) => (
                  <div key={item.email}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{i + 1}. {item.name}</span>
                      <span className="text-gray-500">₹{item.totalSpend.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(item.totalSpend / maxCustomerSpend) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="customers" />
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
