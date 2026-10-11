import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { changePasswordSchema, zodErrorMessage } from "@/lib/validation";
import { jsonError, requireRole } from "@/lib/rbac";
import { createSession, destroyAllSessions } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  const user = await db.user.findUnique({ where: { id: auth.user.id } });
  if (!user) return jsonError("Not authenticated.", 401);

  const { currentPassword, newPassword } = parsed.data;
  const currentOk = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentOk) {
    return jsonError("Current password is incorrect.", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Sign out everywhere, then issue a fresh session so this device stays
  // signed in without asking the user to log in again.
  await destroyAllSessions(user.id);
  await createSession(user.id, {
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  await logAudit({
    actorId: user.id,
    action: "auth.change_password",
    targetType: "User",
    targetId: user.id,
    ip: getClientIp(req),
  });

  return NextResponse.json({ message: "Password changed successfully." });
}
