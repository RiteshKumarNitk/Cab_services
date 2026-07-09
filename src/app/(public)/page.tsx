import { getHomepageSections, getWebsiteSettings, getFeaturedFleetVehicles, getFeaturedTestimonials, getHomepageFAQs, getFeaturedPosts } from "@/lib/cms";
import Link from "next/link";
import { Car, Star, Clock, MapPin, Shield, ArrowRight, Phone, CheckCircle2, Users, Luggage, Snowflake, Quote, Wifi, Music, Wind, Battery, Target, Heart, ShieldCheck, HeadphonesIcon, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripRequestForm } from "@/components/TripRequestForm";
import { HomeHero } from "./_components/home-hero";

function parseContent(content: string): Record<string, any> {
  try { return JSON.parse(content); } catch { return {}; }
}

const HeroSection = HomeHero;

function StatsSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const stats = s.stats || [
    { value: "30+", label: "Connecting Destinations", icon: "MapPin" },
    { value: "100%", label: "Comfort and Safety", icon: "Shield" },
    { value: "5000+", label: "Happy Customers", icon: "Users" },
  ];
  const iconMap: Record<string, any> = { MapPin: MapPin, Shield: Shield, Users: Users, Star: Star, Target: Target };
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat: any, i: number) => {
            const Icon = iconMap[stat.icon] || MapPin;
            return (
              <div key={i} className="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm border border-gray-100">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Icon className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const services = s.services || [
    { title: "Instant Booking", desc: "Enjoy a smooth and hassle-free cab reservation experience with transparent pricing and no hidden fees.", icon: "Clock" },
    { title: "Affordable Fares", desc: "Competitive rates with leading cab operators to bring you great savings and unbeatable travel value.", icon: "Target" },
    { title: "Live Tracking", desc: "Monitor your trip in real-time with instant route details, accurate arrival updates, and seamless information.", icon: "MapPin" },
    { title: "More Booking Options", desc: "Multiple convenient and reliable ways to book your cab quickly, securely, and without any hassle.", icon: "Shield" },
  ];
  const iconMap: Record<string, any> = { Clock: Clock, Target: Target, MapPin: MapPin, Shield: Shield, Car: Car };
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Services Built for Your Journey"}</h2>
          {section.subtitle && <p className="text-gray-500 mt-2 max-w-2xl mx-auto">{section.subtitle}</p>}
          {!section.subtitle && (
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              Wherever the road takes you, we ensure you&apos;re covered with swift, secure, and affordable service.
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((svc: any, i: number) => {
            const Icon = iconMap[svc.icon] || Car;
            return (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-red-50 transition-colors group cursor-pointer">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <Icon className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{svc.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AmenitiesSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const amenities = s.amenities || [
    { title: "Water Bottle", icon: "Wind" },
    { title: "Phone Charging", icon: "Battery" },
    { title: "Air Conditioner", icon: "Snowflake" },
    { title: "Music System", icon: "Music" },
    { title: "WiFi Hotspot", icon: "Wifi" },
    { title: "GPS Tracking", icon: "MapPin" },
  ];
  const iconMap: Record<string, any> = { Wind: Wind, Battery: Battery, Snowflake: Snowflake, Music: Music, Wifi: Wifi, MapPin: MapPin, Car: Car };
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Luxury Amenities for Relaxed Travel"}</h2>
          {section.subtitle && <p className="text-gray-500 mt-2">{section.subtitle}</p>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {amenities.map((a: any, i: number) => {
            const Icon = iconMap[a.icon] || Car;
            return (
              <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <Icon className="h-5 w-5 text-red-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-sm font-medium text-gray-800">{a.title}</h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ section }: { section: any }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              About Us
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {section.title || "Our journey is dedicated to making every mile safe, comfortable, and memorable for you"}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              {section.subtitle || "We are committed to delivering a journey that is safe, comfortable, reliable, and memorable. From booking to destination, every mile reflects our dedication to quality service, customer care, and a seamless travel experience."}
            </p>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="h-5 w-5 text-red-600" />
              <span className="text-gray-700 font-medium">100% Neat and Clean</span>
            </div>
            <Link href="/contact">
              <Button className="bg-red-600 hover:bg-red-700 text-white">Contact Us <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <div className="h-72 bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                <Car className="h-24 w-24 text-red-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function DestinationsSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const topRoutes = s.topRoutes || [
    { from: "Jaipur", to: "Delhi", fromIcon: "/images/jaipur_card.png", toIcon: "" },
    { from: "Jaipur", to: "Udaipur", fromIcon: "/images/udaipur_card.png", toIcon: "" },
    { from: "Jaipur", to: "Jaisalmer", fromIcon: "/images/jaisalmer_card.png", toIcon: "" },
  ];
  const viaRoutes = s.viaRoutes || [
    { from: "Jaipur", to: "Ajmer" },
    { from: "Jaipur", to: "Pushkar" },
    { from: "Jaipur", to: "Sikar" },
  ];
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Our Daily Travel Destinations"}</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            We connect you to key destinations with comfort and reliability. Travel with us for a safe and timely experience.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-red-600" /> Top Routes
            </h3>
            <div className="space-y-3">
              {topRoutes.map((r: any, i: number) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-semibold text-gray-900">{r.from}</span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <span className="font-semibold text-gray-900">{r.to}</span>
                  </div>
                  <span className="text-xs text-red-600 font-medium">Book Now</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" /> Via Routes
            </h3>
            <div className="space-y-3">
              {viaRoutes.map((r: any, i: number) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium text-gray-800">{r.from}</span>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <span className="font-medium text-gray-800">{r.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const benefits = s.features || [
    { icon: "Heart", title: "You're at the Heart of What We Do", desc: "We value punctuality delivering journeys that honor schedules, ensuring you reach your destination promptly, safely, and stress-free." },
    { icon: "Clock", title: "Punctual Journeys, Always", desc: "Every journey with us ensures comfort, trust, and satisfaction through safe travel, timely service, clean vehicles, and affordable fares." },
    { icon: "ShieldCheck", title: "Safety You Can Count On", desc: "Your safety is our priority. GPS-tracked vehicles, verified drivers, and 24/7 support ensure peace of mind throughout your journey." },
  ];
  const iconMap: Record<string, any> = { Heart: Heart, Clock: Clock, ShieldCheck: ShieldCheck, Shield: Shield, Target: Target };
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Why Journey With Us"}</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {benefits.map((b: any, i: number) => {
            const Icon = iconMap[b.icon] || Heart;
            return (
              <div key={i} className="text-center p-8 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                  <Icon className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const features = s.features || [
    { title: "24/7 Customer Support", desc: "Receive instant help anytime with one call, guaranteeing safety, reliability, and full peace of mind.", icon: "HeadphonesIcon" },
    { title: "Clean Cars, Expert Drivers", desc: "Travel comfortably in well-maintained vehicles driven by experts focused on smooth, safe journeys.", icon: "Car" },
    { title: "Reliable Support at Every Step", desc: "Our supportive team is always available to help and guide you through your journey smoothly.", icon: "ShieldCheck" },
    { title: "Safe & Comfortable Rides", desc: "Enjoy safe, comfortable journeys with verified drivers and well-maintained vehicles for women and families.", icon: "Heart" },
  ];
  const iconMap: Record<string, any> = { HeadphonesIcon: HeadphonesIcon, Car: Car, ShieldCheck: ShieldCheck, Heart: Heart, MapPin: MapPin };
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Top Features for Comfortable Rides"}</h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Enjoy plush seating, engaging entertainment, spacious interiors, and top-tier safety features for a smooth and relaxing travel experience.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f: any, i: number) => {
            const Icon = iconMap[f.icon] || Shield;
            return (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow group">
                <div className="h-14 w-14 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-red-600 transition-colors">
                  <Icon className="h-6 w-6 text-red-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

async function FleetSection({ section }: { section: any }) {
  const vehicles = await getFeaturedFleetVehicles();
  if (vehicles.length === 0) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Our Fleet"}</h2>
          {section.subtitle && <p className="text-gray-500 mt-2">{section.subtitle}</p>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.slice(0, 4).map((v) => (
            <Link key={v.id} href={`/fleet/${v.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
              <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {v.images?.[0] ? (
                  <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
                ) : (
                  <Car className="h-12 w-12 text-gray-300" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">{v.name}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.seats}</span>
                <span className="flex items-center gap-1"><Luggage className="h-3 w-3" /> {v.luggage}</span>
                {v.ac && <span className="flex items-center gap-1"><Snowflake className="h-3 w-3" /> AC</span>}
              </div>
              <div className="mt-3 text-red-600 font-bold">₹{v.pricePerKm}/km</div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/fleet">
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">View All Fleet <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

async function TestimonialsSection({ section }: { section: any }) {
  const testimonials = await getFeaturedTestimonials();
  if (testimonials.length === 0) return null;
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "What Our Customers Say"}</h2>
          {section.subtitle && <p className="text-gray-500 mt-2">{section.subtitle}</p>}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((t) => (
            <div key={t.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Quote className="h-8 w-8 text-red-200 mb-3" />
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">&ldquo;{t.review}&rdquo;</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-red-400 text-red-400" />))}
              </div>
              <div className="font-semibold text-gray-900 text-sm">{t.customerName}</div>
              {t.city && <div className="text-xs text-gray-500">{t.city}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function FAQSection({ section }: { section: any }) {
  const faqs = await getHomepageFAQs();
  if (faqs.length === 0) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Frequently Asked Questions"}</h2>
        </div>
        <div className="space-y-3">
          {faqs.slice(0, 5).map((faq) => (
            <details key={faq.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                <span className="font-medium text-gray-900 text-sm pr-4">{faq.question}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-600">{faq.answer}</div>
            </details>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/faq" className="text-red-600 text-sm font-medium hover:underline">View All FAQs</Link>
        </div>
      </div>
    </section>
  );
}

async function BlogsSection({ section }: { section: any }) {
  const posts = await getFeaturedPosts();
  if (posts.length === 0) return null;
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Latest from Our Blog"}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-40 bg-gray-100">
                {post.featuredImage ? <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Car className="h-10 w-10" /></div>}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">{post.title}</h3>
                {post.shortDesc && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.shortDesc}</p>}
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/blog"><Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">View All Posts <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
  );
}

function CTASection({ section }: { section: any }) {
  return (
    <section className="py-16 bg-gradient-to-r from-red-700 to-red-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">{section.title || "Ready to Book Your Ride?"}</h2>
        <p className="text-red-100 mb-8 text-lg">{section.subtitle || "Get in touch with us for instant booking and free quotes."}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {section.ctaText && <Link href={section.ctaLink || "/contact"}><Button size="lg" className="bg-white text-red-700 hover:bg-gray-100">{section.ctaText}</Button></Link>}
          {section.ctaSecondaryText && <Link href={section.ctaSecondaryLink || `tel:${section.phone || "+917353019999"}`}><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10"><Phone className="mr-2 h-4 w-4" /> {section.ctaSecondaryText}</Button></Link>}
        </div>
      </div>
    </section>
  );
}

function ContactCTASection({ section }: { section: any }) {
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">{section.title || "Have Questions?"}</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">{section.subtitle || "Our team is available 24/7 to help you with bookings and inquiries."}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {section.ctaText && <Link href={section.ctaLink || "/contact"}><Button size="lg" className="bg-red-600 hover:bg-red-700">{section.ctaText}</Button></Link>}
        </div>
      </div>
    </section>
  );
}

const SECTION_RENDERERS: Record<string, any> = {
  hero: HeroSection,
  stats: StatsSection,
  services: ServicesSection,
  amenities: AmenitiesSection,
  about: AboutSection,
  destinations: DestinationsSection,
  why_choose_us: WhyChooseUsSection,
  features: FeaturesSection,
  fleet: FleetSection,
  testimonials: TestimonialsSection,
  faq: FAQSection,
  blogs: BlogsSection,
  cta: CTASection,
  footer_cta: ContactCTASection,
};

export default async function HomePage() {
  const [sections, settings] = await Promise.all([
    getHomepageSections(),
    getWebsiteSettings(),
  ]);

  const defaultSections = [
    { type: "hero", key: "hero" },
    { type: "stats", key: "stats" },
    { type: "services", key: "services" },
    { type: "amenities", key: "amenities" },
    { type: "about", key: "about" },
    { type: "destinations", key: "destinations" },
    { type: "why_choose_us", key: "why_choose_us" },
    { type: "features", key: "features" },
  ];

  return (
    <div className="min-h-screen">
      {sections.length === 0 ? (
        <>
          <HeroSection section={{}} />
          <StatsSection section={{}} />
          <ServicesSection section={{}} />
          <AmenitiesSection section={{}} />
          <AboutSection section={{}} />
          <DestinationsSection section={{}} />
          <WhyChooseUsSection section={{}} />
          <FeaturesSection section={{}} />
          <FleetSection section={{}} />
          <TestimonialsSection section={{}} />
          <FAQSection section={{}} />
          <BlogsSection section={{}} />
          <CTASection section={{}} />
        </>
      ) : (
        sections.map((section) => {
          const Renderer = SECTION_RENDERERS[section.type];
          if (!Renderer) return null;
          return <Renderer key={section.id} section={section} />;
        })
      )}
    </div>
  );
}
