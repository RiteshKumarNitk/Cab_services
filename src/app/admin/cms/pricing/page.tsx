import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PricingManager } from "./pricing-manager";

export default async function PricingCMSPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"].includes(session.user?.role as string)) {
    redirect("/admin/login");
  }

  const pricingEntries = await prisma.pricing.findMany();
  const pricingPage = await prisma.pricingPage.findFirst();

  const vehicleTypes = ["SEDAN", "SUV", "HATCHBACK", "TEMPO_TRAVELLER", "LUXURY"];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <p className="text-gray-500">Manage fare rates, policies, and pricing page content</p>
      </div>
      <PricingManager
        pricingEntries={JSON.parse(JSON.stringify(pricingEntries))}
        pricingPage={JSON.parse(JSON.stringify(pricingPage))}
        vehicleTypes={vehicleTypes}
      />
    </div>
  );
}
