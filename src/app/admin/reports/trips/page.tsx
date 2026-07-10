import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, MapPin, Timer, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function TripsReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();
  const dateFilter = { createdAt: { gte: start, lte: end } };

  const totalTrips = await prisma.trip.count({ where: dateFilter });
  const completedTrips = await prisma.trip.count({ where: { ...dateFilter, status: "COMPLETED" } });

  const tripsWithTimes = await prisma.trip.findMany({
    where: { ...dateFilter, status: "COMPLETED", scheduledPickupTime: { not: null }, actualPickupTime: { not: null } },
    select: { scheduledPickupTime: true, actualPickupTime: true },
  });
  const onTime = tripsWithTimes.filter((t) => t.actualPickupTime! <= t.scheduledPickupTime!).length;
  const onTimeRate = tripsWithTimes.length > 0 ? ((onTime / tripsWithTimes.length) * 100).toFixed(1) : "0.0";

  const avgDistanceResult = await prisma.trip.aggregate({
    where: { ...dateFilter, actualDistance: { not: null } },
    _avg: { actualDistance: true },
  });
  const avgDistance = avgDistanceResult._avg.actualDistance ?? 0;

  const avgDurationResult = await prisma.booking.aggregate({
    where: { ...dateFilter, duration: { not: null } },
    _avg: { duration: true },
  });
  const avgDuration = avgDurationResult._avg.duration ?? 0;

  const tripsByStatus = await prisma.trip.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: true,
    orderBy: { _count: { status: "desc" } },
  });

  const tripsByVehicle = await prisma.trip.findMany({
    where: { ...dateFilter, vehicle: { isNot: null } },
    select: { vehicle: { select: { type: true } } },
  });
  const vehicleMap = new Map<string, number>();
  for (const t of tripsByVehicle) {
    const type = t.vehicle?.type ?? "UNKNOWN";
    vehicleMap.set(type, (vehicleMap.get(type) ?? 0) + 1);
  }
  const tripsByVehicleType = Array.from(vehicleMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const maxStatusCount = Math.max(...tripsByStatus.map((s) => s._count), 1);
  const maxVehicleCount = Math.max(...tripsByVehicleType.map((v) => v.count), 1);
  const noData = totalTrips === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trip Reports</h1>
        <p className="text-gray-500">Trip completion rates, on-time performance, distance trends</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalTrips.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center"><Truck className="h-5 w-5 text-orange-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{onTimeRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Clock className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Distance</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgDistance.toFixed(0)} km</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgDuration.toFixed(0)} min</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><Timer className="h-5 w-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Trips by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tripsByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.status}</span>
                        <span className="text-gray-500">{item._count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(item._count / maxStatusCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Trips by Vehicle Type</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tripsByVehicleType.map((item) => (
                    <div key={item.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.type}</span>
                        <span className="text-gray-500">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(item.count / maxVehicleCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="trips" />
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
