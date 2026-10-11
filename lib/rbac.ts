import type { Role } from "@prisma/client";
import type { SessionUser } from "./session";
import { getSessionUser } from "./session";

/** Build a JSON error response. */
export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Return the authenticated session user, or null when unauthenticated. */
export async function getAuthUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

export type RequireRoleResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: Response };

/**
 * Require authentication, optionally restricted to specific roles.
 * With no roles, any authenticated user passes. Returns 401 when
 * unauthenticated, 403 when the user's role is not in the allowed list.
 */
export async function requireRole(...roles: Role[]): Promise<RequireRoleResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: jsonError("Authentication required", 401) };
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return { ok: false, response: jsonError("You do not have permission to access this resource", 403) };
  }
  return { ok: true, user };
}

export { roleHome } from "./roles";
