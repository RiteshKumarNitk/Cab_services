import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default async function StubPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");
  return (
    <div className="max-w-3xl mx-auto py-16 text-center">
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16">
          <Construction className="h-16 w-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-500">This module is under development</p>
        </CardContent>
      </Card>
    </div>
  );
}
