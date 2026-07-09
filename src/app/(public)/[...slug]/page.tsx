import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/cms";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function DynamicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = await getPageBySlug(slugStr);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {page.bannerImage && (
        <div
          className="h-[40vh] bg-cover bg-center relative"
          style={{ backgroundImage: `url(${page.bannerImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-xl">
              {page.title}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!page.bannerImage && (
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{page.title}</h1>
          </div>
        )}

        <Link href="/" className="text-red-600 font-medium flex items-center mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>

        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-red-600"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = await getPageBySlug(slugStr);

  if (!page) return { title: "Not Found" };

  return {
    title: page.metaTitle || `${page.title} | Aradhana Travel`,
    description: page.metaDesc || undefined,
    keywords: page.metaKeywords || undefined,
    openGraph: page.ogImage ? { images: [page.ogImage] } : undefined,
  };
}
