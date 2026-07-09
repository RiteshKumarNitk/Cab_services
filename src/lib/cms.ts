import { prisma } from "./prisma";
import { revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";

// ====== WEBSITE SETTINGS ======

const SETTINGS_CACHE_TAG = "website-settings";

export async function getWebsiteSettings() {
  const settings = await unstable_cache(
    async () => {
      const rows = await prisma.websiteSetting.findMany();
      const map: Record<string, string> = {};
      for (const row of rows) {
        map[row.key] = row.value;
      }
      return map;
    },
    ["website-settings"],
    { tags: [SETTINGS_CACHE_TAG], revalidate: 3600 }
  )();
  return settings;
}

export async function updateWebsiteSetting(key: string, value: string) {
  await prisma.websiteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidateTag(SETTINGS_CACHE_TAG, 'max');
}

export async function updateWebsiteSettings(
  settings: { key: string; value: string }[]
) {
  for (const s of settings) {
    await prisma.websiteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  revalidateTag(SETTINGS_CACHE_TAG, 'max');
}

// ====== NAVIGATION ======

const NAV_CACHE_TAG = "navigation";

export type NavItemWithChildren = {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  target: string;
  sortOrder: number;
  isActive: boolean;
  cssClass: string | null;
  children: NavItemWithChildren[];
};

export type NavigationWithItems = {
  id: string;
  name: string;
  slug: string;
  location: string;
  sortOrder: number;
  isActive: boolean;
  items: NavItemWithChildren[];
};

interface NavItemNode {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  target: string;
  sortOrder: number;
  isActive: boolean;
  cssClass: string | null;
  parentId: string | null;
  children: NavItemNode[];
}

function buildNavTree(items: Omit<NavItemNode, "children">[]): NavItemNode[] {
  const itemMap = new Map<string, NavItemNode>();

  for (const item of items) {
    itemMap.set(item.id, { ...item, children: [] });
  }

  const roots: NavItemNode[] = [];

  for (const item of items) {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (arr: NavItemNode[]) =>
    arr.sort((a, b) => a.sortOrder - b.sortOrder);
  const sortRecursive = (arr: NavItemNode[]) => {
    sort(arr);
    for (const node of arr) {
      if (node.children.length) sortRecursive(node.children);
    }
  };
  sortRecursive(roots);

  return roots;
}

export async function getNavigations() {
  const navs = await unstable_cache(
    async () => {
      const all = await prisma.navigation.findMany({
        where: { isActive: true },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            where: { isActive: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      return all.map((nav) => ({
        ...nav,
        items: buildNavTree(nav.items),
      }));
    },
    ["navigations"],
    { tags: [NAV_CACHE_TAG], revalidate: 3600 }
  )();
  return navs as NavigationWithItems[];
}

export async function getNavigationByLocation(location: string) {
  const navs = await getNavigations();
  return navs.find((n) => n.location === location) || null;
}

export async function getHeaderNavigation() {
  return getNavigationByLocation("HEADER");
}

export async function getFooterNavigation() {
  return getNavigationByLocation("FOOTER");
}

export async function revalidateNavigation() {
  revalidateTag(NAV_CACHE_TAG, 'max');
}

// ====== STATIC PAGES ======

const PAGES_CACHE_TAG = "static-pages";

export async function getPublishedPages() {
  return unstable_cache(
    async () => {
      return prisma.staticPage.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
      });
    },
    ["published-pages"],
    { tags: [PAGES_CACHE_TAG], revalidate: 3600 }
  )();
}

export async function getPageBySlug(slug: string) {
  const pages = await getPublishedPages();
  return pages.find((p) => p.slug === slug) || null;
}

export async function revalidatePages() {
  revalidateTag(PAGES_CACHE_TAG, 'max');
}

// ====== FAQs ======

export async function getPublishedFAQs() {
  return unstable_cache(
    async () => {
      return prisma.fAQ.findMany({
        where: { status: "ACTIVE" },
        include: { category: true },
        orderBy: { sortOrder: "asc" },
      });
    },
    ["published-faqs"],
    { tags: ["faqs"], revalidate: 3600 }
  )();
}

export async function getHomepageFAQs() {
  const faqs = await getPublishedFAQs();
  return faqs.filter((f) => f.showOnHomepage);
}

// ====== TESTIMONIALS ======

export async function getPublishedTestimonials() {
  return unstable_cache(
    async () => {
      return prisma.testimonial.findMany({
        where: { status: "ACTIVE" },
        orderBy: { displayOrder: "asc" },
      });
    },
    ["published-testimonials"],
    { tags: ["testimonials"], revalidate: 3600 }
  )();
}

export async function getFeaturedTestimonials() {
  const all = await getPublishedTestimonials();
  return all.filter((t) => t.featured);
}

// ====== GALLERY ======

export async function getGalleryItems(category?: string) {
  return unstable_cache(
    async () => {
      const where: Record<string, unknown> = { isActive: true };
      if (category) where.category = category;
      return prisma.galleryItem.findMany({
        where,
        orderBy: { sortOrder: "asc" },
      });
    },
    ["gallery", category || "all"],
    { tags: ["gallery"], revalidate: 3600 }
  )();
}

// ====== BLOG ======

export async function getPublishedPosts() {
  return unstable_cache(
    async () => {
      return prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedDate: "desc" },
      });
    },
    ["published-posts"],
    { tags: ["blog-posts"], revalidate: 3600 }
  )();
}

export async function getPostBySlug(slug: string) {
  const posts = await getPublishedPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function getFeaturedPosts() {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.featured).slice(0, 3);
}

// ====== CONTACT ======

export async function createContactSubmission(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  department?: string;
}) {
  return prisma.contactSubmission.create({ data });
}

// ====== FLEET ======

export async function getFleetVehicles() {
  return unstable_cache(
    async () => {
      return prisma.vehicle.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      });
    },
    ["fleet-vehicles"],
    { tags: ["fleet"], revalidate: 3600 }
  )();
}

export async function getFeaturedFleetVehicles() {
  const all = await getFleetVehicles();
  return all.filter((v) => v.isFeatured);
}

export async function getFleetVehicleBySlug(slug: string) {
  const all = await getFleetVehicles();
  return all.find((v) => v.slug === slug) || null;
}

// ====== PRICING ======

export async function getAllPricing() {
  return unstable_cache(
    async () => {
      return prisma.pricing.findMany();
    },
    ["pricing"],
    { tags: ["pricing"], revalidate: 3600 }
  )();
}

export async function getPricingPage() {
  return unstable_cache(
    async () => {
      return prisma.pricingPage.findFirst();
    },
    ["pricing-page"],
    { tags: ["pricing"], revalidate: 3600 }
  )();
}

// ====== HOMEPAGE SECTIONS ======

export async function getHomepageSections() {
  return unstable_cache(
    async () => {
      return prisma.homepageSection.findMany({
        where: { isEnabled: true },
        orderBy: { sortOrder: "asc" },
      });
    },
    ["homepage-sections"],
    { tags: ["homepage"], revalidate: 3600 }
  )();
}

export async function getHomepageSectionByType(type: string) {
  const sections = await getHomepageSections();
  return sections.find((s) => s.type === type) || null;
}

// ====== FORM SUBMISSIONS ======

export async function getFormSubmissions(type?: string) {
  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  return prisma.formSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

// ====== EMAIL TEMPLATES ======

export async function getEmailTemplates() {
  return unstable_cache(
    async () => {
      return prisma.emailTemplate.findMany();
    },
    ["email-templates"],
    { tags: ["email-templates"], revalidate: 3600 }
  )();
}

export async function getEmailTemplate(key: string) {
  const templates = await getEmailTemplates();
  return templates.find((t) => t.key === key) || null;
}

// ====== DASHBOARD STATS ======

export async function getDashboardStats() {
  const [totalBookings, pendingBookings, totalVehicles, totalDrivers, totalCustomers, unreadMessages, recentSubmissions] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.vehicle.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "DRIVER" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.formSubmission.count({ where: { isRead: false } }),
    prisma.formSubmission.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    totalBookings,
    pendingBookings,
    totalVehicles,
    totalDrivers,
    totalCustomers,
    unreadMessages,
    recentSubmissions,
  };
}

// ====== COMMON REVALIDATION ======

export function revalidateAllCms() {
  revalidateTag(SETTINGS_CACHE_TAG, 'max');
  revalidateTag(NAV_CACHE_TAG, 'max');
  revalidateTag(PAGES_CACHE_TAG, 'max');
  revalidateTag("faqs", 'max');
  revalidateTag("testimonials", 'max');
  revalidateTag("gallery", 'max');
  revalidateTag("blog-posts", 'max');
}
