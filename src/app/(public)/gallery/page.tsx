import { getGalleryItems, getWebsiteSettings } from "@/lib/cms";
import { ImageIcon } from "lucide-react";

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([
    getGalleryItems(),
    getWebsiteSettings(),
  ]);

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h1>
          <p className="text-xl text-gray-300">Moments from our journeys</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <a key={cat} href={`#cat-${cat}`} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </a>
            ))}
          </div>
        )}

        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          return (
            <div key={cat} id={`cat-${cat}`} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">{cat}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {catItems.map((item) => (
                  <a key={item.id} href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="group block">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.altText || item.title || "Gallery image"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    {item.title && <p className="mt-2 text-sm text-gray-600">{item.title}</p>}
                  </a>
                ))}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-200" />
            <p className="text-xl">No images in the gallery yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "Gallery | " + (settings?.company_name || "Aradhana Travel"),
    description: "Browse our gallery of vehicles, trips, and happy customers.",
  };
}
