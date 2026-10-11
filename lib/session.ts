import { cookies } from "next/headers";
import type { Role, UserStatus } from "@prisma/client";
import { db } from "./db";
import { generateOpaqueToken, sha256Hex } from "./tokens";

export const SESSION_COOKIE = "aimt_session";
export const SESSION_MAX_AGE_SECONDS = 86400; // 1 day
export const REMEMBER_MAX_AGE_SECONDS = 2592000; // 30 days

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId: string | null;
  status: UserStatus;
}

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/**
 * Create a new session for a user, persist the hashed token, and set the
 * session cookie. Returns the raw opaque token.
 */
export async function createSession(
  userId: string,
  opts: { rememberMe?: boolean; ip?: string; userAgent?: string } = {},
): Promise<{ token: string }> {
  const token = generateOpaqueToken();
  const maxAge = opts.rememberMe ? REMEMBER_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  await db.session.create({
    data: {
      tokenHash: sha256Hex(token),
      userId,
      expiresAt,
      ipAddress: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
    },
  });

  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
  return { token };
}

/** Resolve the current session cookie to an active SessionUser, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256Hex(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    studentId: session.user.studentId,
    status: session.user.status,
  };
}

/** Delete the current session row and clear the session cookie. */
export async function destroySession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: sha256Hex(token) } });
  }
  (await cookies()).set(SESSION_COOKIE, "", sessionCookieOptions(0));
}

/** Delete every session belonging to a user (sign out everywhere). */
export async function destroyAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

/** List a user's sessions, newest first, with identifying metadata. */
export async function listSessions(userId: string) {
  return db.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      ipAddress: true,
      userAgent: true,
    },
  });
}
