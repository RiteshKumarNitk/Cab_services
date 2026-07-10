"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, MessageSquareText, ArrowRight, Calendar, MapPin } from "lucide-react";

export function FleetBookingCard({
  vehicleName,
  pricePerKm,
  phone,
  whatsapp,
}: {
  vehicleName: string;
  pricePerKm: number;
  phone: string;
  whatsapp: string;
}) {
  const [tripType, setTripType] = useState("OUTSTATION");
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Request a Quote</h3>
      <p className="text-sm text-gray-500 mb-5">for {vehicleName}</p>

      <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200 mb-4">
        {["OUTSTATION", "LOCAL"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tripType === type
                ? "bg-red-700 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {type === "OUTSTATION" ? "Outstation" : "Local"}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-5">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-10 h-10 text-sm rounded-lg border-gray-200 bg-gray-50" placeholder="Pickup location" />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
          <Input className="pl-10 h-10 text-sm rounded-lg border-gray-200 bg-gray-50" placeholder="Drop location" />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input type="date" className="pl-10 h-10 text-sm rounded-lg border-gray-200 bg-gray-50" min={today} />
        </div>
      </div>

      <div className="space-y-2 mb-5 pb-5 border-b border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Price per km</span>
          <span className="font-semibold text-gray-900">₹{pricePerKm}</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button className="w-full bg-red-700 hover:bg-red-800 text-white shadow-sm">
          Get Price <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <a href={`tel:${phone.replace(/\s/g, "")}`}>
          <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
            <Phone className="h-4 w-4 mr-2" /> Call Now
          </Button>
        </a>
        <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <MessageSquareText className="h-4 w-4 mr-2" /> WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
