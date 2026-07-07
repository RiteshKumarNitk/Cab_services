import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
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
      <main className="flex-grow">{children}</main>
      <Footer settings={settings} navigation={JSON.parse(JSON.stringify(footerItems))} />
    </div>
  );
}
