"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, ArrowRight, Search } from "lucide-react";

export function TripRequestForm() {
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("ONE_WAY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 1500);
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-red-700 px-6 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">Book Your Cab Now</h3>
        <a href="/routes" className="text-red-200 text-xs hover:text-white transition-colors flex items-center gap-1">
          View Routes <ArrowRight className="h-3 w-3" />
        </a>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={(e) => { e.preventDefault(); setStep(2); }}
              className="space-y-4"
            >
              <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200">
                <button
                  type="button"
                  onClick={() => setTripType("ONE_WAY")}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    tripType === "ONE_WAY"
                      ? "bg-red-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> One Way
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("ROUND_TRIP")}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    tripType === "ROUND_TRIP"
                      ? "bg-red-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" /> Round Trip
                  </span>
                </button>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="From (e.g., Jaipur)" required />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                <Input className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="To (e.g., Delhi)" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="date" className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" min={today} required />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="date" className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" min={today} placeholder={tripType === "ROUND_TRIP" ? "Return Date" : "Flexible"} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold rounded-lg shadow-lg shadow-red-600/20">
                <Search className="mr-2 h-4 w-4" /> Search Available Cabs
              </Button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="bg-red-50 rounded-lg p-3 text-sm text-red-800 border border-red-100">
                <p className="font-medium">Confirm your details</p>
                <p className="text-red-600 text-xs mt-1">We&apos;ll find the best cabs for your trip</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Passengers</label>
                <Input type="number" min="1" max="15" defaultValue="2" className="h-11 rounded-lg border-gray-200 bg-gray-50" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input className="h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="Enter your name" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <Input type="tel" className="h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="Enter phone number" required />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 border-gray-200">
                  Back
                </Button>
                <Button type="submit" className="w-2/3 bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                  {isSubmitting ? "Searching..." : "Get Quotation"}
                </Button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Request Submitted!</h3>
              <p className="text-gray-600 text-sm">
                We have received your trip request. Our team will send you a quotation shortly.
              </p>
              <Button onClick={() => setStep(1)} variant="outline" className="border-gray-200 mt-2">
                Book Another Trip
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
