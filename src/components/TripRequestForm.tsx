"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { MapPin, Calendar, ArrowRight, Search } from "lucide-react";

type Fields = {
  pickupAddress: string;
  dropAddress: string;
  pickupDate: string;
  returnDate: string;
  passengers: string;
  name: string;
  phone: string;
  website: string; // honeypot
};

const EMPTY: Fields = {
  pickupAddress: "", dropAddress: "", pickupDate: "", returnDate: "",
  passengers: "2", name: "", phone: "", website: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1" role="alert">{message}</p>;
}

export function TripRequestForm() {
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("ONE_WAY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // guard against double submission
    setIsSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          tripType,
          returnDate: tripType === "ROUND_TRIP" ? fields.returnDate : fields.returnDate || undefined,
          passengers: Number(fields.passengers) || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fieldErrors: Record<string, string> = data.fields ?? {};
        setErrors({ ...fieldErrors, form: data.error ?? "Could not submit your request. Please try again." });
        // Trip details are on step 1: send the user back if the problem is there.
        if (["pickupAddress", "dropAddress", "pickupDate", "returnDate"].some((k) => fieldErrors[k])) setStep(1);
        return;
      }
      setReference(data.reference ?? "");
      setStep(3);
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFields(EMPTY);
    setErrors({});
    setReference("");
    setStep(1);
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-red-700 px-6 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">Book Your Cab Now</h3>
        <Link href="/destinations" className="text-red-200 text-xs hover:text-white transition-colors flex items-center gap-1">
          View Routes <ArrowRight className="h-3 w-3" />
        </Link>
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

              <div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input aria-label="Pickup location" value={fields.pickupAddress} onChange={set("pickupAddress")} className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="From (e.g., Jaipur)" required />
                </div>
                <FieldError message={errors.pickupAddress} />
              </div>

              <div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                  <Input aria-label="Drop location" value={fields.dropAddress} onChange={set("dropAddress")} className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="To (e.g., Delhi)" required />
                </div>
                <FieldError message={errors.dropAddress} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input aria-label="Pickup date" type="date" value={fields.pickupDate} onChange={set("pickupDate")} className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" min={today} required />
                  </div>
                  <FieldError message={errors.pickupDate} />
                </div>
                <div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input aria-label="Return date" type="date" value={fields.returnDate} onChange={set("returnDate")} className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50" min={fields.pickupDate || today} required={tripType === "ROUND_TRIP"} placeholder={tripType === "ROUND_TRIP" ? "Return Date" : "Flexible"} />
                  </div>
                  <FieldError message={errors.returnDate} />
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
                <label htmlFor="trf-passengers" className="text-sm font-medium text-gray-700">Passengers</label>
                <Input id="trf-passengers" type="number" min="1" max="60" value={fields.passengers} onChange={set("passengers")} className="h-11 rounded-lg border-gray-200 bg-gray-50" required />
                <FieldError message={errors.passengers} />
              </div>

              <div className="space-y-2">
                <label htmlFor="trf-name" className="text-sm font-medium text-gray-700">Full Name</label>
                <Input id="trf-name" autoComplete="name" value={fields.name} onChange={set("name")} className="h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="Enter your name" required />
                <FieldError message={errors.name} />
              </div>

              <div className="space-y-2">
                <label htmlFor="trf-phone" className="text-sm font-medium text-gray-700">Phone Number</label>
                <Input id="trf-phone" type="tel" autoComplete="tel" inputMode="tel" value={fields.phone} onChange={set("phone")} className="h-11 rounded-lg border-gray-200 bg-gray-50" placeholder="10-digit mobile number" required />
                <FieldError message={errors.phone} />
              </div>

              {/* Honeypot for bots: hidden from people and assistive tech */}
              <input type="text" name="website" value={fields.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

              {errors.form && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2" role="alert">{errors.form}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 border-gray-200" disabled={isSubmitting}>
                  Back
                </Button>
                <Button type="submit" className="w-2/3 bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Get Quotation"}
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
                We have received your trip request. Our team will contact you with a quotation shortly.
              </p>
              {reference && (
                <p className="text-sm text-gray-700">
                  Your reference: <span className="font-mono font-semibold">{reference}</span>
                </p>
              )}
              <Button onClick={reset} variant="outline" className="border-gray-200 mt-2">
                Book Another Trip
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
