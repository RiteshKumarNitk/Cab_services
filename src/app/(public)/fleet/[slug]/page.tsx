import { notFound } from "next/navigation";
import { getFleetVehicleBySlug, getFleetVehicles, getWebsiteSettings } from "@/lib/cms";
import Link from "next/link";
import { ArrowLeft, Users, Luggage, Snowflake, Fuel, Gauge, Star, Check, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function FleetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = await getFleetVehicleBySlug(slug);
  const settings = await getWebsiteSettings();
  const phone = settings?.phone_primary || "+91 98765 43210";
  const whatsapp = settings?.whatsapp_number || phone;

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[50vh] bg-gray-900">
        {vehicle.images?.length > 0 ? (
          <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <CarIcon />
              <p className="text-xl mt-4">{vehicle.name}</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{vehicle.name}</h1>
          <div className="flex items-center gap-3 text-white/80">
            <span className="capitalize bg-white/20 px-3 py-1 rounded-full text-sm">
              {vehicle.type.toLowerCase().replace("_", " ")}
            </span>
            {vehicle.isFeatured && (
              <span className="flex items-center gap-1 text-red-400 text-sm">
                <Star className="h-4 w-4 fill-red-400" /> Featured
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/fleet" className="text-red-600 font-medium flex items-center mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Fleet
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Seats", value: vehicle.seats },
                { icon: Luggage, label: "Luggage", value: `${vehicle.luggage} Bags` },
                { icon: Snowflake, label: "AC", value: vehicle.ac ? "Available" : "Not Available" },
                { icon: Fuel, label: "Fuel", value: vehicle.fuelType },
                { icon: Gauge, label: "Transmission", value: vehicle.transmission === "AUTO" ? "Automatic" : "Manual" },
              ].map((spec) => (
                <div key={spec.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <spec.icon className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <div className="text-xs text-gray-500">{spec.label}</div>
                  <div className="font-semibold text-gray-900">{spec.value}</div>
                </div>
              ))}
            </div>

            {vehicle.longDescription && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Vehicle</h2>
                <div className="prose prose-lg max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: vehicle.longDescription.replace(/\n/g, "<br/>") }} />
              </div>
            )}

            {vehicle.features?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {vehicle.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vehicle.images?.length > 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {vehicle.images.slice(1).map((img, i) => (
                    <img key={i} src={img} alt={`${vehicle.name} - ${i + 2}`} className="rounded-xl object-cover h-40 w-full" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Price per KM</span>
                  <span className="font-bold text-gray-900">₹{vehicle.pricePerKm}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Minimum KM</span>
                  <span className="font-semibold">{vehicle.minKmPerDay} km</span>
                </div>
                {vehicle.nightCharge > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Night Charges</span>
                    <span className="font-semibold">₹{vehicle.nightCharge}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <a href={`tel:${phone}`}>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <Phone className="h-4 w-4 mr-2" /> Call Now
                  </Button>
                </a>
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                    Book via WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CarIcon() {
  return (
    <svg className="h-20 w-20 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 002 2h10a2 2 0 002-2" />
    </svg>
  );
}

export async function generateStaticParams() {
  const vehicles = await getFleetVehicles();
  return vehicles.filter((v) => v.slug).map((v) => ({ slug: v.slug! }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = await getFleetVehicleBySlug(slug);
  if (!vehicle) return { title: "Not Found" };

  return {
    title: vehicle.seoTitle || `${vehicle.name} | Fleet | Aradhana Travel`,
    description: vehicle.seoDesc || vehicle.shortDescription || `Book ${vehicle.name} at just ₹${vehicle.pricePerKm}/km. ${vehicle.seats} seats, AC, comfortable ride.`,
    openGraph: vehicle.images?.[0] ? { images: [vehicle.images[0]] } : undefined,
  };
}
