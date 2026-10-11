import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/session";
import { roleHome } from "@/lib/rbac";
import { checkCsrf, csrfForbidden } from "@/lib/csrf";

// Next.js 16 convention: request gating lives in proxy.ts (not middleware.ts).

const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/gallery",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
]);

const ROLE_PREFIXES: { prefix: string; role: Role }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/management", role: "MANAGEMENT" },
  { prefix: "/student", role: "STUDENT" },
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/images" || pathname.startsWith("/images/")) return true;
  if (pathname.startsWith("/icon")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

function rolePrefixFor(pathname: string) {
  return ROLE_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const CSRF_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection for state-changing API calls: same-origin browser
  // requests carry a matching Origin/Referer header, while a cross-site
  // form or fetch forgery will not. The Origin header is absent on
  // non-browser clients (curl, server-to-server), which are allowed through.
  if (pathname.startsWith("/api/") && CSRF_METHODS.has(request.method)) {
    if (!checkCsrf(request)) return csrfForbidden();
  }

  if (isPublicPath(pathname)) {
    // Signed-in visitors never need the auth pages; send them home.
    if (pathname === "/login" || pathname === "/register") {
      const user = await getSessionUser();
      if (user) {
        return NextResponse.redirect(new URL(roleHome(user.role), request.url));
      }
    }
    return NextResponse.next();
  }

  const gated = rolePrefixFor(pathname);
  if (gated) {
    const user = await getSessionUser();
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== gated.role) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icon).*)"],
};
