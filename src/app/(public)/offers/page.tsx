import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getWebsiteSettings } from "@/lib/cms";
import { BadgePercent, Clock, ArrowRight, Phone, Gift } from "lucide-react";

export default async function OffersPage() {
  const settings = await getWebsiteSettings();
  const phone = settings?.phone_primary || "+917353019999";

  const offers = [
    {
      title: "Weekend Getaway Special",
      desc: "Flat 20% off on all outstation bookings made for Friday to Sunday travel. Explore Rajasthan at unbeatable prices.",
      discount: "20% OFF",
      validUntil: "Jul 31, 2026",
      code: "WEEKEND20",
      color: "from-red-500 to-red-700",
    },
    {
      title: "Airport Transfer Deal",
      desc: "Complimentary 1-hour waiting time on all airport pickups. Flight tracking included — we adjust if your flight is delayed.",
      discount: "Free Wait",
      validUntil: "Aug 15, 2026",
      code: "AIRPORT1HR",
      color: "from-blue-500 to-blue-700",
    },
    {
      title: "Group Booking Discount",
      desc: "Special discounted rates for groups of 6 or more passengers. Perfect for family trips, wedding guests, and corporate events.",
      discount: "Up to 30%",
      validUntil: "Ongoing",
      code: "GROUP6",
      color: "from-emerald-500 to-emerald-700",
    },
    {
      title: "First Ride Free Upgrade",
      desc: "New customers get a free upgrade to the next vehicle category on their first booking. Book a sedan, get an SUV at no extra cost.",
      discount: "Free Upgrade",
      validUntil: "Dec 31, 2026",
      code: "NEWRIDE",
      color: "from-purple-500 to-purple-700",
    },
    {
      title: "Return Trip Offer",
      desc: "Book a round trip and get 10% off on the return journey. Ideal for outstation trips and vacation travel.",
      discount: "10% Off Return",
      validUntil: "Sep 30, 2026",
      code: "ROUND10",
      color: "from-amber-500 to-amber-700",
    },
    {
      title: "Corporate Travel Plan",
      desc: "Exclusive rates for corporate clients. Monthly billing, dedicated fleet, priority support, and customized travel solutions.",
      discount: "Custom Pricing",
      validUntil: "Ongoing",
      code: "CORPORATE",
      color: "from-red-800 to-red-900",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Special Offers & Deals</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto">Limited-time offers to make your travel more affordable. Book now and save big!</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className={`bg-gradient-to-br ${offer.color} p-5 text-white relative`}>
                  <div className="flex items-center justify-between">
                    <BadgePercent className="h-6 w-6 text-white/80" />
                    <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">{offer.discount}</span>
                  </div>
                  <h3 className="text-xl font-bold mt-4 mb-1">{offer.title}</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{offer.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Clock className="h-3.5 w-3.5" /> Valid until: <span className="font-medium text-gray-700">{offer.validUntil}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Code:</span>
                    <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 rounded text-gray-800">{offer.code}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href="/#booking-form"><Button className="flex-1 bg-red-700 hover:bg-red-800 text-white text-sm h-9">Book Now</Button></Link>
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Gift className="h-12 w-12 text-red-700 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated on New Offers</h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">Subscribe to receive exclusive deals, seasonal discounts, and travel tips directly in your inbox.</p>
          <div className="flex max-w-md mx-auto gap-3">
            <input type="email" placeholder="your@email.com" className="flex-1 h-12 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            <Button className="h-12 bg-red-700 hover:bg-red-800 text-white rounded-xl shrink-0">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "Offers & Deals | " + (settings?.company_name || "Aradhana Travel"),
    description: "Exclusive offers and deals on cab booking, tour packages, and airport transfers. Save up to 30% on your next ride with Aradhana Travel.",
  };
}
