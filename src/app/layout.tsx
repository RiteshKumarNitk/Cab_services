import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

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
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-gray-50`}>
        <Providers>
          <div className="min-h-full flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
