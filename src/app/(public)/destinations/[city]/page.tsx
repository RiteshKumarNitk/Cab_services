import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin, Star, Clock, Plane, Train, Bus, Phone, CheckCircle } from "lucide-react";
import { destinations, getDestinationBySlug } from "@/lib/destinations";
import { getWebsiteSettings } from "@/lib/cms";

export default async function DestinationPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const dest = getDestinationBySlug(city);
  const settings = await getWebsiteSettings();

  if (!dest) notFound();

  const cityName = dest.title.split("—")[0].trim();

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[50vh] bg-gradient-to-br from-red-900 via-red-800 to-amber-900 bg-cover bg-center" style={{ backgroundImage: dest.hero ? `url(${dest.hero})` : undefined }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-xl mb-3">{dest.title}</h1>
            <p className="text-xl text-red-100">{dest.tagline}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/destinations" className="text-red-700 font-medium flex items-center mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Destinations
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About {cityName}</h2>
              <p className="text-gray-600 leading-relaxed">{dest.about}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Attractions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dest.attractions.map((attr) => (
                  <div key={attr.name} className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100">
                    {attr.image ? (
                      <img src={attr.image} alt={attr.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-amber-50">
                        <MapPin className="h-8 w-8 text-red-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <span className="text-white font-semibold text-sm">{attr.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {dest.packages.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Tour Packages for {cityName}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {dest.packages.map((pkg) => (
                    <Link key={pkg.slug} href={`/tours/${pkg.slug}`} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">{pkg.title}</h3>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0 ml-2">{pkg.duration}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-gray-900">{pkg.price}<span className="text-sm font-normal text-gray-500">/person</span></span>
                        <span className="text-red-700 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">View <ArrowRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cab Services in {cityName}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {dest.services.map((svc) => (
                  <Link key={svc.slug} href={`/services/${svc.slug}`} className="bg-gray-50 rounded-xl p-5 hover:bg-red-50 transition-colors group">
                    <h3 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors mb-1">{svc.name}</h3>
                    <p className="text-sm text-gray-500">{svc.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Reach</h2>
              <div className="space-y-4">
                {dest.howToReach.map((item) => (
                  <div key={item.mode} className="flex items-start gap-4 bg-gray-50 rounded-xl p-5">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      {item.icon === "Plane" && <Plane className="h-5 w-5 text-red-700" />}
                      {item.icon === "Train" && <Train className="h-5 w-5 text-red-700" />}
                      {item.icon === "Bus" && <Bus className="h-5 w-5 text-red-700" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.mode}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Best Time to Visit</h2>
              <p className="text-gray-700 leading-relaxed">{dest.bestTime}</p>
            </div>

            {dest.faqs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQs</h2>
                <div className="space-y-3">
                  {dest.faqs.map((faq, i) => (
                    <details key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                        <span className="font-medium text-gray-900 text-sm pr-4">{faq.q}</span>
                        <svg className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-600">{faq.a}</div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-1">Plan Your Trip</h3>
              <p className="text-sm text-gray-500 mb-5">to {cityName}</p>

              <div className="space-y-4">
                <Link href="/#booking-form">
                  <Button className="w-full bg-red-700 hover:bg-red-800 text-white shadow-sm">
                    Book a Cab Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href={`tel:${(settings?.phone_primary || "+917353019999").replace(/\s/g, "")}`}>
                  <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Phone className="h-4 w-4 mr-2" /> Call Now
                  </Button>
                </a>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Info</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> 24/7 Cab Service</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Fixed Pricing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Professional Drivers</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Sanitized Vehicles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return destinations.map((d) => ({ city: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const dest = getDestinationBySlug(city);
  if (!dest) return { title: "Not Found" };

  return {
    title: `${dest.title} | Destinations | Aradhana Travel`,
    description: `Explore ${city} with Aradhana Travel. Book cabs, tour packages, and discover top attractions, best time to visit, and how to reach.`,
  };
}
