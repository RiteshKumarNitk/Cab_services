import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/cms";
import { getFleetVehicles } from "@/lib/cms";
import { tourPackages } from "@/lib/tour-packages";
import { destinations } from "@/lib/destinations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aradhanatravel.com";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/services/outstation`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/services/airport`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/services/local`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/fleet`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/destinations`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/tours`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/offers`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/testimonials`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const [blogPosts, fleetVehicles] = await Promise.all([
    getPublishedPosts(),
    getFleetVehicles(),
  ]);

  const blogUrls = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedDate || new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const fleetUrls = fleetVehicles.map((v) => ({
    url: `${baseUrl}/fleet/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const tourUrls = tourPackages.map((pkg) => ({
    url: `${baseUrl}/tours/${pkg.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const destinationUrls = destinations.map((d) => ({
    url: `${baseUrl}/destinations/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...blogUrls,
    ...fleetUrls,
    ...tourUrls,
    ...destinationUrls,
  ];
}
