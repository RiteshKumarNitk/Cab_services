import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavigationManager } from "./navigation-manager";

export default async function NavigationPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const navigations = await prisma.navigation.findMany({
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const navs = navigations.map((nav) => ({
    ...nav,
    location: nav.location,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Navigation Manager</h1>
          <p className="text-gray-500">Manage header, footer, and sidebar menus</p>
        </div>
      </div>
      <NavigationManager navigations={JSON.parse(JSON.stringify(navs))} />
    </div>
  );
}
