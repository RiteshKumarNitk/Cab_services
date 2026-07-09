import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DestinationsPage() {
  const destinations = [
    { name: "Jaipur", desc: "The famous Pink City, capital of Rajasthan, known for its majestic forts and vibrant culture.", image: "/images/jaipur_card.png", tag: "Popular" },
    { name: "Udaipur", desc: "The Venice of the East, known for its beautiful lakes and royal palaces.", image: "/images/udaipur_card.png", tag: "Romantic" },
    { name: "Jaisalmer", desc: "The Golden City surrounded by the Thar desert, known for its sandstone architecture.", image: "/images/jaisalmer_card.png", tag: "Adventure" },
    { name: "Jodhpur", desc: "The Blue City, famous for the mighty Mehrangarh Fort and blue painted houses.", image: "/images/jaipur_card.png", tag: "Heritage" },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-700 text-white py-16">
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
            <Link key={city.name} href={`/destinations/${city.name.toLowerCase()}`} className="group block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url(${city.image})` }}
                  />
                  {city.tag && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {city.tag}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <MapPin className="text-red-600 h-4 w-4" /> {city.name}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{city.desc}</p>
                  <span className="text-red-600 text-sm font-medium flex items-center group-hover:gap-2 transition-all">
                    Explore {city.name} <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
