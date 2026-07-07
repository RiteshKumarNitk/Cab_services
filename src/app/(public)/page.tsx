import { getHomepageSections, getWebsiteSettings, getFeaturedFleetVehicles, getFeaturedTestimonials, getHomepageFAQs, getFeaturedPosts, getPublishedPages } from "@/lib/cms";
import Link from "next/link";
import { Car, Star, Clock, MapPin, Shield, ArrowRight, Phone, CheckCircle2, Users, Luggage, Snowflake, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripRequestForm } from "@/components/TripRequestForm";

function parseContent(content: string): Record<string, any> {
  try { return JSON.parse(content); } catch { return {}; }
}

async function HeroSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white overflow-hidden">
      {section.image && <img src={section.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              {section.title || "Book Premium Cabs & Rajasthan Tours"}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl">
              {section.subtitle || "Reliable, comfortable, and affordable cab service in Jaipur for local, outstation, and airport transfers."}
            </p>
            <div className="flex flex-wrap gap-4">
              {section.ctaText && (
                <Link href={section.ctaLink || "/contact"}>
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white text-base px-8">
                    {section.ctaText} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              {section.ctaSecondaryText && (
                <Link href={section.ctaSecondaryLink || "/fleet"}>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base px-8">
                    {section.ctaSecondaryText}
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-gray-300">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100+ Vehicles</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 5000+ Happy Customers</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 24/7 Support</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <TripRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const stats = s.stats || [
    { value: "5000+", label: "Happy Customers" },
    { value: "100+", label: "Vehicles" },
    { value: "50+", label: "Destinations" },
    { value: "10+", label: "Years Experience" },
  ];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">{section.title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-600 mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function WhyChooseUsSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const features = s.features || [
    { icon: "Shield", title: "Safe & Reliable", desc: "GPS-tracked vehicles with experienced drivers" },
    { icon: "Clock", title: "On-Time Pickup", desc: "Punctual service with real-time tracking" },
    { icon: "Car", title: "Clean Vehicles", desc: "Well-maintained, sanitized fleet" },
    { icon: "Star", title: "Best Rates", desc: "Transparent pricing with no hidden charges" },
  ];
  const iconMap: Record<string, any> = { Shield, Clock, Car, Star, MapPin, Phone, Users, CheckCircle2 };
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Why Choose Us"}</h2>
          {section.subtitle && <p className="text-gray-500 mt-2 max-w-xl mx-auto">{section.subtitle}</p>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f: any, i: number) => {
            const Icon = iconMap[f.icon] || Shield;
            return (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

async function ServicesSection({ section }: { section: any }) {
  const s = parseContent(section.content);
  const services = s.services || [
    { title: "Local City Rides", desc: "Hourly & point-to-point city travel", icon: "Car" },
    { title: "Outstation Trips", desc: "One-way & round trips to any city", icon: "MapPin" },
    { title: "Airport Transfers", desc: "Pickup & drop from Jaipur Airport", icon: "Car" },
    { title: "Rajasthan Tours", desc: "Customized tour packages across Rajasthan", icon: "MapPin" },
    { title: "Tempo Traveller", desc: "Group travel with 12-18 seater vehicles", icon: "Users" },
    { title: "Corporate Booking", desc: "Dedicated fleet for corporate clients", icon: "Shield" },
  ];
  const iconMap: Record<string, any> = { Car, MapPin, Users, Shield, Star, Clock };
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "Our Services"}</h2>
          {section.subtitle && <p className="text-gray-500 mt-2">{section.subtitle}</p>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc: any, i: number) => {
            const Icon = iconMap[svc.icon] || Car;
            return (
              <div key={i} className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 hover:bg-amber-50 transition-colors group cursor-pointer">
                <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                  <Icon className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{svc.title}</h3>
                  <p className="text-sm text-gray-500">{svc.desc}</p>
                </div>
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
    <section className="py-16 bg-gray-50">
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
              <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">{v.name}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.seats}</span>
                <span className="flex items-center gap-1"><Luggage className="h-3 w-3" /> {v.luggage}</span>
                {v.ac && <span className="flex items-center gap-1"><Snowflake className="h-3 w-3" /> AC</span>}
              </div>
              <div className="mt-3 text-amber-600 font-bold">₹{v.pricePerKm}/km</div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/fleet"><Button variant="outline">View All Fleet <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
  );
}

async function TestimonialsSection({ section }: { section: any }) {
  const testimonials = await getFeaturedTestimonials();
  if (testimonials.length === 0) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || "What Our Customers Say"}</h2>
          {section.subtitle && <p className="text-gray-500 mt-2">{section.subtitle}</p>}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((t) => (
            <div key={t.id} className="bg-gray-50 rounded-xl p-6">
              <Quote className="h-8 w-8 text-amber-200 mb-3" />
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">&ldquo;{t.review}&rdquo;</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />))}
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
    <section className="py-16 bg-gray-50">
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
          <Link href="/faq" className="text-amber-600 text-sm font-medium hover:underline">View All FAQs</Link>
        </div>
      </div>
    </section>
  );
}

async function BlogsSection({ section }: { section: any }) {
  const posts = await getFeaturedPosts();
  if (posts.length === 0) return null;
  return (
    <section className="py-16 bg-white">
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
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2">{post.title}</h3>
                {post.shortDesc && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.shortDesc}</p>}
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/blog"><Button variant="outline">View All Posts <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </section>
  );
}

function CTASection({ section }: { section: any }) {
  return (
    <section className="py-16 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">{section.title || "Ready to Book Your Ride?"}</h2>
        <p className="text-amber-100 mb-8 text-lg">{section.subtitle || "Get in touch with us for instant booking and free quotes."}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {section.ctaText && <Link href={section.ctaLink || "/contact"}><Button size="lg" className="bg-white text-amber-700 hover:bg-gray-100">{section.ctaText}</Button></Link>}
          {section.ctaSecondaryText && <Link href={section.ctaSecondaryLink || `tel:${section.phone || "+919876543210"}`}><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10"><Phone className="mr-2 h-4 w-4" /> {section.ctaSecondaryText}</Button></Link>}
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
          {section.ctaText && <Link href={section.ctaLink || "/contact"}><Button size="lg" className="bg-amber-600 hover:bg-amber-700">{section.ctaText}</Button></Link>}
        </div>
      </div>
    </section>
  );
}

const SECTION_RENDERERS: Record<string, any> = {
  hero: HeroSection,
  stats: StatsSection,
  why_choose_us: WhyChooseUsSection,
  services: ServicesSection,
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

  return (
    <div className="min-h-screen">
      {sections.length === 0 ? (
        <>
          <HeroSection section={{ title: "Book Premium Cabs & Rajasthan Tours", subtitle: "Reliable, comfortable, and affordable cab service in Jaipur", ctaText: "Book Now", ctaLink: "/contact", ctaSecondaryText: "View Fleet", ctaSecondaryLink: "/fleet" }} />
          <StatsSection section={{}} />
          <WhyChooseUsSection section={{}} />
          <ServicesSection section={{}} />
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
