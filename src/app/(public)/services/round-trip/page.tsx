import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, ArrowRight, Shield, Clock, MapPin, Users, Phone, CheckCircle, Luggage, RefreshCw } from "lucide-react";
import { getWebsiteSettings, getFeaturedFleetVehicles } from "@/lib/cms";

export default async function RoundTripPage() {
  const settings = await getWebsiteSettings();
  const vehicles = await getFeaturedFleetVehicles();
  const phone = settings?.phone_primary || "+917353019999";

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Round Trip Cab Service</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto mb-8">Book round trips with flexible timings, unlimited stops, and the best rates. Ideal for vacations and weekend getaways.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Book Round Trip <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: RefreshCw, title: "Round Trip Savings", desc: "Get 10% off on the return leg when you book a round trip. More savings on longer journeys." },
              { icon: Shield, title: "Same Driver Both Ways", desc: "Your driver stays with you for the entire trip. No need to coordinate with different drivers." },
              { icon: Clock, title: "Flexible Scheduling", desc: "Choose your own pickup and return times. Modify return timing with 2 hours notice." },
              { icon: MapPin, title: "Unlimited Stops En Route", desc: "Stop at attractions, restaurants, or rest areas during your journey — driver waits." },
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

      {vehicles.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12"><h2 className="text-3xl font-bold text-gray-900">Available for Round Trips</h2></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vehicles.slice(0, 4).map((v) => (
                <Link key={v.id} href={`/fleet/${v.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
                  <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {v.images?.[0] ? <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover rounded-lg" /> : <Car className="h-12 w-12 text-gray-300" />}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">{v.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.seats}</span>
                    <span className="flex items-center gap-1"><Luggage className="h-3 w-3" /> {v.luggage}</span>
                  </div>
                  <div className="mt-3 text-red-700 font-bold">₹{v.pricePerKm}/km</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-gradient-to-r from-red-700 to-red-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Round Trip</h2>
          <p className="text-red-100 mb-8 text-lg">Same driver, flexible schedule, unlimited stops</p>
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
  return { title: "Round Trip Cab | " + (settings?.company_name || "Aradhana Travel"), description: "Book round trip cabs with flexible scheduling. Same driver both ways, unlimited stops, and 10% off on return journey." };
}
