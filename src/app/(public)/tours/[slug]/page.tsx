import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Star, Check, X, Calendar, Phone, Users } from "lucide-react";
import { tourPackages, getTourPackageBySlug } from "@/lib/tour-packages";
import { getWebsiteSettings } from "@/lib/cms";
import { TourBookingCard } from "./booking-card";

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = getTourPackageBySlug(slug);
  const settings = await getWebsiteSettings();

  if (!tour) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[50vh] bg-gradient-to-br from-red-900 via-red-800 to-amber-900">
        {tour.image && <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{tour.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {tour.duration}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {tour.places}</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {tour.rating} ({tour.reviews} reviews)</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tours" className="text-red-700 font-medium flex items-center mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Packages
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Overview</h2>
              <p className="text-gray-600 leading-relaxed">{tour.longDesc}</p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                {[
                  { label: "Duration", value: tour.duration, icon: Clock },
                  { label: "Nights", value: tour.nights, icon: Calendar },
                  { label: "Cities", value: tour.places.split(" - ").length.toString(), icon: MapPin },
                  { label: "Rating", value: `${tour.rating} ★`, icon: Star },
                ].map((item) => (
                  <div key={item.label}>
                    <item.icon className="h-5 w-5 text-amber-600 mx-auto mb-2" />
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="font-semibold text-gray-900 text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Day-wise Itinerary</h2>
              <div className="space-y-4">
                {tour.itinerary.map((day) => (
                  <details key={day.day} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm group open:border-red-200 open:ring-1 open:ring-red-100">
                    <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center gap-4">
                        <span className="h-10 w-10 rounded-full bg-red-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {day.day}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-900">Day {day.day}: {day.title}</span>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                      <ul className="space-y-2 mt-3">
                        {day.activities.map((activity, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" /> What&apos;s Included
                </h3>
                <ul className="space-y-2.5">
                  {tour.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" /> What&apos;s Excluded
                </h3>
                <ul className="space-y-2.5">
                  {tour.excludes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {tour.faqs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {tour.faqs.map((faq, i) => (
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
            <TourBookingCard tour={tour} phone={settings?.phone_primary || "+917353019999"} whatsapp={settings?.whatsapp_number || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return tourPackages.map((pkg) => ({ slug: pkg.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = getTourPackageBySlug(slug);
  if (!tour) return { title: "Not Found" };

  return {
    title: `${tour.title} | Tours | Aradhana Travel`,
    description: tour.desc,
  };
}
