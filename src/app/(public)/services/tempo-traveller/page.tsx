import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, ArrowRight, Users, Phone, Luggage, Snowflake, Shield, MapPin } from "lucide-react";
import { getWebsiteSettings } from "@/lib/cms";

export default async function TempoTravellerPage() {
  const settings = await getWebsiteSettings();
  const phone = settings?.phone_primary || "+917353019999";

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Tempo Traveller Rental</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto mb-8">Group travel made easy with 12 to 18-seater tempo travellers. Perfect for family trips, weddings, corporate outings, and group tours.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Book Tempo Traveller <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "12-18 Seater", desc: "Spacious seating for groups with ample legroom. Options available in 12, 15, and 18 seater configurations." },
              { icon: Luggage, title: "Large Luggage Space", desc: "Dedicated luggage area at the back. Perfect for group travel with bags, equipment, and supplies." },
              { icon: Snowflake, title: "Full AC", desc: "Powerful air conditioning with individual vent controls for each row of seats." },
              { icon: Shield, title: "Professional Driver", desc: "Experienced driver familiar with long-distance routes. Rest breaks included on extended journeys." },
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Ideal For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Family Reunions & Trips", desc: "Travel together with the whole family. No need for multiple cars." },
              { title: "Wedding Guest Transport", desc: "Shuttle guests between venues, hotels, and the wedding location." },
              { title: "Corporate Group Outings", desc: "Team offsites, picnics, and factory visits with the entire team." },
              { title: "School & College Trips", desc: "Safe group transport for educational tours and college excursions." },
              { title: "Temple & Pilgrimage Tours", desc: "Comfortable group travel for religious tours and pilgrimage circuits." },
              { title: "Airport Group Transfers", desc: "Cost-effective group transfers to and from the airport." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-700 mt-0.5 shrink-0" />
                <div><h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3><p className="text-xs text-gray-500 mt-0.5">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-700 to-red-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Book a Tempo Traveller</h2>
          <p className="text-red-100 mb-8 text-lg">Perfect for groups of 12-18 people. Comfortable, spacious, reliable.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Get Quote <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return { title: "Tempo Traveller Rental | " + (settings?.company_name || "Aradhana Travel"), description: "Rent tempo travellers for group travel. 12, 15, and 18 seater options available. Ideal for family trips, weddings, and corporate outings." };
}
