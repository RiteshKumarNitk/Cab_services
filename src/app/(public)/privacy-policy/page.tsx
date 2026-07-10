import { Metadata } from "next";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Aradhana Travel",
  description: "Aradhana Travel's privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-500 mt-2">Last updated: January 2026</p>
        </div>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email address, phone number, pickup/drop locations, and payment details. We also automatically collect certain technical data like IP address, browser type, and usage patterns.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Process and manage your bookings</li>
              <li>Communicate about your rides and account</li>
              <li>Improve our services and customer experience</li>
              <li>Send promotional offers (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with trusted third parties who assist in operating our services (payment processors, maps providers) under strict confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may opt out of marketing communications at any time. Contact us to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact Us</h2>
            <p>If you have questions about this privacy policy, please contact our Data Protection Officer at <a href="mailto:privacy@aradhanatravel.com" className="text-red-700 hover:underline">privacy@aradhanatravel.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
