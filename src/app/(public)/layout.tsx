import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileCtaBar } from "@/components/layout/mobile-cta-bar";
import { getHeaderNavigation, getFooterNavigation, getWebsiteSettings } from "@/lib/cms";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerNav, footerNav, settings] = await Promise.all([
    getHeaderNavigation(),
    getFooterNavigation(),
    getWebsiteSettings(),
  ]);

  const headerItems = headerNav?.items || [];
  const footerItems = footerNav?.items || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar navigation={JSON.parse(JSON.stringify(headerItems))} settings={settings} />
      <main className="flex-grow pb-16 lg:pb-0">{children}</main>
      <Footer settings={settings} navigation={JSON.parse(JSON.stringify(footerItems))} />
      <MobileCtaBar phone={settings?.phone_primary} whatsapp={settings?.whatsapp_number} />
    </div>
  );
}
