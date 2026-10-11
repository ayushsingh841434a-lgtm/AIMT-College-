import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sha256Hex } from "@/lib/tokens";
import { resetPasswordSchema, zodErrorMessage } from "@/lib/validation";
import { jsonError } from "@/lib/rbac";
import { destroyAllSessions } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  const { token, newPassword } = parsed.data;

  const record = await db.passwordResetToken.findFirst({
    where: {
      tokenHash: sha256Hex(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!record) {
    return jsonError("This reset link is invalid or has expired.", 400);
  }

  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  // The password changed: sign the account out on every device.
  await destroyAllSessions(record.userId);

  await logAudit({
    actorId: record.userId,
    action: "auth.reset_password",
    targetType: "User",
    targetId: record.userId,
    ip: getClientIp(req),
  });

  return NextResponse.json({
    message: "Password reset successfully. You can now sign in.",
  });
}
