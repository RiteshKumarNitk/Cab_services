import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FAQsManager } from "./faqs-manager";

export default async function FAQsPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const faqs = await prisma.fAQ.findMany({
    include: { category: true },
    orderBy: { sortOrder: "asc" },
  });
  const categories = await prisma.fAQCategory.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
        <p className="text-gray-500">Manage frequently asked questions</p>
      </div>
      <FAQsManager faqs={JSON.parse(JSON.stringify(faqs))} categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
