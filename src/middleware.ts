import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role as string | undefined;

  // Public routes
  const publicRoutes = ["/login", "/register", "/", "/destinations", "/tours", "/contact", "/services"];
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/destinations") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/gallery") ||
    pathname.startsWith("/fleet") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/testimonials")
  ) {
    return NextResponse.next();
  }

  // Allow all static page catch-all routes (single segment slugs like /about, /privacy-policy)
  const staticPageSlugs = ["/about", "/privacy-policy", "/terms", "/terms-and-conditions", "/refund-policy", "/cancellation-policy", "/careers", "/partners", "/corporate-booking", "/wedding-booking", "/pilgrimage-tours"];
  if (staticPageSlugs.includes(pathname)) {
    return NextResponse.next();
  }

  const adminRoles = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "BOOKING_MANAGER", "FLEET_MANAGER", "DRIVER_MANAGER", "SUPPORT_EXECUTIVE"];

  // Admin Login route
  if (pathname === "/admin/login") {
    if (isLoggedIn && adminRoles.includes(role!)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!adminRoles.includes(role!)) {
      return NextResponse.redirect(new URL("/", req.url)); // Customers trying to access admin
    }
  }

  // Customer routes protection (e.g. /dashboard)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/customer")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // Driver routes protection
  if (pathname.startsWith("/driver")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "DRIVER") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
