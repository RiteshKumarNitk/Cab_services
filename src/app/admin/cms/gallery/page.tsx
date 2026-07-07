import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GalleryManager } from "./gallery-manager";

export default async function GalleryPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const items = await prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
        <p className="text-gray-500">Manage images and media</p>
      </div>
      <GalleryManager items={JSON.parse(JSON.stringify(items))} categories={categories} />
    </div>
  );
}
