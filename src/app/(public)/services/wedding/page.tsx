import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, ArrowRight, Users, Phone, CheckCircle, Heart, Star, Gem, Sparkles } from "lucide-react";
import { getWebsiteSettings, getFeaturedFleetVehicles } from "@/lib/cms";

export default async function WeddingPage() {
  const settings = await getWebsiteSettings();
  const vehicles = await getFeaturedFleetVehicles();
  const phone = settings?.phone_primary || "+917353019999";

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-rose-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Wedding Car Rental</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto mb-8">Make your special day memorable with our premium wedding car fleet. Luxury cars, tempo travellers for guests, and everything in between.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Enquire for Wedding <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Gem, title: "Premium Fleet", desc: "Luxury sedans, SUVs, and vintage cars for the wedding party. Well-maintained and chauffeur-driven." },
              { icon: Users, title: "Guest Transport", desc: "Tempo travellers and mini-buses for guest pickup and drop across venues." },
              { icon: Heart, title: "Wedding Packages", desc: "Custom packages for the entire wedding duration — engagement, sangeet, wedding, and reception." },
              { icon: Star, title: "Decor Options", desc: "Car decoration with flowers, ribbons, and traditional embellishments as per your theme." },
            ].map((f, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-rose-50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4"><f.icon className="h-6 w-6 text-rose-600" /></div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Wedding Fleet Options</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Bride & Groom Car", models: "Mercedes E-Class, BMW 5 Series, Audi A6", price: "₹5,000 — ₹15,000" },
              { title: "Family & Wedding Party", models: "Toyota Innova, Hyundai Creta, SUV", price: "₹3,000 — ₹8,000" },
              { title: "Guest Transport", models: "Tempo Traveller (12-18 seater), Mini Bus", price: "₹8,000 — ₹20,000" },
            ].map((opt, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4"><Car className="h-5 w-5 text-rose-600" /></div>
                <h3 className="font-semibold text-gray-900 mb-2">{opt.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{opt.models}</p>
                <p className="text-lg font-bold text-rose-700">{opt.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-700 to-rose-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Plan Your Wedding Transport</h2>
          <p className="text-red-100 mb-8 text-lg">Premium cars, guest transport, decoration — all taken care of</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Get Wedding Quote <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return { title: "Wedding Car Rental | " + (settings?.company_name || "Aradhana Travel"), description: "Premium wedding car rental for your special day. Luxury sedans, SUVs, tempo travellers, and guest transport with decoration options." };
}
