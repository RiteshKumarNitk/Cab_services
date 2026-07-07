import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PagesManager } from "./pages-manager";

export default async function PagesPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const pages = await prisma.staticPage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Static Pages</h1>
          <p className="text-gray-500">Manage About Us, Privacy Policy, and other static pages</p>
        </div>
      </div>
      <PagesManager pages={JSON.parse(JSON.stringify(pages))} />
    </div>
  );
}
