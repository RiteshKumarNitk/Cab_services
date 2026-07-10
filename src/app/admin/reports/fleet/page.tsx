import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Gauge, Wrench, Percent, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function FleetReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();
  const dateFilter = { createdAt: { gte: start, lte: end } };

  const totalVehicles = await prisma.vehicle.count();
  const availableVehicles = await prisma.vehicle.count({ where: { status: "AVAILABLE" } });
  const bookedVehicles = await prisma.vehicle.count({ where: { status: "BOOKED" } });
  const maintenanceVehicles = await prisma.vehicle.count({ where: { status: "MAINTENANCE" } });

  const utilizationRate = totalVehicles > 0 ? ((bookedVehicles / totalVehicles) * 100).toFixed(1) : "0.0";
  const availablePercent = totalVehicles > 0 ? ((availableVehicles / totalVehicles) * 100).toFixed(1) : "0.0";

  const maintenanceCostResult = await prisma.vehicleMaintenance.aggregate({
    where: { scheduledDate: { gte: start, lte: end } },
    _sum: { cost: true },
  });
  const maintenanceCost = maintenanceCostResult._sum.cost ?? 0;

  const vehicleStatusBreakdown = [
    { status: "AVAILABLE", count: availableVehicles },
    { status: "BOOKED", count: bookedVehicles },
    { status: "MAINTENANCE", count: maintenanceVehicles },
    { status: "INACTIVE", count: totalVehicles - availableVehicles - bookedVehicles - maintenanceVehicles },
  ].filter((v) => v.count > 0);

  const maintenanceByType = await prisma.vehicleMaintenance.groupBy({
    by: ["type"],
    where: { scheduledDate: { gte: start, lte: end } },
    _sum: { cost: true },
    _count: true,
    orderBy: { _sum: { cost: "desc" } },
  });

  const maxStatusCount = Math.max(...vehicleStatusBreakdown.map((s) => s.count), 1);
  const maxMaintCost = Math.max(...maintenanceByType.map((m) => m._sum.cost ?? 0), 1);
  const noData = totalVehicles === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Reports</h1>
        <p className="text-gray-500">Vehicle utilization, maintenance costs, downtime analysis</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Vehicles</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalVehicles}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center"><Car className="h-5 w-5 text-indigo-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{utilizationRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Gauge className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Cost</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{maintenanceCost.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><Wrench className="h-5 w-5 text-red-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available %</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{availablePercent}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Percent className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Vehicle Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicleStatusBreakdown.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.status}</span>
                        <span className="text-gray-500">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(item.count / maxStatusCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Maintenance by Type</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Count</th>
                      <th className="pb-2 font-medium">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceByType.map((item) => (
                      <tr key={item.type} className="border-b last:border-0">
                        <td className="py-2 text-gray-900 font-medium">{item.type}</td>
                        <td className="py-2 text-gray-600">{item._count}</td>
                        <td className="py-2 text-gray-600">₹{(item._sum.cost ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="fleet" />
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
