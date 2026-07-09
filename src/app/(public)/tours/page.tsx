import Link from "next/link";
import { Clock, Map, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ToursPage() {
  const tours = [
    {
      title: "Golden Triangle Tour",
      duration: "4 Days / 3 Nights",
      places: "Delhi - Agra - Jaipur",
      price: "From ₹12,500",
      desc: "Experience the rich heritage of India covering the capital, the Taj Mahal, and the Pink City."
    },
    {
      title: "Rajasthan Heritage Tour",
      duration: "7 Days / 6 Nights",
      places: "Jaipur - Jodhpur - Udaipur",
      price: "From ₹22,000",
      desc: "A royal journey through the majestic forts of Jaipur, the blue alleys of Jodhpur, and the lakes of Udaipur."
    },
    {
      title: "Desert Safari Special",
      duration: "5 Days / 4 Nights",
      places: "Jodhpur - Jaisalmer - Bikaner",
      price: "From ₹16,800",
      desc: "Explore the golden sands of the Thar desert, camel safaris, and ancient desert forts."
    },
    {
      title: "Wildlife Tour Package",
      duration: "3 Days / 2 Nights",
      places: "Jaipur - Ranthambore",
      price: "From ₹9,500",
      desc: "Thrilling tiger safaris in the famous Ranthambore National Park paired with a Jaipur city tour."
    },
    {
      title: "Jaipur Same Day Tour",
      duration: "1 Day",
      places: "Jaipur Local Sightseeing",
      price: "From ₹1,800",
      desc: "A complete 8-hour / 80km package covering all major monuments in Jaipur with a private cab."
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rajasthan Tour Packages</h1>
          <p className="text-lg text-red-100 max-w-2xl mx-auto">
            Carefully crafted itineraries for unforgettable journeys
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {tours.map((tour, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow">
              <div className="bg-red-100 sm:w-1/3 flex items-center justify-center p-6">
                <Map className="h-12 w-12 text-red-400" />
              </div>
              <div className="p-5 sm:w-2/3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">{tour.title}</h2>
                  </div>
                  <p className="text-red-600 font-medium text-sm mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {tour.duration}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">{tour.places}</p>
                  <p className="text-gray-600 text-sm mb-4">{tour.desc}</p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                  <span className="text-lg font-bold text-gray-900">{tour.price}</span>
                  <Link href="/">
                    <Button className="bg-red-600 hover:bg-red-700 text-white text-sm">
                      Book <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
