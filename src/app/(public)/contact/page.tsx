"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageSquareText } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(e.currentTarget)), department: "contact" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstFieldError = data.fields ? Object.values(data.fields)[0] : null;
        setError((firstFieldError as string) || data.error || "Could not send your message. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-800 to-red-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">We&apos;re Here to Help</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto">Get in touch with us for bookings, inquiries, or support — we&apos;re available 24/7</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 rounded-2xl p-10 text-center border border-emerald-100">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-6 border-gray-200">Send Another Message</Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" autoComplete="name" required className="h-11 rounded-xl border-gray-200 bg-gray-50" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" autoComplete="tel" className="h-11 rounded-xl border-gray-200 bg-gray-50" placeholder="Your phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required className="h-11 rounded-xl border-gray-200 bg-gray-50" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <select id="subject" name="subject" className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                    <option>Booking Inquiry</option>
                    <option>Tour Package</option>
                    <option>Corporate Travel</option>
                    <option>Feedback</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea id="message" name="message" required minLength={5} rows={5} className="flex w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" placeholder="How can we help you?" />
                </div>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3" role="alert">{error}</p>}
                <Button type="submit" className="w-full h-12 rounded-xl bg-red-700 hover:bg-red-800 text-white" disabled={submitting}>
                  {submitting ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-red-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Booking & Support</h4>
                    <a href="tel:+917353019999" className="text-gray-600 hover:text-red-700 transition-colors">+91 73530 19999</a>
                    <p className="text-xs text-gray-400 mt-0.5">Available 24/7</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <MessageSquareText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">WhatsApp</h4>
                    <a href="https://wa.me/917353019999" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-emerald-600 transition-colors">+91 73530 19999</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-red-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <a href="mailto:riyaz.abbas@yahoo.com" className="text-gray-600 hover:text-red-700 transition-colors">riyaz.abbas@yahoo.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-red-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Office Address</h4>
                    <p className="text-gray-600 text-sm">Next to Ganesha Temple, Ananda Rao Circle, Bangalore - 560 009</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" /> Working Hours
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Mon - Sat</span><span className="font-medium text-gray-900">6:00 AM — 10:00 PM</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Sunday</span><span className="font-medium text-gray-900">8:00 AM — 8:00 PM</span></div>
                <div className="flex justify-between pt-2 border-t border-amber-200"><span className="text-amber-700 font-medium">Emergency Support</span><span className="font-bold text-amber-800">24/7 Available</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl h-64 flex items-center justify-center border border-gray-100">
              <div className="text-center text-gray-400">
                <MapPin className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm">Google Maps Integration</p>
                <p className="text-xs">Bangalore, India</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
