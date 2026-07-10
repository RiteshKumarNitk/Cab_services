import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Users, Route, Star, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function DriversReport({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();

  const totalDrivers = await prisma.user.count({ where: { role: "DRIVER" } });
  const activeDrivers = await prisma.user.count({
    where: { role: "DRIVER", driverStatus: { online: true } },
  });

  const totalTripsByDrivers = await prisma.trip.count({
    where: { createdAt: { gte: start, lte: end }, driverId: { not: null } },
  });
  const avgTripsPerDriver = totalDrivers > 0 ? (totalTripsByDrivers / totalDrivers).toFixed(1) : "0.0";

  const avgRatingResult = await prisma.rating.aggregate({
    where: { createdAt: { gte: start, lte: end } },
    _avg: { score: true },
  });
  const avgRating = avgRatingResult._avg.score ?? 0;

  const driverTripCounts = await prisma.trip.groupBy({
    by: ["driverId"],
    where: { createdAt: { gte: start, lte: end }, driverId: { not: null } },
    _count: true,
    orderBy: { _count: { driverId: "desc" } },
    take: 10,
  });

  const driverIds = driverTripCounts.map((d) => d.driverId).filter(Boolean) as string[];
  const driversWithNames = driverIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, name: true },
      })
    : [];
  const driverNameMap = new Map(driversWithNames.map((d) => [d.id, d.name]));

  const driverTripData = driverTripCounts.filter((d): d is typeof d & { driverId: string } => d.driverId !== null).map((d) => ({
    name: driverNameMap.get(d.driverId) ?? "Unknown",
    trips: d._count,
  }));

  const topRatedDrivers = await prisma.rating.groupBy({
    by: ["ratedId"],
    _avg: { score: true },
    _count: true,
    orderBy: { _avg: { score: "desc" } },
    where: { rated: { role: "DRIVER" } },
  });

  const ratedDriverIds = topRatedDrivers.map((d) => d.ratedId).filter(Boolean) as string[];
  const ratedDriversWithNames = ratedDriverIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: ratedDriverIds } },
        select: { id: true, name: true },
      })
    : [];
  const ratedDriverNameMap = new Map(ratedDriversWithNames.map((d) => [d.id, d.name]));

  const driverRatingData = topRatedDrivers.slice(0, 10).map((d) => ({
    name: ratedDriverNameMap.get(d.ratedId) ?? "Unknown",
    avgRating: d._avg.score?.toFixed(1) ?? "0.0",
    ratings: d._count,
  }));

  const maxTrips = Math.max(...driverTripData.map((d) => d.trips), 1);
  const noData = totalDrivers === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Driver Reports</h1>
        <p className="text-gray-500">Driver performance, trip history, earnings</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Drivers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalDrivers}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center"><Users className="h-5 w-5 text-teal-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Drivers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeDrivers}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Trips/Driver</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgTripsPerDriver}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Route className="h-5 w-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgRating.toFixed(1)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Star className="h-5 w-5 text-amber-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Top Drivers by Trips</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {driverTripData.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-gray-500">{item.trips} trips</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(item.trips / maxTrips) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Top Rated Drivers</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Driver</th>
                      <th className="pb-2 font-medium">Avg Rating</th>
                      <th className="pb-2 font-medium">Ratings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverRatingData.map((item) => (
                      <tr key={item.name} className="border-b last:border-0">
                        <td className="py-2 text-gray-900 font-medium">{item.name}</td>
                        <td className="py-2 text-gray-600">{item.avgRating}</td>
                        <td className="py-2 text-gray-600">{item.ratings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-6">
            <form action="/api/admin/reports/csv" method="POST">
              <input type="hidden" name="type" value="drivers" />
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
