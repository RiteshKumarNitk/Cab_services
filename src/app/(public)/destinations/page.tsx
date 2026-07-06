import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export default function DestinationsPage() {
  const destinations = [
    { name: "Jaipur", desc: "The famous Pink City, capital of Rajasthan.", image: "/images/jaipur_card.png" },
    { name: "Udaipur", desc: "The Venice of the East, known for its beautiful lakes.", image: "/images/udaipur_card.png" },
    { name: "Jaisalmer", desc: "The Golden City surrounded by the Thar desert.", image: "/images/jaisalmer_card.png" },
  ];

  return (
    <div className="min-h-screen bg-orange-50/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Rajasthan Destinations</h1>
        <p className="text-xl text-gray-600 mb-12">Discover the majestic cities of the royal state.</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((city) => (
            <Link key={city.name} href={`/destinations/${city.name.toLowerCase()}`}>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                <div className="h-64 bg-gray-200 relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700" 
                    style={{ backgroundImage: `url(${city.image})` }} 
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <MapPin className="text-amber-600 h-5 w-5" /> {city.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{city.desc}</p>
                  <span className="text-amber-600 font-semibold flex items-center">
                    Explore {city.name} <ArrowRight className="ml-1 h-4 w-4" />
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
