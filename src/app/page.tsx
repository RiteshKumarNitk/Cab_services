"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Car,
  Plane,
  CalendarDays,
  Building2,
  Star,
  Clock,
  Phone,
  MapPin,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const serviceCard = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const features = [
  { icon: Shield, text: "Verified Drivers" },
  { icon: Clock, text: "24/7 Availability" },
  { icon: Star, text: "Premium Fleet" },
  { icon: Phone, text: "Instant Support" },
];

const services = [
  {
    icon: Car,
    title: "Local Cabs",
    desc: "One-way & round-trip local rides within Jaipur",
    price: "₹11 – ₹25/km",
    gradient: "from-blue-500 to-blue-600",
    delay: 0,
  },
  {
    icon: Car,
    title: "Outstation Cabs",
    desc: "Intercity travel to any destination",
    price: "₹11 – ₹25/km",
    gradient: "from-purple-500 to-purple-600",
    delay: 0.1,
  },
  {
    icon: Plane,
    title: "Airport Transfers",
    desc: "Pickup & drop to Jaipur International Airport",
    price: "Competitive rates",
    gradient: "from-cyan-500 to-cyan-600",
    delay: 0.2,
  },
  {
    icon: CalendarDays,
    title: "Monthly Rentals",
    desc: "Dedicated cab for your monthly commute",
    price: "₹12,000 – ₹40,000/mo",
    gradient: "from-orange-500 to-orange-600",
    delay: 0.3,
  },
  {
    icon: Building2,
    title: "Event Packages",
    desc: "Weddings, tours, corporate events",
    price: "₹1,800 – ₹5,000/trip",
    gradient: "from-pink-500 to-pink-600",
    delay: 0.4,
  },
  {
    icon: Star,
    title: "Premium Fleet",
    desc: "Well-maintained sedans and SUVs",
    price: "24/7 Availability",
    gradient: "from-emerald-500 to-emerald-600",
    delay: 0.5,
  },
];

const floatingIcons = [
  { Icon: Car, x: "10%", y: "20%", delay: 0, size: 24 },
  { Icon: Star, x: "85%", y: "30%", delay: 1, size: 20 },
  { Icon: Plane, x: "15%", y: "70%", delay: 2, size: 28 },
  { Icon: Shield, x: "80%", y: "65%", delay: 0.5, size: 22 },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const role = session?.user?.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "DRIVER") router.push("/driver");
      else if (role === "CUSTOMER") router.push("/customer");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600" />
          <div className="absolute inset-0 animate-pulse-glow rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">
        {/* Floating Background Icons */}
        {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
          <motion.div
            key={i}
            className="absolute text-white/10"
            style={{ left: x, top: y }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15, 0.1, 0.15],
              y: [0, -20, 10, -10],
            }}
            transition={{
              duration: 6,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon size={size} />
          </motion.div>
        ))}

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-white/20"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-sm font-medium text-white">24/7 Service Available</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              >
                Your Trusted
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  Cab Service
                </span>
                <br />
                in Jaipur
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl text-blue-100 mb-8 max-w-lg"
              >
                Station Road, Jaipur — Near Metro Station Pillar No. 148, Gopal Wadi
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/auth/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-10 py-6 h-auto rounded-xl shadow-xl shadow-blue-900/20 btn-shimmer">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/auth/login">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-10 py-6 h-auto rounded-xl backdrop-blur-sm"
                    >
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Features Row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-4 mt-10"
              >
                {features.map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"
                  >
                    <Icon className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm text-white/90">{text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Hero Image / Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 items-center justify-center mb-4 shadow-lg">
                      <Car className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Aradhana Travel</h3>
                    <p className="text-blue-200 mt-1">Premium Cab Service</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Sedan", price: "₹11/km" },
                      { label: "SUV", price: "₹25/km" },
                      { label: "Monthly", price: "₹12,000+" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3 border border-white/10"
                      >
                        <span className="text-white/80">{item.label}</span>
                        <span className="text-yellow-300 font-semibold">{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 text-center">
                    <p className="text-blue-200 text-sm">📞 08069247178 (Ext: 248)</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-600/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              Our Services
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Comprehensive Transport{" "}
              <span className="text-gradient">Solutions</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From local commutes to outstation trips, we've got you covered with our premium fleet
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={i}
                  variants={serviceCard}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <Card className="h-full card-hover border-0 shadow-lg shadow-gray-200/50 overflow-hidden group">
                    <div className={`h-2 bg-gradient-to-r ${service.gradient}`} />
                    <CardContent className="p-6">
                      <div
                        className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{service.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gradient">
                          {service.price}
                        </span>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Happy Customers" },
              { number: "1000+", label: "Rides Completed" },
              { number: "50+", label: "Fleet Vehicles" },
              { number: "24/7", label: "Support Available" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-200 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              Get in Touch
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              We're Here to <span className="text-gradient">Help</span>
            </h2>
            <p className="text-lg text-gray-600">
              Available 24/7 for all your travel needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: MapPin,
                title: "Main Office",
                lines: [
                  "Station Road, Jaipur",
                  "Near Metro Station Pillar No. 148",
                  "Gopal Wadi",
                ],
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: Phone,
                title: "Contact Info",
                lines: [
                  "📞 08069247178 (Ext: 248)",
                  "📍 S-12, Fateh Singh Market",
                  "Opposite Hotel Rajputana Palace Sheraton",
                ],
                gradient: "from-purple-500 to-pink-500",
              },
            ].map(({ icon: Icon, title, lines, gradient }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden card-hover">
                  <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                  <CardContent className="p-8">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {title}
                    </h3>
                    <div className="space-y-2">
                      {lines.map((line, j) => (
                        <p key={j} className="text-gray-600">
                          {line}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Book Your Ride?
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
              Join hundreds of satisfied customers. Experience the best cab service in Jaipur.
            </p>
            <Link href="/auth/register">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-12 py-6 h-auto rounded-xl shadow-2xl shadow-blue-900/30 btn-shimmer"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">AT</span>
                </div>
                <span className="text-xl font-bold text-white">Aradhana Travel</span>
              </div>
              <p className="text-sm">Your trusted cab service in Jaipur since 2024.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/auth/login" className="block hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register" className="block hover:text-white transition-colors">
                  Register
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm">
                <p>📞 08069247178 (Ext: 248)</p>
                <p>📍 Station Road, Jaipur</p>
                <p>🕐 Open 24/7</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Aradhana Travel Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
