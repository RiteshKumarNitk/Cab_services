import { getAllPricing, getPricingPage, getWebsiteSettings } from "@/lib/cms";
import { Car, Shield, Clock, IndianRupee } from "lucide-react";

export default async function PricingPage() {
  const [pricing, pricingPage, settings] = await Promise.all([
    getAllPricing(),
    getPricingPage(),
    getWebsiteSettings(),
  ]);

  const vehicleLabels: Record<string, string> = {
    SEDAN: "Sedan",
    SUV: "SUV",
    HATCHBACK: "Hatchback",
    TEMPO_TRAVELLER: "Tempo Traveller",
    LUXURY: "Luxury",
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Transparent Pricing</h1>
          <p className="text-lg text-red-100 max-w-3xl mx-auto">
            No hidden charges. What you see is what you pay.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Vehicle Type</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Base Fare</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Per Km</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Min KM</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Night Charge</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Driver Charge</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <Car className="h-5 w-5 text-red-600" />
                        </div>
                        <span className="font-semibold text-gray-900">
                          {vehicleLabels[p.vehicleType] || p.vehicleType}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-6 font-medium">₹{p.baseFare}</td>
                    <td className="text-center py-4 px-6">
                      <span className="font-bold text-lg text-red-600">₹{p.perKm}</span>
                      <span className="text-gray-400 text-xs block">per km</span>
                    </td>
                    <td className="text-center py-4 px-6">{p.minKm} km</td>
                    <td className="text-center py-4 px-6">₹{p.nightCharge}</td>
                    <td className="text-center py-4 px-6">₹{p.driverCharge}</td>
                  </tr>
                ))}
                {pricing.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <p>Pricing data coming soon.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            { title: "Parking", content: pricingPage?.parkingPolicy },
            { title: "Toll", content: pricingPage?.tollPolicy },
            { title: "State Tax", content: pricingPage?.stateTaxPolicy },
            { title: "Cancellation", content: pricingPage?.cancellationPolicy },
            { title: "Refund", content: pricingPage?.refundPolicy },
            { title: "GST", content: pricingPage?.gstPercentage ? `GST of ${pricingPage.gstPercentage}% applicable on all fares.` : "" },
          ].filter(p => p.content).map((policy) => (
            <div key={policy.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">{policy.title} Policy</h3>
              </div>
              <p className="text-gray-600 text-sm">{policy.content}</p>
            </div>
          ))}
          {pricingPage?.seasonalPricing && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Seasonal Pricing</h3>
              </div>
              <p className="text-red-800 text-sm">{pricingPage.seasonalPricing}</p>
            </div>
          )}
          {pricingPage?.specialOffers && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900">Special Offers</h3>
              </div>
              <p className="text-emerald-800 text-sm">{pricingPage.specialOffers}</p>
            </div>
          )}
        </div>

        {pricingPage?.content && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: pricingPage.content }} />
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "Pricing | " + (settings?.company_name || "Aradhana Travel"),
    description: "Transparent cab pricing with no hidden charges. See rates for sedans, SUVs, and tempo travellers.",
  };
}
