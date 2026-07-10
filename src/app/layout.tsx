import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Aradhana Travel Service - Cab Booking System",
  description:
    "24/7 cab booking service in Jaipur - Local, Outstation, Airport transfers, Monthly rentals & Event packages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Aradhana Travel Service",
    description: "24/7 cab booking service in Jaipur - Local, Outstation, Airport transfers, Monthly rentals & Event packages",
    url: "https://aradhanatravel.com",
    telephone: "+917353019999",
    email: "riyaz.abbas@yahoo.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bangalore",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "10000",
    },
    sameAs: [
      "https://facebook.com/aradhanatravel",
      "https://instagram.com/aradhanatravel",
    ],
  };

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${playfair.variable} h-full antialiased bg-gray-50 font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <div className="min-h-full flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
