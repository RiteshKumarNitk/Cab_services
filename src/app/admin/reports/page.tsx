import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Users, FileSpreadsheet, CalendarCheck, Truck, Car, UserCheck, PiggyBank, TrendingUp, ArrowRight } from "lucide-react";

const reportModules = [
  { label: "CRM Reports", icon: Users, href: "/admin/reports/crm", desc: "Lead conversion, source analysis, pipeline", color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Sales Reports", icon: FileSpreadsheet, href: "/admin/reports/sales", desc: "Quotation win rate, revenue by type", color: "text-emerald-600", bg: "bg-emerald-100" },
  { label: "Booking Reports", icon: CalendarCheck, href: "/admin/reports/bookings", desc: "Booking trends, cancellation analysis", color: "text-purple-600", bg: "bg-purple-100" },
  { label: "Trip Reports", icon: Truck, href: "/admin/reports/trips", desc: "Trip completion, on-time performance", color: "text-orange-600", bg: "bg-orange-100" },
  { label: "Fleet Reports", icon: Car, href: "/admin/reports/fleet", desc: "Vehicle utilization, maintenance costs", color: "text-indigo-600", bg: "bg-indigo-100" },
  { label: "Driver Reports", icon: UserCheck, href: "/admin/reports/drivers", desc: "Driver performance, trip history", color: "text-teal-600", bg: "bg-teal-100" },
  { label: "Finance Reports", icon: PiggyBank, href: "/admin/reports/finance", desc: "Revenue, expenses, profit analysis", color: "text-red-600", bg: "bg-red-100" },
  { label: "Customer Analytics", icon: TrendingUp, href: "/admin/reports/customers", desc: "Customer retention, demographics", color: "text-amber-600", bg: "bg-amber-100" },
];

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
      <p className="text-gray-500 mb-8">Domain-specific analytics and insights</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportModules.map((m) => (
          <Link key={m.label} href={m.href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5">
                <div className={`h-10 w-10 rounded-lg ${m.bg} flex items-center justify-center mb-3`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{m.label}</h3>
                <p className="text-sm text-gray-500">{m.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
