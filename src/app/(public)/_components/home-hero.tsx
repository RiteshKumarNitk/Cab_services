"use client";

import { HeroSection as AnimatedHeroSection } from "@/components/ui/hero-section-2";
import { TripRequestForm } from "@/components/TripRequestForm";

export function HomeHero({ section }: { section: Record<string, unknown> }) {
  const title = (section?.title as string) || "Book Premium Cabs";
  const subtitle = (section?.subtitle as string) || "Reliable, comfortable, and affordable cab service. Book your ride today!";
  const image = (section?.image as string) || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=60";
  const phone = (section?.phone as string) || "+91 73530 19999";
  const website = (section?.website as string) || "aradhanatravel.com";
  const address = (section?.address as string) || "Jaipur, Rajasthan";
  const logo = section?.logo as string | undefined;

  return (
    <AnimatedHeroSection
      title={
        <>
          {title} <br />
          <span className="text-primary">& Travel in Comfort</span>
        </>
      }
      subtitle={subtitle}
      callToAction={{
        text: "BOOK NOW",
        href: "#booking-form",
      }}
      backgroundImage={image}
      contactInfo={{
        website,
        phone,
        address,
      }}
      logo={logo ? {
        url: logo,
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