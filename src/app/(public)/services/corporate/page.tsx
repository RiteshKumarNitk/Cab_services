import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, ArrowRight, Shield, Users, Phone, CheckCircle, Briefcase, CreditCard, HeadphonesIcon } from "lucide-react";
import { getWebsiteSettings, getFeaturedFleetVehicles } from "@/lib/cms";

export default async function CorporatePage() {
  const settings = await getWebsiteSettings();
  const vehicles = await getFeaturedFleetVehicles();
  const phone = settings?.phone_primary || "+917353019999";

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Corporate Travel Solutions</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto mb-8">Dedicated fleet for corporate clients with monthly billing, priority support, and customized travel solutions.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Talk to Sales</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Enquire Now <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Briefcase, title: "Dedicated Fleet", desc: "Reserved vehicles for your organization. Consistent quality and availability." },
              { icon: CreditCard, title: "Monthly Billing", desc: " Consolidated monthly invoices with detailed trip reports. Net payment terms available." },
              { icon: HeadphonesIcon, title: "Priority Support", desc: "Dedicated account manager and 24/7 priority helpline for all corporate bookings." },
              { icon: Shield, title: "Safety Compliant", desc: "GPS-tracked vehicles, verified drivers, and comprehensive insurance coverage." },
            ].map((f, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-red-50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><f.icon className="h-6 w-6 text-red-700" /></div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Why Corporates Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Employee Transport", desc: "Safe and reliable daily commute for your employees with real-time tracking and automated scheduling." },
              { title: "Client Pickups", desc: "Premium vehicle options for client airport transfers and executive movements with meet-and-greet." },
              { title: "Event Transport", desc: "Group transportation for conferences, team outings, and corporate events with fleet coordination." },
              { title: "Travel Desk", desc: "End-to-end travel management with online booking portal, approvals workflow, and MIS reports." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-700 to-red-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Set Up Corporate Account</h2>
          <p className="text-red-100 mb-8 text-lg">Dedicated fleet, monthly billing, priority support</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Sales</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Enquire Now <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return { title: "Corporate Cab Service | " + (settings?.company_name || "Aradhana Travel"), description: "Corporate travel solutions with dedicated fleet, monthly billing, priority support, and customized employee transport." };
}
