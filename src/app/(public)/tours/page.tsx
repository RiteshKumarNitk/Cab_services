import Link from "next/link";
import { Clock, Map, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-orange-50/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Rajasthan Tour Packages</h1>
        <p className="text-xl text-gray-600 mb-12">Carefully crafted itineraries for unforgettable journeys.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {tours.map((tour, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col sm:flex-row">
              <div className="bg-amber-100 sm:w-1/3 flex items-center justify-center p-8">
                <Map className="h-16 w-16 text-amber-600 opacity-50" />
              </div>
              <div className="p-6 sm:w-2/3 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{tour.title}</h2>
                  <p className="text-amber-700 font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {tour.duration}
                  </p>
                  <p className="text-gray-500 font-medium mb-3">{tour.places}</p>
                  <p className="text-gray-600 text-sm mb-4">{tour.desc}</p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                  <span className="text-xl font-bold text-gray-900">{tour.price}</span>
                  <Link href="/">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      Book <ArrowRight className="ml-2 h-4 w-4" />
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
