import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOpaqueToken, sha256Hex } from "@/lib/tokens";
import { forgotPasswordSchema, zodErrorMessage } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const DONE_MESSAGE =
  "If an account exists for this email, a password reset link has been sent.";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  // The response is identical whether or not the account exists, so the
  // endpoint cannot be used to enumerate registered emails.
  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (user && user.status === "ACTIVE") {
    const token = generateOpaqueToken();
    await db.passwordResetToken.create({
      data: {
        tokenHash: sha256Hex(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await logAudit({
      actorId: user.id,
      action: "auth.forgot_password",
      targetType: "User",
      targetId: user.id,
      ip,
    });

    // Demo mode only: return the reset URL directly since there is no mail
    // server configured. Never enable this in a real deployment.
    if (process.env.ALLOW_DEMO_RESET_LINKS === "true") {
      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      return NextResponse.json({
        message: DONE_MESSAGE,
        resetUrl: `${appUrl}/reset-password?token=${token}`,
      });
    }
  }

  return NextResponse.json({ message: DONE_MESSAGE });
}
