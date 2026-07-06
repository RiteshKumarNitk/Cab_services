import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">AT</span>
              </div>
              <span className="text-xl font-bold text-white">Aradhana Travel</span>
            </div>
            <p className="text-sm">Your trusted cab service & tour operator in Rajasthan since 2015.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link href="/login" className="block hover:text-amber-400 transition-colors">Sign In</Link>
              <Link href="/register" className="block hover:text-amber-400 transition-colors">Register</Link>
              <Link href="/tours" className="block hover:text-amber-400 transition-colors">Rajasthan Tours</Link>
              <Link href="/destinations" className="block hover:text-amber-400 transition-colors">Top Destinations</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm">
              <p>📞 +91 98765 43210</p>
              <p>📍 G-3A, Rajputana Tower, Khatipura, Jaipur</p>
              <p>✉️ info@aradhanatravel.com</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-900 pt-8 text-center text-sm flex flex-col sm:flex-row justify-between items-center">
          <p>&copy; 2026 Aradhana Travel Service. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-white">Facebook</Link>
            <Link href="#" className="hover:text-white">Instagram</Link>
            <Link href="#" className="hover:text-white">Twitter</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
