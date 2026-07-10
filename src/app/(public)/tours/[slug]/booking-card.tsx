"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, MessageSquareText, ArrowRight, Calendar, Users, Star } from "lucide-react";
import type { TourPackage } from "@/lib/tour-packages";

export function TourBookingCard({ tour, phone, whatsapp }: { tour: TourPackage; phone: string; whatsapp: string }) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
      <div className="text-center mb-5 pb-5 border-b border-gray-100">
        <div className="text-3xl font-bold text-gray-900">{tour.price}</div>
        <div className="text-sm text-gray-500">per person</div>
        <div className="flex items-center justify-center gap-1 mt-2 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-medium text-gray-700">{tour.rating}</span>
          <span className="text-gray-400">({tour.reviews} reviews)</span>
        </div>
      </div>

      <h3 className="font-bold text-gray-900 mb-4">Book This Tour</h3>

      <div className="space-y-3 mb-5">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input type="date" className="pl-10 h-10 text-sm rounded-lg border-gray-200 bg-gray-50" min={today} placeholder="Travel date" />
        </div>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input type="number" min="1" max="20" defaultValue="2" className="pl-10 h-10 text-sm rounded-lg border-gray-200 bg-gray-50" />
        </div>
      </div>

      <div className="space-y-3">
        <Button className="w-full bg-red-700 hover:bg-red-800 text-white shadow-sm">
          Request Quote <ArrowRight className="ml-2 h-4 w-4" />
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
