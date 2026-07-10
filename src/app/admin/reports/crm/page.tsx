import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, BarChart3, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string; source?: string }>;
}

export default async function CrmReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;
  const source = params.source;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();

  const dateFilter = { createdAt: { gte: start, lte: end } };
  const where = source ? { ...dateFilter, source } : dateFilter;

  const totalLeads = await prisma.lead.count({ where });
  const wonLeads = await prisma.lead.count({ where: { ...where, status: "WON" } });
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  const convertedLeads = await prisma.lead.findMany({
    where: { ...where, convertedAt: { not: null } },
    select: { createdAt: true, convertedAt: true },
  });
  const avgDays = convertedLeads.length > 0
    ? (convertedLeads.reduce((sum, l) => {
        const diff = l.convertedAt!.getTime() - l.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0) / convertedLeads.length).toFixed(1)
    : "0.0";

  const leadsBySource = await prisma.lead.groupBy({
    by: ["source"],
    where: dateFilter,
    _count: true,
    orderBy: { _count: { source: "desc" } },
  });

  const leadsByStatus = await prisma.lead.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: true,
    orderBy: { _count: { status: "desc" } },
  });

  const sources = await prisma.lead.findMany({ distinct: ["source"], select: { source: true } });
  const maxSourceCount = Math.max(...leadsBySource.map((s) => s._count), 1);

  const noData = totalLeads === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CRM Reports</h1>
        <p className="text-gray-500">Lead conversion, pipeline analysis, source tracking</p>
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
              <select name="source" defaultValue={source ?? ""} className="border rounded px-3 py-1.5 text-sm">
                <option value="">All Sources</option>
                {sources.map((s) => (
                  <option key={s.source} value={s.source}>{s.source}</option>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalLeads.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{conversionRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Days to Close</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgDays}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="h-5 w-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Leads by Source</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{leadsBySource.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-amber-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Leads by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadsByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.status}</span>
                        <span className="text-gray-500">{item._count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item._count / totalLeads) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Top Lead Sources</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadsBySource.slice(0, 5).map((item) => (
                    <div key={item.source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.source}</span>
                        <span className="text-gray-500">{item._count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(item._count / maxSourceCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="crm" />
              <input type="hidden" name="startDate" value={startDate ?? ""} />
              <input type="hidden" name="endDate" value={endDate ?? ""} />
              <input type="hidden" name="source" value={source ?? ""} />
              <button type="submit" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800"><Download className="h-4 w-4" /> Export CSV</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
