"use client";

import { HeroSection as AnimatedHeroSection } from "@/components/ui/hero-section-2";
import { TripRequestForm } from "@/components/TripRequestForm";

export function HomeHero({ section }: { section: any }) {
  const phone = section?.phone || "+91 73530 19999";
  return (
    <AnimatedHeroSection
      title={
        <>
          {section?.title || "Book Premium Cabs"} <br />
          <span className="text-primary">& Travel in Comfort</span>
        </>
      }
      subtitle={section?.subtitle || "Reliable, comfortable, and affordable cab service. Book your ride today!"}
      callToAction={{
        text: "BOOK NOW",
        href: "#booking-form",
      }}
      backgroundImage={section?.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=60"}
      contactInfo={{
        website: section?.website || "aradhanatravel.com",
        phone: phone,
        address: section?.address || "Jaipur, Rajasthan",
      }}
      logo={section?.logo ? {
        url: section.logo,
        alt: "Company Logo",
        text: "Aradhana Travel",
      } : undefined}
    >
      <div id="booking-form">
        <TripRequestForm />
      </div>
    </AnimatedHeroSection>
  );
}