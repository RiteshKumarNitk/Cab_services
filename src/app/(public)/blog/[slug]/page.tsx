import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/lib/cms";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {post.featuredImage && (
        <div
          className="h-[50vh] bg-cover bg-center relative"
          style={{ backgroundImage: `url(${post.featuredImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-xl max-w-4xl px-4">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="text-amber-600 font-medium flex items-center mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
        </Link>

        {!post.featuredImage && (
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{post.title}</h1>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
          {post.author && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" /> {post.author}
            </span>
          )}
          {post.publishedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />{" "}
              {new Date(post.publishedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {post.category && (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
              {post.category}
            </span>
          )}
        </div>

        {post.shortDesc && (
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">{post.shortDesc}</p>
        )}

        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-amber-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.metaTitle || `${post.title} | Aradhana Travel Blog`,
    description: post.metaDesc || post.shortDesc || undefined,
    keywords: post.metaKeywords || undefined,
    openGraph: post.featuredImage ? { images: [post.featuredImage] } : undefined,
  };
}
