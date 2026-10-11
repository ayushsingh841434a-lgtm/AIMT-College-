import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { profileUpdateSchema, zodErrorMessage } from "@/lib/validation";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  studentId: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** GET /api/profile — the authenticated user's own profile. */
export async function GET(_req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      select: { ...safeUserSelect, profile: true },
    });
    if (!user) {
      return jsonError("Account not found.", 404);
    }
    return Response.json({ user, profile: user.profile });
  } catch (error) {
    console.error("GET /api/profile failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** PATCH /api/profile — update the authenticated user's own student profile. */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { dateOfBirth, ...rest } = parsed.data;
    const profileData = {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    const profile = await db.studentProfile.upsert({
      where: { userId: auth.user.id },
      create: { userId: auth.user.id, ...profileData },
      update: profileData,
    });

    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      select: safeUserSelect,
    });

    return Response.json({ user, profile });
  } catch (error) {
    console.error("PATCH /api/profile failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
