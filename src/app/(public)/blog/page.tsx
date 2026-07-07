import { getPublishedPosts } from "@/lib/cms";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";

export default async function BlogListingPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Travel tips, guides, and stories from Rajasthan
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {post.featuredImage ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-blue-300">
                      {post.title.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="p-6">
                  {post.category && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                      {post.category}
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.shortDesc && (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{post.shortDesc}</p>
                  )}
                  <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                    {post.author && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {post.author}
                      </span>
                    )}
                    {post.publishedDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{" "}
                        {new Date(post.publishedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center text-amber-600 text-sm font-medium group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
