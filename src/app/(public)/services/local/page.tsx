import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, ArrowRight, Clock, MapPin, Users, Shield, Phone, CheckCircle, Star, Camera } from "lucide-react";
import { getWebsiteSettings, getFeaturedFleetVehicles } from "@/lib/cms";

export default async function LocalPage() {
  const settings = await getWebsiteSettings();
  const vehicles = await getFeaturedFleetVehicles();
  const phone = settings?.phone_primary || "+917353019999";

  const packages = [
    { hours: "4", km: "40", price: "₹1,200", desc: "Ideal for local errands and short trips within the city" },
    { hours: "8", km: "80", price: "₹2,000", desc: "Perfect for half-day sightseeing and shopping trips" },
    { hours: "12", km: "120", price: "₹2,800", desc: "Full day exploration of Jaipur's attractions" },
  ];

  const popularTrips = [
    { title: "Amer Fort & City Palace", duration: "4 hrs", desc: "Visit the majestic Amer Fort followed by the City Palace" },
    { title: "Full Day Heritage Tour", duration: "8 hrs", desc: "Amer + Jaigarh + Nahargarh + City Palace + Hawa Mahal" },
    { title: "Shopping Experience", duration: "4 hrs", desc: "Bapu Bazaar, Johari Bazaar, and Chandpole Bazaar" },
  ];

  const howItWorks = [
    { step: "01", title: "Choose Your Package", desc: "Select from hourly rental packages that suit your itinerary." },
    { step: "02", title: "Explore at Your Pace", desc: "Customize your route, make unlimited stops within city limits." },
    { step: "03", title: "Pay & Complete", desc: "Pay for the package at the end. Extra km/hr charges apply beyond package." },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Local Cab Rental in Jaipur</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto mb-8">Explore Jaipur at your own pace with flexible hourly rental packages. Book by the hour, not by the trip.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Book Local Cab <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Local Rental Packages</h2>
            <p className="text-gray-500 mt-2">Flexible hourly packages for every need</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg, i) => (
              <div key={i} className={`rounded-2xl p-8 text-center border-2 transition-shadow hover:shadow-lg ${i === 1 ? "border-red-700 bg-red-50" : "border-gray-100 bg-white"}`}>
                {i === 1 && <div className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full inline-block mb-3">Most Popular</div>}
                <Clock className="h-10 w-10 text-red-700 mx-auto mb-4" />
                <h3 className="text-4xl font-bold text-gray-900 mb-2">{pkg.hours} <span className="text-lg font-normal text-gray-500">hours</span></h3>
                <div className="text-gray-500 text-sm mb-2">{pkg.km} km included</div>
                <div className="text-3xl font-bold text-red-700 mb-4">{pkg.price}</div>
                <p className="text-sm text-gray-500 mb-6">{pkg.desc}</p>
                <Link href="/#booking-form"><Button className={`w-full ${i === 1 ? "bg-red-700 hover:bg-red-800" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>Book Now</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Popular Local Trips</h2>
            <p className="text-gray-500 mt-2">Explore Jaipur's best attractions with our cabs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {popularTrips.map((trip, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{trip.title}</h3>
                <div className="flex items-center gap-1 text-sm text-amber-600 font-medium mb-2"><Clock className="h-3.5 w-3.5" /> {trip.duration}</div>
                <p className="text-sm text-gray-500">{trip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {vehicles.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Available for Local Rental</h2>
              <p className="text-gray-500 mt-2">Choose the perfect vehicle for city travel</p>
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
            <p className="text-gray-500 mt-2">Local rental in 3 simple steps</p>
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
          <h2 className="text-3xl font-bold mb-4">Book Your Local Cab Now</h2>
          <p className="text-red-100 mb-8 text-lg">Flexible hourly packages starting at ₹1,200</p>
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
    title: "Local Cab Rental in Jaipur | " + (settings?.company_name || "Aradhana Travel"),
    description: "Book local cabs in Jaipur at hourly packages. 4hr/40km at ₹1,200, 8hr/80km at ₹2,000. Explore Jaipur at your own pace with flexible rentals.",
  };
}
