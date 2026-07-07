import { getPublishedTestimonials, getWebsiteSettings } from "@/lib/cms";
import { Star, Quote } from "lucide-react";

export default async function TestimonialsPage() {
  const [testimonials, settings] = await Promise.all([
    getPublishedTestimonials(),
    getWebsiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">What Our Customers Say</h1>
          <p className="text-xl text-gray-300">Trusted by thousands of happy travelers</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <Quote className="h-8 w-8 text-amber-200 mb-3" />
              <p className="text-gray-700 leading-relaxed mb-4 line-clamp-4">&ldquo;{t.review}&rdquo;</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                {t.photo ? (
                  <img src={t.photo} alt={t.customerName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-sm">{t.customerName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.customerName}</div>
                  {t.city && <div className="text-xs text-gray-500">{t.city}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {testimonials.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No testimonials yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "Testimonials | " + (settings?.company_name || "Aradhana Travel"),
    description: "Read what our customers say about our cab services and Rajasthan tours.",
  };
}
