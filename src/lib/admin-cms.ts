"use server";

import { updateTag } from "next/cache";
import { prisma } from "./prisma";
import { auth } from "./auth";

// ====== SETTINGS ======

export async function saveWebsiteSettings(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const entries: { key: string; value: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      entries.push({ key, value });
    }
  }

  for (const entry of entries) {
    await prisma.websiteSetting.upsert({
      where: { key: entry.key },
      update: { value: entry.value },
      create: { key: entry.key, value: entry.value },
    });
  }

  updateTag("website-settings");
  return { success: true };
}

export async function saveSetting(key: string, value: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.websiteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  updateTag("website-settings");
  return { success: true };
}

// ====== NAVIGATION ======

export async function createNavigation(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const location = formData.get("location") as string;

  await prisma.navigation.create({
    data: { name, slug, location: location as any },
  });

  updateTag("navigation");
  return { success: true };
}

export async function updateNavigation(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {};
  const name = formData.get("name");
  if (name) data.name = name;
  const slug = formData.get("slug");
  if (slug) data.slug = slug;
  const location = formData.get("location");
  if (location) data.location = location;
  const isActive = formData.get("isActive");
  if (isActive !== null) data.isActive = isActive === "true";

  await prisma.navigation.update({ where: { id }, data });
  updateTag("navigation");
  return { success: true };
}

export async function deleteNavigation(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.navigation.delete({ where: { id } });
  updateTag("navigation");
  return { success: true };
}

export async function createNavItem(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const navigationId = formData.get("navigationId") as string;
  const label = formData.get("label") as string;
  const url = formData.get("url") as string;
  const parentId = formData.get("parentId") as string || null;
  const target = (formData.get("target") as string) || "_self";

  await prisma.navigationItem.create({
    data: {
      navigationId,
      label,
      url,
      parentId,
      target,
    },
  });

  updateTag("navigation");
  return { success: true };
}

export async function updateNavItem(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {};
  const label = formData.get("label");
  if (label) data.label = label;
  const url = formData.get("url");
  if (url) data.url = url;
  const target = formData.get("target");
  if (target) data.target = target;
  const sortOrder = formData.get("sortOrder");
  if (sortOrder) data.sortOrder = parseInt(sortOrder as string);
  const isActive = formData.get("isActive");
  if (isActive !== null) data.isActive = isActive === "true";

  await prisma.navigationItem.update({ where: { id }, data });
  updateTag("navigation");
  return { success: true };
}

export async function deleteNavItem(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.navigationItem.delete({ where: { id } });
  updateTag("navigation");
  return { success: true };
}

// ====== STATIC PAGES ======

export async function createStaticPage(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const content = (formData.get("content") as string) || "";

  await prisma.staticPage.create({
    data: { title, slug, content },
  });

  updateTag("static-pages");
  return { success: true };
}

export async function updateStaticPage(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {};
  for (const [key, value] of formData.entries()) {
    if (key === "sortOrder" || key === "showInMenu" || key === "showInFooter") {
      data[key] = value === "true" || value === "on";
    } else {
      data[key] = value;
    }
  }

  await prisma.staticPage.update({ where: { id }, data });
  updateTag("static-pages");
  return { success: true };
}

export async function deleteStaticPage(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.staticPage.delete({ where: { id } });
  updateTag("static-pages");
  return { success: true };
}

// ====== FAQS ======

export async function createFAQ(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;

  await prisma.fAQ.create({ data: { question, answer } });
  updateTag("faqs");
  return { success: true };
}

export async function updateFAQ(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {};
  for (const [key, value] of formData.entries()) {
    if (["searchEnabled", "showOnHomepage", "showOnFAQPage"].includes(key)) {
      data[key] = value === "true" || value === "on";
    } else if (key === "sortOrder") {
      data[key] = parseInt(value as string);
    } else {
      data[key] = value;
    }
  }

  await prisma.fAQ.update({ where: { id }, data });
  updateTag("faqs");
  return { success: true };
}

export async function deleteFAQ(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.fAQ.delete({ where: { id } });
  updateTag("faqs");
  return { success: true };
}

// ====== TESTIMONIALS ======

export async function createTestimonial(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const customerName = formData.get("customerName") as string;
  const review = formData.get("review") as string;

  await prisma.testimonial.create({
    data: {
      customerName,
      review,
      rating: parseInt((formData.get("rating") as string) || "5"),
    },
  });

  updateTag("testimonials");
  return { success: true };
}

export async function updateTestimonial(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {};
  for (const [key, value] of formData.entries()) {
    if (["rating", "displayOrder", "sortOrder"].includes(key)) {
      data[key] = parseInt(value as string);
    } else if (["featured"].includes(key)) {
      data[key] = value === "true" || value === "on";
    } else {
      data[key] = value;
    }
  }

  await prisma.testimonial.update({ where: { id }, data });
  updateTag("testimonials");
  return { success: true };
}

export async function deleteTestimonial(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.testimonial.delete({ where: { id } });
  updateTag("testimonials");
  return { success: true };
}

// ====== GALLERY ======

export async function createGalleryItem(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const imageUrl = formData.get("imageUrl") as string;
  const category = (formData.get("category") as string) || "general";

  await prisma.galleryItem.create({ data: { imageUrl, category } });
  updateTag("gallery");
  return { success: true };
}

export async function deleteGalleryItem(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.galleryItem.delete({ where: { id } });
  updateTag("gallery");
  return { success: true };
}

// ====== BLOG ======

export async function createBlogPost(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const content = (formData.get("content") as string) || "";
  const shortDesc = (formData.get("shortDesc") as string) || "";

  await prisma.blogPost.create({ data: { title, slug, content, shortDesc } });
  updateTag("blog-posts");
  return { success: true };
}

export async function updateBlogPost(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {};
  for (const [key, value] of formData.entries()) {
    if (["featured"].includes(key)) {
      data[key] = value === "true" || value === "on";
    } else if (key === "publishedDate" && value) {
      data[key] = new Date(value as string);
    } else {
      data[key] = value;
    }
  }

  await prisma.blogPost.update({ where: { id }, data });
  updateTag("blog-posts");
  return { success: true };
}

export async function deleteBlogPost(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.blogPost.delete({ where: { id } });
  updateTag("blog-posts");
  return { success: true };
}

// ====== CONTACT SUBMISSIONS ======

export async function markContactRead(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "SUPPORT_EXECUTIVE"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.contactSubmission.update({
    where: { id },
    data: { isRead: true },
  });

  return { success: true };
}

export async function deleteContactSubmission(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.contactSubmission.delete({ where: { id } });
  return { success: true };
}

// ====== FLEET (CMS vehicles) ======

export async function saveVehicle(id: string | null, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "FLEET_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    model: formData.get("model") as string,
    type: formData.get("type") as string,
    seats: parseInt(formData.get("seats") as string) || 4,
    luggage: parseInt(formData.get("luggage") as string) || 2,
    ac: formData.get("ac") === "true",
    fuelType: (formData.get("fuelType") as string) || "DIESEL",
    transmission: (formData.get("transmission") as string) || "MANUAL",
    pricePerKm: parseFloat(formData.get("pricePerKm") as string) || 0,
    minKmPerDay: parseFloat(formData.get("minKmPerDay") as string) || 0,
    nightCharge: parseFloat(formData.get("nightCharge") as string) || 0,
    shortDescription: (formData.get("shortDescription") as string) || "",
    longDescription: (formData.get("longDescription") as string) || "",
    features: (formData.get("features") as string || "").split("\n").filter(Boolean),
    images: (formData.get("images") as string || "").split("\n").filter(Boolean),
    isFeatured: formData.get("isFeatured") === "true",
    displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
    seoTitle: (formData.get("seoTitle") as string) || "",
    seoDesc: (formData.get("seoDesc") as string) || "",
    isActive: formData.get("isActive") !== "false",
  };

  // Copy name to model if model is empty
  if (!data.model) data.model = data.name;

  if (id) {
    await prisma.vehicle.update({ where: { id }, data });
  } else {
    // Generate a plate number if not provided
    const plateNumber = (formData.get("plateNumber") as string) || `CMS-${Date.now()}`;
    await prisma.vehicle.create({ data: { ...data, plateNumber } });
  }

  updateTag("fleet");
  return { success: true };
}

export async function deleteVehicle(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "FLEET_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  await prisma.vehicle.delete({ where: { id } });
  updateTag("fleet");
  return { success: true };
}

// ====== PRICING ======

export async function savePricing(vehicleType: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && value) {
      data[key] = isNaN(Number(value)) ? value : parseFloat(value);
    }
  }

  await prisma.pricing.upsert({
    where: { vehicleType: vehicleType as any },
    update: data,
    create: { vehicleType: vehicleType as any, ...data },
  });

  updateTag("pricing");
  return { success: true };
}

export async function savePricingPage(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const entries = Array.from(formData.entries());
  const data: any = {};
  for (const [key, value] of entries) {
    if (key === "gstPercentage") {
      data[key] = parseFloat(value as string) || 0;
    } else {
      data[key] = value as string;
    }
  }

  const existing = await prisma.pricingPage.findFirst();
  if (existing) {
    await prisma.pricingPage.update({ where: { id: existing.id }, data });
  } else {
    await prisma.pricingPage.create({ data });
  }

  updateTag("pricing");
  return { success: true };
}

// ====== FLEET & PRICING HELPERS ======

export async function getFleetVehicles() {
  return prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getPricingPage() {
  return prisma.pricingPage.findFirst();
}

// ====== HOMEPAGE SECTIONS ======

export async function saveHomepageSection(id: string | null, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const data: any = {
    type: formData.get("type") as string,
    title: (formData.get("title") as string) || "",
    subtitle: (formData.get("subtitle") as string) || "",
    content: (formData.get("content") as string) || "{}",
    image: (formData.get("image") as string) || null,
    video: (formData.get("video") as string) || null,
    ctaText: (formData.get("ctaText") as string) || null,
    ctaLink: (formData.get("ctaLink") as string) || null,
    ctaSecondaryText: (formData.get("ctaSecondaryText") as string) || null,
    ctaSecondaryLink: (formData.get("ctaSecondaryLink") as string) || null,
    sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    isEnabled: formData.get("isEnabled") !== "false",
  };

  if (id) {
    await prisma.homepageSection.update({ where: { id }, data });
  } else {
    await prisma.homepageSection.create({ data });
  }

  updateTag("homepage");
  return { success: true };
}

export async function deleteHomepageSection(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }
  await prisma.homepageSection.delete({ where: { id } });
  updateTag("homepage");
  return { success: true };
}

// ====== FORM SUBMISSIONS ======

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const subject = (formData.get("subject") as string) || null;
  const message = (formData.get("message") as string) || "";
  const type = (formData.get("type") as string) || "contact";

  await prisma.formSubmission.create({
    data: { type, name, email, phone, subject, message },
  });

  return { success: true };
}

export async function markFormRead(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  await prisma.formSubmission.update({ where: { id }, data: { isRead: true } });
  return { success: true };
}

export async function deleteFormSubmission(id: string) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }
  await prisma.formSubmission.delete({ where: { id } });
  return { success: true };
}

// ====== EMAIL TEMPLATES ======

export async function saveEmailTemplate(key: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized");
  }

  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  await prisma.emailTemplate.upsert({
    where: { key },
    update: { subject, body },
    create: { key, subject, body },
  });

  updateTag("email-templates");
  return { success: true };
}
