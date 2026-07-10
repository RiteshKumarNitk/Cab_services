import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, ArrowRight, Plane, Shield, Clock, MapPin, Users, Phone, CheckCircle } from "lucide-react";
import { getWebsiteSettings, getFeaturedFleetVehicles } from "@/lib/cms";

export default async function AirportPage() {
  const settings = await getWebsiteSettings();
  const vehicles = await getFeaturedFleetVehicles();
  const phone = settings?.phone_primary || "+917353019999";

  const features = [
    { icon: Plane, title: "Flight Tracking", desc: "We monitor your flight in real-time. If your flight is delayed, we adjust pickup accordingly." },
    { icon: Clock, title: "Free Waiting", desc: "60 minutes free waiting for domestic flights, 90 minutes for international flights." },
    { icon: Shield, title: "Meet & Greet", desc: "Our driver will meet you at the arrival gate with a name board for easy identification." },
    { icon: MapPin, title: "Fixed Pricing", desc: "No surge pricing. Fixed rates regardless of time or demand. What you see is what you pay." },
  ];

  const pricing = [
    { route: "Airport → City Center", price: "₹600", distance: "15 km" },
    { route: "Airport → Bani Park", price: "₹500", distance: "12 km" },
    { route: "Airport → Sitapura", price: "₹700", distance: "18 km" },
    { route: "Airport → Ajmer", price: "₹2,500", distance: "130 km" },
    { route: "Airport → Delhi", price: "₹5,500", distance: "280 km" },
    { route: "Airport → Udaipur", price: "₹7,000", distance: "400 km" },
  ];

  const howItWorks = [
    { step: "01", title: "Book & Share Flight Details", desc: "Enter your flight number and arrival time. We'll track your flight automatically." },
    { step: "02", title: "Driver Meets You at Arrivals", desc: "Our driver waits at the arrival gate with your name board. Free waiting included." },
    { step: "03", title: "Smooth Ride to Destination", desc: "Enjoy a comfortable ride to your destination. Pay securely after reaching." },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Jaipur Airport Cab Service</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto mb-8">Hassle-free pickup and drop at Jaipur International Airport. Flight tracking, free waiting, fixed pricing.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Book Airport Cab <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Book with Us?</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Stress-free airport transfers with premium service</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-red-50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="h-6 w-6 text-red-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Airport Transfer Pricing</h2>
            <p className="text-gray-500 mt-2">Fixed rates from Jaipur Airport (JAI)</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {pricing.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-red-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.route}</div>
                    <div className="text-xs text-gray-500">{item.distance}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{item.price}</div>
                  <Link href="/#booking-form" className="text-xs text-red-700 font-medium hover:underline">Book</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {vehicles.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Available for Airport Transfer</h2>
              <p className="text-gray-500 mt-2">Choose your preferred vehicle</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vehicles.slice(0, 4).map((v) => (
                <Link key={v.id} href={`/fleet/${v.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
                  <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {v.images?.[0] ? <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover rounded-lg" /> : <Car className="h-12 w-12 text-gray-300" />}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">{v.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.seats}</span>
                    {v.ac && <span className="flex items-center gap-1">AC</span>}
                  </div>
                  <div className="mt-3 text-red-700 font-bold">₹{v.pricePerKm}/km</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2">Airport transfer in 3 easy steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 rounded-full bg-red-700 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">{item.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-700 to-red-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Airport Transfer</h2>
          <p className="text-red-100 mb-8 text-lg">Fixed pricing, flight tracking, meet & greet service</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "Jaipur Airport Cab Service | " + (settings?.company_name || "Aradhana Travel"),
    description: "Book Jaipur Airport taxi at fixed prices. Flight tracking, free waiting, meet & greet. Available 24/7 for pickup and drop at JAI airport.",
  };
}
