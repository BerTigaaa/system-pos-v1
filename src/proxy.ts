import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/trial-expired",
  "/inactive",
];

const publicPathPrefixes = ["/order/", "/images/"];

const publicFileExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"];

export default auth(function proxy(req) {
  const { nextUrl } = req;

  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicPathPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    publicFileExtensions.some((extension) => pathname.endsWith(extension));

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isAdminRoute && user?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|icon-192.png|icon-512.png).*)",
  ],
};
