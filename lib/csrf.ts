import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin check for state-changing API requests.
 *
 * Browser-driven cross-site request forgery (a malicious site submitting a
 * form or fetch to our API) will not carry our Origin/Referer, or will carry
 * the attacker's. When an Origin (or Referer) header is present we require
 * its host to match the request host. Non-browser clients (curl,
 * server-to-server) send neither header and are allowed through.
 *
 * Defense in depth: session cookies are also SameSite=Lax + HttpOnly.
 */
export function checkCsrf(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidate = origin ?? referer;
  if (!candidate) return true;

  const host =
    request.headers.get("host") ?? request.nextUrl.host ?? "";
  try {
    const url = new URL(candidate);
    return url.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/** 403 response used when the CSRF check fails. */
export function csrfForbidden(): NextResponse {
  return NextResponse.json(
    { error: "Cross-site request rejected. Please reload the page and try again." },
    { status: 403 },
  );
}
