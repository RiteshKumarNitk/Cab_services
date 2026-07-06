"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Car,
  CalendarDays,
  Star,
  Clock,
  MapPin,
  Shield,
  ArrowRight,
  Phone,
  CheckCircle2,
  Map
} from "lucide-react";
import { TripRequestForm } from "@/components/TripRequestForm";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const destinations = [
  {
    city: "Jaipur",
    tagline: "The Pink City",
    image: "/images/jaipur_card.png",
    description: "Explore the majestic Amer Fort, Hawa Mahal, and vibrant bazaars.",
  },
  {
    city: "Udaipur",
    tagline: "City of Lakes",
    image: "/images/udaipur_card.png",
    description: "Experience the romance of Lake Pichola and the City Palace.",
  },
  {
    city: "Jaisalmer",
    tagline: "The Golden City",
    image: "/images/jaisalmer_card.png",
    description: "Camp in the sweeping sand dunes and visit the living golden fort.",
  }
];

const tours = [
  {
    title: "Golden Triangle Tour",
    duration: "4 Days / 3 Nights",
    places: "Delhi - Agra - Jaipur",
    price: "From ₹12,500",
  },
  {
    title: "Rajasthan Heritage",
    duration: "7 Days / 6 Nights",
    places: "Jaipur - Jodhpur - Udaipur",
    price: "From ₹22,000",
  },
  {
    title: "Desert Safari Special",
    duration: "5 Days / 4 Nights",
    places: "Jodhpur - Jaisalmer - Bikaner",
    price: "From ₹16,800",
  }
];

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-orange-50/30">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/images/rajasthan_hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40" /> {/* Dark overlay for text readability */}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-white/20">
                <span className="text-sm font-medium text-amber-300">★ Premier Rajasthan Tourism & Cab Rental</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Discover the Royal 
                <br />
                <span className="text-amber-400">Heritage of Rajasthan</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-100 mb-8 max-w-lg drop-shadow-md font-medium">
                Affordable Tour Packages & Premium Car Rentals with verified drivers. Your journey through the land of kings begins here.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#destinations">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8 py-6 h-auto rounded-xl shadow-xl">
                    Explore Tours
                  </Button>
                </Link>
                <div className="flex items-center gap-3 text-white font-medium bg-black/20 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <Phone className="h-5 w-5 text-amber-400" />
                  +91 98765 43210
                </div>
              </div>
            </motion.div>

            {/* Right: Trip Request Form Widget */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:col-span-5 w-full max-w-lg ml-auto"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-2 border border-amber-100">
                <TripRequestForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TOP DESTINATIONS ===== */}
      <section id="destinations" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-bold tracking-wider uppercase text-sm">Top Rated</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">
              Explore Rajasthan
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {destinations.map((dest, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${dest.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-amber-400 font-medium text-sm mb-1">{dest.tagline}</p>
                    <h3 className="text-3xl font-bold text-white mb-2">{dest.city}</h3>
                    <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                      {dest.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POPULAR TOURS ===== */}
      <section className="py-24 bg-orange-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-amber-600 font-bold tracking-wider uppercase text-sm">Best Sellers</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                Popular Tour Packages
              </h2>
            </div>
            <Button variant="outline" className="hidden sm:flex border-amber-600 text-amber-700 hover:bg-amber-50">
              View All Tours <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tours.map((tour, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-xl transition-shadow bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-amber-100 h-32 flex items-center justify-center">
                    <Map className="h-12 w-12 text-amber-600 opacity-50" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{tour.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" /> {tour.duration}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700 font-medium border border-gray-100">
                      {tour.places}
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                      <span className="text-lg font-bold text-amber-700">{tour.price}</span>
                      <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" className="border-amber-600 text-amber-700 w-full">
              View All Tours
            </Button>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Book With Aradhana Travel?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">We are proud to receive 5-star ratings and Certificate of Excellency Awards since 2015 from our guests.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Verified Drivers", desc: "Professional, polite, and route-experienced." },
              { icon: Star, title: "Premium Fleet", desc: "Clean, well-maintained AC vehicles." },
              { icon: CheckCircle2, title: "Transparent Pricing", desc: "No hidden costs. Pay what you see." },
              { icon: Phone, title: "24/7 Support", desc: "Dedicated travel manager for your trip." },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="h-16 w-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  <stat.icon className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{stat.title}</h3>
                <p className="text-gray-400 text-sm">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">AT</span>
                </div>
                <span className="text-xl font-bold text-white">Aradhana Travel</span>
              </div>
              <p className="text-sm">Your trusted cab service & tour operator in Jaipur since 2015.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/auth/login" className="block hover:text-amber-400 transition-colors">Sign In</Link>
                <Link href="/auth/register" className="block hover:text-amber-400 transition-colors">Register</Link>
                <Link href="/tours" className="block hover:text-amber-400 transition-colors">Rajasthan Tours</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm">
                <p>📞 +91 98765 43210</p>
                <p>📍 G-3A, Rajputana Tower, Khatipura, Jaipur</p>
                <p>✉️ info@aradhanatravel.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-900 pt-8 text-center text-sm">
            <p>&copy; 2026 Aradhana Travel Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
