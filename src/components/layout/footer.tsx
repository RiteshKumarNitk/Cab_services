import Link from "next/link";
import { Phone, Mail, MapPin, Car } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  url: string;
  target: string;
  children?: NavItem[];
};

export function Footer({
  settings,
  navigation,
}: {
  settings?: Record<string, string>;
  navigation?: NavItem[];
}) {
  const companyName = settings?.company_name || "Aradhana Travel";
  const companyLogo = settings?.company_logo || "";
  const footerDesc = settings?.footer_description || "Book Aradhana Travel online on website and from your mobile with few easy steps. Go to My Bookings to manage your account.";
  const footerCopyright = settings?.footer_copyright || `&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.`;
  const phonePrimary = settings?.phone_primary || "+91 73530 19999";
  const officeAddress = settings?.office_address || "Next to Ganesha Temple, Ananda Rao Circle, Bangalore - 560 009.";
  const emailPrimary = settings?.email_primary || "riyaz.abbas@yahoo.com";
  const socialFacebook = settings?.social_facebook || "#";
  const socialInstagram = settings?.social_instagram || "#";
  const socialTwitter = settings?.social_twitter || "#";
  const socialYoutube = settings?.social_youtube || "";
  const poweredBy = "EzeeInfo Cloud Solutions";

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center">
                  <Car className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="text-lg font-bold text-white">{companyName}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{footerDesc}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <div className="space-y-2.5 text-sm">
              {navigation && navigation.length > 0 ? (
                navigation.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="block text-gray-400 hover:text-red-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <>
                  <Link href="/faq" className="block text-gray-400 hover:text-red-400 transition-colors">FAQ</Link>
                  <Link href="/terms" className="block text-gray-400 hover:text-red-400 transition-colors">Terms &amp; Conditions</Link>
                  <Link href="/privacy-policy" className="block text-gray-400 hover:text-red-400 transition-colors">Privacy Policy</Link>
                  <Link href="/feedback" className="block text-gray-400 hover:text-red-400 transition-colors">Feedback</Link>
                  <Link href="/contact" className="block text-gray-400 hover:text-red-400 transition-colors">Contact Us</Link>
                  <Link href="/destinations" className="block text-gray-400 hover:text-red-400 transition-colors">Destinations</Link>
                  <Link href="/admin/login" className="block text-gray-400 hover:text-red-400 transition-colors">Admin Login</Link>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Manage Booking</h4>
            <div className="space-y-2.5 text-sm">
              <Link href="/booking/download" className="block text-gray-400 hover:text-red-400 transition-colors">Download Ticket</Link>
              <Link href="/booking/track" className="block text-gray-400 hover:text-red-400 transition-colors">Track Your Cab</Link>
              <Link href="/booking/cancel" className="block text-gray-400 hover:text-red-400 transition-colors">Cancel Booking</Link>
              <Link href="/customer/bookings" className="block text-gray-400 hover:text-red-400 transition-colors">My Bookings</Link>
              <Link href="/booking/reschedule" className="block text-gray-400 hover:text-red-400 transition-colors">Reschedule Trip</Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Get In Touch</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
                <span className="text-gray-400">{officeAddress}</span>
              </div>
              <a href={`mailto:${emailPrimary}`} className="flex items-center gap-2 hover:text-red-400 transition-colors">
                <Mail className="h-4 w-4 shrink-0 text-red-400" />
                <span>{emailPrimary}</span>
              </a>
              <a href={`tel:${phonePrimary.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-red-400 transition-colors">
                <Phone className="h-4 w-4 shrink-0 text-red-400" />
                <span>{phonePrimary}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p dangerouslySetInnerHTML={{ __html: footerCopyright }} />
          <p>
            Powered by <span className="text-gray-400">{poweredBy}</span>
          </p>
          <div className="flex gap-3">
            <a href={socialFacebook} className="hover:text-red-400 transition-colors" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href={socialInstagram} className="hover:text-red-400 transition-colors" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href={socialTwitter} className="hover:text-red-400 transition-colors" target="_blank" rel="noopener noreferrer">Twitter</a>
            {socialYoutube && <a href={socialYoutube} className="hover:text-red-400 transition-colors" target="_blank" rel="noopener noreferrer">YouTube</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
