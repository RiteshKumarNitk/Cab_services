import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role as string | undefined;

  // Public routes
  const publicRoutes = ["/auth/login", "/auth/register", "/"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected routes
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/driver") && role !== "DRIVER") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
