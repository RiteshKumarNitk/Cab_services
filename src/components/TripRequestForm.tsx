"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Clock, Users, Briefcase, Car } from "lucide-react";

export function TripRequestForm() {
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("ONE_WAY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: implement server action submission
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3); // Success step
    }, 1500);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-md">
      <CardContent className="p-0">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Request a Cab</h2>
          <p className="text-blue-100 mt-1">Get an instant quotation for your trip</p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={(e) => { e.preventDefault(); setStep(2); }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={tripType === "ONE_WAY" ? "default" : "outline"}
                    onClick={() => setTripType("ONE_WAY")}
                    className={tripType === "ONE_WAY" ? "bg-blue-600" : ""}
                  >
                    One Way
                  </Button>
                  <Button
                    type="button"
                    variant={tripType === "ROUND_TRIP" ? "default" : "outline"}
                    onClick={() => setTripType("ROUND_TRIP")}
                    className={tripType === "ROUND_TRIP" ? "bg-blue-600" : ""}
                  >
                    Round Trip
                  </Button>
                  <Button
                    type="button"
                    variant={tripType === "MULTI_CITY" ? "default" : "outline"}
                    onClick={() => setTripType("MULTI_CITY")}
                    className={tripType === "MULTI_CITY" ? "bg-blue-600" : ""}
                  >
                    Multi City
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Pickup Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input className="pl-10" placeholder="Enter pickup city or address" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Drop Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-400" />
                    <Input className="pl-10" placeholder="Enter drop city or address" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pickup Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input type="date" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pickup Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input type="time" className="pl-10" required />
                    </div>
                  </div>
                </div>

                {tripType !== "ONE_WAY" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Return Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input type="date" className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Return Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input type="time" className="pl-10" required />
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 mt-4">
                  Continue
                </Button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Passengers</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input type="number" min="1" max="15" defaultValue="2" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Luggage Bags</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input type="number" min="0" max="10" defaultValue="2" className="pl-10" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Car Category</Label>
                  <Select defaultValue="SEDAN">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEDAN">Sedan (Dzire, Etios)</SelectItem>
                      <SelectItem value="SUV">SUV (Innova, Ertiga)</SelectItem>
                      <SelectItem value="HATCHBACK">Hatchback (Swift, Baleno)</SelectItem>
                      <SelectItem value="TEMPO_TRAVELLER">Tempo Traveller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Special Instructions</Label>
                  <Textarea placeholder="Any specific requirements? (e.g., child seat, extra legroom)" />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                    Back
                  </Button>
                  <Button type="submit" className="w-2/3 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Request Quotation"}
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
                <p className="text-gray-600">
                  We have received your trip request. Our team will send you a quotation shortly.
                </p>
                <Button onClick={() => setStep(1)} variant="outline" className="mt-4">
                  Make Another Request
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
