import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, ArrowRight, Shield, Clock, MapPin, Users, Star, Phone, CheckCircle } from "lucide-react";
import { getWebsiteSettings, getFeaturedFleetVehicles } from "@/lib/cms";

export default async function OutstationPage() {
  const settings = await getWebsiteSettings();
  const vehicles = await getFeaturedFleetVehicles();
  const phone = settings?.phone_primary || "+917353019999";

  const popularRoutes = [
    { from: "Jaipur", to: "Delhi", distance: "280 km", duration: "5 hrs", price: "₹3,500" },
    { from: "Jaipur", to: "Agra", distance: "240 km", duration: "4 hrs", price: "₹2,800" },
    { from: "Jaipur", to: "Udaipur", distance: "400 km", duration: "6 hrs", price: "₹5,500" },
    { from: "Jaipur", to: "Jodhpur", distance: "350 km", duration: "5.5 hrs", price: "₹4,500" },
    { from: "Jaipur", to: "Jaisalmer", distance: "640 km", duration: "9 hrs", price: "₹7,500" },
    { from: "Jaipur", to: "Ajmer", distance: "130 km", duration: "2 hrs", price: "₹1,800" },
  ];

  const features = [
    { icon: CheckCircle, title: "One-Way & Round-Trip", desc: "Flexible booking options to suit your travel needs. Pay only for the distance you travel." },
    { icon: Shield, title: "Professional Drivers", desc: "Experienced, verified drivers who know the routes. Safe driving with regular rest breaks on long trips." },
    { icon: Clock, title: "Clean & Sanitized Vehicles", desc: "All vehicles are thoroughly cleaned and sanitized before every trip for your safety." },
    { icon: MapPin, title: "Transparent Pricing", desc: "No hidden charges. The price you see is the price you pay. Toll, state tax, and parking included." },
  ];

  const howItWorks = [
    { step: "01", title: "Book Your Cab", desc: "Choose your pickup and drop locations, date, and vehicle type. Get an instant quote." },
    { step: "02", title: "Travel Comfortably", desc: "Our driver will pick you up on time. Track your journey live and enjoy a comfortable ride." },
    { step: "03", title: "Pay & Review", desc: "Pay securely via cash, UPI, or card. Share your experience with a review." },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Rajasthan Outstation Cab Service</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto mb-8">Safe, comfortable intercity travel across Rajasthan. Book one-way or round trips at transparent prices.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Book Online <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What We Offer</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Everything you need for a hassle-free outstation journey</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Popular Outstation Routes</h2>
            <p className="text-gray-500 mt-2">Most booked intercity routes from Jaipur</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.map((route, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-red-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <span>{route.from}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    <span>{route.to}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{route.distance}</span>
                    <span>•</span>
                    <span>{route.duration}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900">{route.price}</div>
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
              <h2 className="text-3xl font-bold text-gray-900">Fleet Available for Outstation</h2>
              <p className="text-gray-500 mt-2">Choose the perfect vehicle for your journey</p>
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
            <p className="text-gray-500 mt-2">Book your outstation cab in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center relative">
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
          <h2 className="text-3xl font-bold mb-4">Book Your Outstation Cab Now</h2>
          <p className="text-red-100 mb-8 text-lg">Get instant quote and confirm your booking in minutes</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Get Free Quote <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "Outstation Cab Service | " + (settings?.company_name || "Aradhana Travel"),
    description: "Book outstation cabs from Jaipur to Delhi, Agra, Udaipur, Jodhpur and more. Safe intercity travel with transparent pricing. One-way & round trips available.",
  };
}
