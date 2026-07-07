import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function CMSSettingsPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const settings = await prisma.websiteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
        <p className="text-gray-500">Manage all global website settings</p>
      </div>
      <SettingsForm settings={settingsMap} />
    </div>
  );
}
