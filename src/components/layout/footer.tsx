import Link from "next/link";

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
  const footerDesc = settings?.footer_description || "Your trusted cab service & tour operator in Rajasthan since 2015.";
  const footerCopyright = settings?.footer_copyright || `&copy; 2026 ${companyName}. All rights reserved.`;
  const phonePrimary = settings?.phone_primary || "+91 98765 43210";
  const officeAddress = settings?.office_address || "G-3A, Rajputana Tower, Khatipura, Jaipur";
  const emailPrimary = settings?.email_primary || "info@aradhanatravel.com";
  const socialFacebook = settings?.social_facebook || "#";
  const socialInstagram = settings?.social_instagram || "#";
  const socialTwitter = settings?.social_twitter || "#";
  const socialLinkedin = settings?.social_linkedin || "";
  const socialYoutube = settings?.social_youtube || "";

  return (
    <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {companyName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xl font-bold text-white">{companyName}</span>
            </div>
            <p className="text-sm">{footerDesc}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm">
              {navigation && navigation.length > 0 ? (
                navigation.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="block hover:text-amber-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <>
                  <Link href="/login" className="block hover:text-amber-400 transition-colors">Sign In</Link>
                  <Link href="/register" className="block hover:text-amber-400 transition-colors">Register</Link>
                  <Link href="/tours" className="block hover:text-amber-400 transition-colors">Rajasthan Tours</Link>
                  <Link href="/destinations" className="block hover:text-amber-400 transition-colors">Top Destinations</Link>
                </>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm">
              <p>📞 {phonePrimary}</p>
              <p>📍 {officeAddress}</p>
              <p>✉️ {emailPrimary}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-900 pt-8 text-center text-sm flex flex-col sm:flex-row justify-between items-center">
          <p dangerouslySetInnerHTML={{ __html: footerCopyright }} />
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href={socialFacebook} className="hover:text-white">Facebook</Link>
            <Link href={socialInstagram} className="hover:text-white">Instagram</Link>
            <Link href={socialTwitter} className="hover:text-white">Twitter</Link>
            {socialLinkedin && <Link href={socialLinkedin} className="hover:text-white">LinkedIn</Link>}
            {socialYoutube && <Link href={socialYoutube} className="hover:text-white">YouTube</Link>}
          </div>
        </div>
      </div>
    </footer>
  );
}
