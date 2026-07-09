import { Car, MapPin, Users, Shield, Clock, HeadphonesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
  const services = [
    { icon: Car, title: "One-Way Drops", desc: "Reliable and comfortable one-way trips across cities with professional drivers. Pay only for the distance you travel." },
    { icon: MapPin, title: "Round Trips", desc: "Book cabs for round trips and vacations. Enjoy flexible timings, unlimited stops, and the best rates." },
    { icon: Clock, title: "Airport Transfers", desc: "Punctual pickups and drops to airports with flight tracking for zero delays. Available 24/7." },
    { icon: Users, title: "Tempo Traveller", desc: "Group travel made easy with 12-18 seater vehicles. Perfect for family trips, weddings, and corporate outings." },
    { icon: Shield, title: "Corporate Booking", desc: "Dedicated fleet for corporate clients with monthly billing, priority support, and customized solutions." },
    { icon: HeadphonesIcon, title: "24/7 Support", desc: "Round-the-clock customer support for bookings, queries, and emergencies. We are always here to help." },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-lg text-red-100 max-w-2xl mx-auto">
            Comprehensive cab services tailored for your every need
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="h-14 w-14 rounded-xl bg-red-100 flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
                <svc.icon className="h-6 w-6 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{svc.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700 text-white">Book a Cab Now</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
