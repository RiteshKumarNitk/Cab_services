import { getFleetVehicles, getWebsiteSettings } from "@/lib/cms";
import Link from "next/link";
import { Car, Users, Luggage, Snowflake, ArrowRight, Star } from "lucide-react";

export default async function FleetListingPage() {
  const vehicles = await getFleetVehicles();
  const settings = await getWebsiteSettings();
  const defaultTitle = settings?.seo_default_title || "Our Fleet";

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Fleet</h1>
          <p className="text-lg text-red-100 max-w-2xl mx-auto">
            Choose from our wide range of well-maintained vehicles for your journey
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {vehicles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Car className="h-16 w-16 mx-auto mb-4 text-gray-200" />
            <p className="text-xl">No vehicles available. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                href={`/fleet/${vehicle.slug}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="h-52 overflow-hidden bg-gray-100 relative">
                  {vehicle.images?.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={vehicle.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  {vehicle.isFeatured && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white" /> Featured
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                    ₹{vehicle.pricePerKm}/km
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                      {vehicle.name}
                    </h2>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {vehicle.type.toLowerCase().replace("_", " ")}
                    </span>
                  </div>

                  {vehicle.shortDescription && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {vehicle.shortDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {vehicle.seats} Seats</span>
                    <span className="flex items-center gap-1"><Luggage className="h-3.5 w-3.5" /> {vehicle.luggage} Bags</span>
                    {vehicle.ac && <span className="flex items-center gap-1"><Snowflake className="h-3.5 w-3.5" /> AC</span>}
                  </div>

                  <div className="flex items-center text-red-600 text-sm font-medium group-hover:gap-2 transition-all">
                    View Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "Our Fleet | " + (settings?.company_name || "Aradhana Travel"),
    description: "Browse our fleet of well-maintained sedans, SUVs, and tempo travellers for your travel needs.",
  };
}
