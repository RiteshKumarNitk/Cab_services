import Link from "next/link";
import { Clock, Map, ArrowRight, Star, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tourPackages } from "@/lib/tour-packages";

const FILTERS = ["All", "1 Day", "3-4 Days", "5-7 Days"];
const DURATION_MAP: Record<string, (d: string) => boolean> = {
  "1 Day": (d) => d.includes("1 Day"),
  "3-4 Days": (d) => /[3-4]\sDay/.test(d),
  "5-7 Days": (d) => /[5-7]\sDay/.test(d),
};

export default async function ToursPage(props: { searchParams: Promise<{ duration?: string }> }) {
  const searchParams = await props.searchParams;
  const activeFilter = searchParams?.duration || "All";
  const filterFn = DURATION_MAP[activeFilter];
  const filtered = filterFn ? tourPackages.filter((t) => filterFn(t.duration)) : tourPackages;

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rajasthan Tour Packages</h1>
          <p className="text-lg text-red-100 max-w-2xl mx-auto">
            Carefully crafted itineraries for unforgettable journeys
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 mr-1" />
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            const href = filter === "All" ? "/tours" : `/tours?duration=${encodeURIComponent(filter)}`;
            return (
              <Link
                key={filter}
                href={href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-red-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter}
              </Link>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((tour, i) => (
            <Link key={i} href={`/tours/${tour.slug}`} className="group block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-red-100 to-amber-50 sm:w-2/5 flex items-center justify-center p-8 relative min-h-[160px]">
                  <Map className="h-14 w-14 text-red-300" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-gray-900">
                    {tour.duration}
                  </div>
                </div>
                <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-gray-700">{tour.rating}</span>
                      <span className="text-xs text-gray-400">({tour.reviews} reviews)</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-red-700 transition-colors">{tour.title}</h2>
                    <p className="text-gray-500 text-sm mt-1 mb-3 line-clamp-2">{tour.desc}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {tour.places}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                    <span className="text-lg font-bold text-gray-900">{tour.price}<span className="text-sm font-normal text-gray-500">/person</span></span>
                    <span className="text-red-700 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Details <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Map className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p>No packages found for this duration.</p>
            <Link href="/tours" className="text-red-700 text-sm font-medium hover:underline mt-2 inline-block">View all packages</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Rajasthan Tour Packages | Aradhana Travel",
    description: "Explore curated tour packages across Rajasthan. Golden Triangle, Heritage tours, Desert safaris and more at best prices.",
  };
}
