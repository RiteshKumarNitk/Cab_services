"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Star, Send, CheckCircle } from "lucide-react";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md mx-auto px-4">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h1>
          <p className="text-gray-500 mb-8">Your feedback helps us improve our service. We appreciate your time.</p>
          <Button onClick={() => { setSubmitted(false); setName(""); setEmail(""); setCategory(""); setRating(0); setMessage(""); }} className="bg-red-700 hover:bg-red-800">
            Submit Another Feedback
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-500 mt-2">We&apos;d love to hear from you. Share your experience.</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking">Booking Experience</SelectItem>
                    <SelectItem value="driver">Driver Service</SelectItem>
                    <SelectItem value="vehicle">Vehicle Quality</SelectItem>
                    <SelectItem value="website">Website Experience</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="p-1 transition-colors">
                      <Star className={`h-6 w-6 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Tell us about your experience..." rows={4} />
              </div>
              <Button type="submit" className="w-full h-11 bg-red-700 hover:bg-red-800" disabled={loading}>
                <Send className="h-4 w-4 mr-2" /> {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
