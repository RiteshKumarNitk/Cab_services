import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { destinations } from "@/lib/destinations";

export default function DestinationsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Destinations</h1>
          <p className="text-lg text-red-100 max-w-2xl mx-auto">
            Explore the majestic cities of Rajasthan with our premium cab service
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((city) => (
            <Link key={city.slug} href={`/destinations/${city.slug}`} className="group block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {city.hero ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                      style={{ backgroundImage: `url(${city.hero})` }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-amber-50">
                      <MapPin className="h-12 w-12 text-red-300" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <MapPin className="text-red-700 h-4 w-4" /> {city.title.split("—")[0].trim()}
                  </h2>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{city.tagline}</p>
                  <div className="flex items-center text-sm text-gray-400 gap-3 mb-3">
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {city.attractions.length} Attractions</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {city.packages.length} Packages</span>
                  </div>
                  <span className="text-red-700 text-sm font-medium flex items-center group-hover:gap-2 transition-all">
                    Explore {city.title.split("—")[0].trim()} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Destinations | Aradhana Travel",
    description: "Explore Rajasthan's top destinations with Aradhana Travel — Jaipur, Udaipur, Jaisalmer, Jodhpur and more. Book cabs and tour packages.",
  };
}
