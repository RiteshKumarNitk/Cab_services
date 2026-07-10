import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getWebsiteSettings } from "@/lib/cms";
import { Car, Shield, Star, Users, MapPin, Award, ArrowRight, Phone, Clock } from "lucide-react";

export default async function AboutPage() {
  const settings = await getWebsiteSettings();
  const phone = settings?.phone_primary || "+917353019999";

  const timeline = [
    { year: "2010", event: "Founded with 2 cars", desc: "Started operations in Jaipur with a vision to provide reliable cab service." },
    { year: "2013", event: "Expanded to 10 cars", desc: "Added outstation services and grew the fleet to meet increasing demand." },
    { year: "2016", event: "50+ vehicles", desc: "Launched tour packages and expanded to multiple cities across Rajasthan." },
    { year: "2020", event: "Digital transformation", desc: "Implemented contactless service, online booking, and live tracking." },
    { year: "2026", event: "200+ fleet, 10K+ customers", desc: "One of Rajasthan's most trusted travel service providers." },
  ];

  const stats = [
    { value: "15+", label: "Years Experience", icon: Award },
    { value: "10K+", label: "Happy Customers", icon: Users },
    { value: "200+", label: "Fleet Size", icon: Car },
    { value: "4.8", label: "Customer Rating", icon: Star },
  ];

  const reasons = [
    { icon: Shield, title: "Safe & Reliable", desc: "GPS-tracked vehicles, verified drivers, and 24/7 support for complete peace of mind." },
    { icon: Clock, title: "Punctual Service", desc: "We value your time. On-time pickups and drop-offs guaranteed." },
    { icon: Star, title: "Top Rated", desc: "4.8★ average rating across 10,000+ rides. Consistently high customer satisfaction." },
    { icon: MapPin, title: "Local Expertise", desc: "15+ years of local knowledge. We know the best routes, avoiding traffic and delays." },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Our Story — 15 Years of Trust</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto">From a small fleet of 2 cars to Rajasthan&apos;s most trusted travel service provider</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl bg-gray-50 border border-gray-100">
                <stat.icon className="h-8 w-8 text-red-700 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-red-200 hidden md:block" />
            <div className="space-y-8">
              {timeline.map((item) => (
                <div key={item.year} className="relative pl-0 md:pl-20">
                  <div className="hidden md:flex absolute left-4 w-9 h-9 rounded-full bg-red-700 text-white items-center justify-center text-sm font-bold -translate-x-1/2">
                    {item.year.slice(2)}
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <span className="text-sm font-bold text-red-700">{item.year}</span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{item.event}</h3>
                    <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Aradhana Travel?</h2>
            <p className="text-gray-500 mt-2">What sets us apart</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-red-50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <r.icon className="h-6 w-6 text-red-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{r.title}</h3>
                <p className="text-sm text-gray-500">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-700 to-red-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Travel?</h2>
          <p className="text-red-100 mb-8 text-lg">Let&apos;s plan your journey with Aradhana Travel</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><Button size="lg" className="bg-white text-red-800 hover:bg-gray-100"><Phone className="mr-2 h-4 w-4" /> Call Now</Button></a>
            <Link href="/#booking-form"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Request Quote <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const settings = await getWebsiteSettings();
  return {
    title: "About Us | " + (settings?.company_name || "Aradhana Travel"),
    description: "Learn about Aradhana Travel's 15-year journey. From 2 cars to 200+ fleet, we've been Rajasthan's trusted travel partner since 2010.",
  };
}
