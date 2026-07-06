export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Contact Us</h1>
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <p className="text-lg text-gray-600 mb-6 text-center">
          Have a question or need to book a special trip? Reach out to us anytime!
        </p>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">📍</div>
            <div>
              <h3 className="font-bold text-gray-900">Address</h3>
              <p className="text-gray-600">123 Aradhana Travels, New Delhi, India</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">📞</div>
            <div>
              <h3 className="font-bold text-gray-900">Phone / WhatsApp</h3>
              <p className="text-gray-600">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">✉️</div>
            <div>
              <h3 className="font-bold text-gray-900">Email</h3>
              <p className="text-gray-600">support@aradhanatravels.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
