import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema, zodErrorMessage } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getSetting } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  // Public registration is the only path to a student account, and it is
  // ALWAYS created with the STUDENT role — any client-supplied role is ignored.
  const allowRegistration = await getSetting<boolean>("allowRegistration", true);
  if (!allowRegistration) {
    return jsonError("New registrations are currently disabled.", 403);
  }

  const { name, email, password, studentId } = parsed.data;

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    return jsonError("An account with this email already exists.", 409);
  }

  if (studentId) {
    const existingStudentId = await db.user.findUnique({ where: { studentId } });
    if (existingStudentId) {
      return jsonError("An account with this student ID already exists.", 409);
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      name,
      email,
      studentId: studentId ?? null,
      passwordHash,
      role: "STUDENT",
      profile: { create: {} },
    },
  });

  await logAudit({
    actorId: user.id,
    action: "auth.register",
    targetType: "User",
    targetId: user.id,
    details: { email },
    ip,
  });

  return NextResponse.json(
    { message: "Account created successfully. You can now sign in." },
    { status: 201 },
  );
}
