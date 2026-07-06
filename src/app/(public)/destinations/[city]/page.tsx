import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

export default function CityGuidePage({ params }: { params: { city: string } }) {
  const cityStr = params.city.toLowerCase();
  
  const cityData: Record<string, { title: string, hero: string, desc: string, places: string[] }> = {
    jaipur: {
      title: "Jaipur - The Pink City",
      hero: "/images/jaipur_card.png",
      desc: "Jaipur is the capital of India’s Rajasthan state. It evokes the royal family that once ruled the region and that, in 1727, founded what is now called the Old City, or “Pink City” for its trademark building color.",
      places: ["Amer Fort", "Hawa Mahal", "City Palace", "Jantar Mantar"]
    },
    udaipur: {
      title: "Udaipur - City of Lakes",
      hero: "/images/udaipur_card.png",
      desc: "Udaipur, formerly the capital of the Mewar Kingdom, is a city in the western Indian state of Rajasthan. Founded by Maharana Udai Singh II in 1559, it's set around a series of artificial lakes and is known for its lavish royal residences.",
      places: ["City Palace", "Lake Pichola", "Jagmandir", "Saheliyon-ki-Bari"]
    },
    jaisalmer: {
      title: "Jaisalmer - The Golden City",
      hero: "/images/jaisalmer_card.png",
      desc: "Jaisalmer is a former medieval trading center and a princely state in the western Indian state of Rajasthan, in the heart of the Thar Desert. Known as the Golden City, it's distinguished by its yellow sandstone architecture.",
      places: ["Jaisalmer Fort", "Sam Sand Dunes", "Patwon Ki Haveli", "Gadisar Lake"]
    }
  };

  const data = cityData[cityStr];
  if (!data) return notFound();

  return (
    <div className="min-h-screen bg-white pb-16">
      <div 
        className="h-[50vh] bg-cover bg-center relative" 
        style={{ backgroundImage: `url(${data.hero})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white text-center drop-shadow-xl">{data.title}</h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <Link href="/destinations" className="text-amber-600 font-medium flex items-center mb-6 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Destinations
          </Link>
          <p className="text-xl text-gray-700 leading-relaxed mb-8">{data.desc}</p>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Top Places to Visit</h3>
          <ul className="space-y-3 mb-8">
            {data.places.map((place, i) => (
              <li key={i} className="flex items-center text-gray-700 text-lg">
                <MapPin className="h-5 w-5 text-amber-500 mr-3" /> {place}
              </li>
            ))}
          </ul>
          
          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-center">
            <h4 className="text-lg font-bold mb-2">Plan your trip to {cityStr.charAt(0).toUpperCase() + cityStr.slice(1)}</h4>
            <p className="text-gray-600 mb-4">Book a premium cab and explore the city comfortably.</p>
            <Link href="/">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">Book a Cab Now</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
