import { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions | Aradhana Travel",
  description: "Read the terms and conditions for using Aradhana Travel Services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Terms & Conditions</h1>
          <p className="text-gray-500 mt-2">Last updated: January 2026</p>
        </div>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>Welcome to Aradhana Travel Services. By accessing our website and using our services, you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Booking & Reservations</h2>
            <p>All bookings are subject to availability and confirmation. We reserve the right to refuse or cancel any booking at our discretion. Bookings are confirmed only after receipt of payment or advance amount as specified.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cancellation Policy</h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Cancellations made 24 hours before pickup: Full refund minus processing fees</li>
              <li>Cancellations within 24 hours of pickup: 50% cancellation charge</li>
              <li>No-shows: No refund will be provided</li>
              <li>Refunds will be processed within 7-10 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pricing & Payment</h2>
            <p>All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. We reserve the right to modify pricing at any time. Payment can be made via cash, UPI, credit/debit card, or bank transfer.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Customer Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide accurate pickup location and contact information</li>
              <li>Ensure luggage does not exceed the vehicle&apos;s capacity</li>
              <li>Behave respectfully towards the driver and vehicle</li>
              <li>Report any issues or damages immediately</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>Aradhana Travel shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our maximum liability shall not exceed the total fare paid for the specific booking.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Modifications</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of our services after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>For questions about these terms, please contact us at <a href="mailto:info@aradhanatravel.com" className="text-red-700 hover:underline">info@aradhanatravel.com</a> or call <a href="tel:+917353019999" className="text-red-700 hover:underline">+91 73530 19999</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
