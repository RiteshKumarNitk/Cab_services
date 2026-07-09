import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-800 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-red-100">We&apos;d love to hear from you</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Phone / WhatsApp</h3>
            <a href="tel:+917353019999" className="text-gray-500 hover:text-red-600 transition-colors">+91 73530 19999</a>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
            <a href="mailto:riyaz.abbas@yahoo.com" className="text-gray-500 hover:text-red-600 transition-colors">riyaz.abbas@yahoo.com</a>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
            <p className="text-gray-500 text-sm">Next to Ganesha Temple, Ananda Rao Circle, Bangalore - 560 009</p>
          </div>
        </div>
      </div>
    </div>
  );
}
