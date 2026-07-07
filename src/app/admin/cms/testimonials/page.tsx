import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestimonialsManager } from "./testimonials-manager";

export default async function TestimonialsPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-gray-500">Manage customer reviews and testimonials</p>
      </div>
      <TestimonialsManager testimonials={JSON.parse(JSON.stringify(testimonials))} />
    </div>
  );
}
