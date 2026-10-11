import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema, zodErrorMessage } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { jsonError, roleHome } from "@/lib/rbac";
import { createSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  const { email, password, rememberMe } = parsed.data;
  const ip = getClientIp(req);

  const rl = checkRateLimit(`login:${ip}:${email}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

  // The error message stays generic on purpose: no account enumeration,
  // no distinction between wrong email, wrong password, or disabled account.
  // The role and redirect come from the database — never from the browser.
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    return jsonError("Invalid email or password.", 401);
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return jsonError("Invalid email or password.", 401);
  }

  await createSession(user.id, {
    rememberMe,
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  await logAudit({
    actorId: user.id,
    action: "auth.login",
    targetType: "User",
    targetId: user.id,
    details: { rememberMe },
    ip,
  });

  return NextResponse.json({ role: user.role, redirectTo: roleHome(user.role) });
}
