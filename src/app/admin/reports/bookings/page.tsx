import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, XCircle, DollarSign, CalendarDays, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string; status?: string }>;
}

export default async function BookingsReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;
  const status = params.status;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();
  const dateFilter = { createdAt: { gte: start, lte: end } as const };
  const statusFilter = status ? { status: status as any } : {};
  const where = { ...dateFilter, ...statusFilter };

  const totalBookings = await prisma.booking.count({ where: where as any });
  const cancelledBookings = await prisma.booking.count({ where: { ...where, status: "CANCELLED" } as any });
  const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : "0.0";

  const avgResult = await prisma.booking.aggregate({ where: where as any, _avg: { totalFare: true } });
  const avgBookingValue = avgResult._avg?.totalFare ?? 0;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const bookingsToday = await prisma.booking.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } });

  const bookingsByStatus = await prisma.booking.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: true,
    orderBy: { _count: { status: "desc" } },
  });

  const bookingsByType = await prisma.booking.groupBy({
    by: ["bookingType"],
    where: dateFilter,
    _count: true,
    orderBy: { _count: { bookingType: "desc" } },
  });

  const allBookings = await prisma.booking.findMany({
    where: dateFilter,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthlyMap = new Map<string, number>();
  for (const b of allBookings) {
    const key = b.createdAt.toISOString().slice(0, 7);
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }
  const monthlyTrend = Array.from(monthlyMap.entries()).slice(-12);
  const maxMonthly = Math.max(...monthlyTrend.map(([, c]) => c), 1);

  const statuses = await prisma.booking.findMany({ distinct: ["status"], select: { status: true } });
  const maxStatusCount = Math.max(...bookingsByStatus.map((s) => s._count), 1);
  const maxTypeCount = Math.max(...bookingsByType.map((t) => t._count), 1);
  const noData = totalBookings === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Reports</h1>
        <p className="text-gray-500">Booking patterns, cancellation analysis, peak periods</p>
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select name="status" defaultValue={status ?? ""} className="border rounded px-3 py-1.5 text-sm">
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s.status} value={s.status}>{s.status}</option>
                ))}
              </select>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalBookings.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><CalendarCheck className="h-5 w-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cancellation Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{cancellationRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><XCircle className="h-5 w-5 text-red-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Booking Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{avgBookingValue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings Today</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{bookingsToday}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookingsByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.status}</span>
                        <span className="text-gray-500">{item._count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(item._count / maxStatusCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Bookings by Type</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookingsByType.map((item) => (
                    <div key={item.bookingType}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.bookingType}</span>
                        <span className="text-gray-500">{item._count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(item._count / maxTypeCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm mb-6">
            <CardHeader><CardTitle>Monthly Booking Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {monthlyTrend.map(([month, count]) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{count}</span>
                    <div className="w-full bg-purple-200 rounded-t" style={{ height: `${(count / maxMonthly) * 100}%`, minHeight: count > 0 ? "4px" : "0" }} />
                    <span className="text-xs text-gray-500 -rotate-45 origin-left whitespace-nowrap">{month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="bookings" />
              <input type="hidden" name="startDate" value={startDate ?? ""} />
              <input type="hidden" name="endDate" value={endDate ?? ""} />
              <input type="hidden" name="status" value={status ?? ""} />
              <button type="submit" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800"><Download className="h-4 w-4" /> Export CSV</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
