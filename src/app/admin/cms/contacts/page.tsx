import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContactsManager } from "./contacts-manager";

export default async function ContactsPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "SUPPORT_EXECUTIVE"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
        <p className="text-gray-500">View messages from website visitors</p>
      </div>
      <ContactsManager submissions={JSON.parse(JSON.stringify(submissions))} />
    </div>
  );
}
