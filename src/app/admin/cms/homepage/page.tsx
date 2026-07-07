import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HomepageBuilder } from "./homepage-builder";

export default async function HomepageCMSPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const sections = await prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Builder</h1>
        <p className="text-gray-500">Drag & drop sections to build your homepage</p>
      </div>
      <HomepageBuilder sections={JSON.parse(JSON.stringify(sections))} />
    </div>
  );
}
