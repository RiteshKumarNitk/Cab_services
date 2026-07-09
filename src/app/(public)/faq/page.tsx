import { getPublishedFAQs, getWebsiteSettings } from "@/lib/cms";

export default async function FAQPage() {
  const [faqs, settings] = await Promise.all([
    getPublishedFAQs(),
    getWebsiteSettings(),
  ]);

  const filteredFaqs = faqs.filter((f) => f.showOnFAQPage);
  const grouped: Record<string, typeof faqs> = {};
  for (const faq of filteredFaqs) {
    const cat = faq.category?.name || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(faq);
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-red-100">Everything you need to know about our services</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {Object.entries(grouped).map(([category, categoryFaqs]) => (
          <div key={category} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
            <div className="space-y-3">
              {categoryFaqs.map((faq) => (
                <details key={faq.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors [&::-webkit-details-marker]:hidden">
                    <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
        {filteredFaqs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No FAQs available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "FAQ | " + (settings?.company_name || "Aradhana Travel"),
    description: "Find answers to frequently asked questions about our cab services, booking, pricing, and more.",
  };
}
