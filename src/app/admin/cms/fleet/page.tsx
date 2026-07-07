import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FleetManager } from "./fleet-manager";

export default async function FleetPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "FLEET_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-500">Manage vehicles shown on the customer website</p>
      </div>
      <FleetManager vehicles={JSON.parse(JSON.stringify(vehicles))} />
    </div>
  );
}
