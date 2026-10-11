import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import {
  isLastActiveAdmin,
  canChangeUserStatus,
  canChangeUserRole,
} from "@/lib/safeguards";
import { userUpdateSchema, zodErrorMessage } from "@/lib/validation";

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

/** PATCH /api/users/[id] — update a user account (ADMIN only, with safeguards). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const target = await db.user.findUnique({ where: { id } });
    if (!target) {
      return jsonError("User not found.", 404);
    }

    const body = await req.json().catch(() => null);
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }
    const data = parsed.data;

    const activeAdminCount = await db.user.count({
      where: { role: "ADMIN", status: "ACTIVE" },
    });
    const targetIsActiveAdmin =
      target.role === "ADMIN" && target.status === "ACTIVE";
    const isSelf = target.id === auth.user.id;

    // Safeguard: status changes (no self-deactivation, no last-admin deactivation).
    if (data.status !== undefined) {
      const check = canChangeUserStatus({
        isSelf,
        targetIsActiveAdmin,
        activeAdminCount,
        newStatus: data.status,
      });
      if (!check.allowed) {
        return jsonError(check.reason ?? "You cannot change this account's status.", 403);
      }
    }

    // Safeguard: role changes (no self-demotion, no last-admin demotion).
    if (data.role !== undefined) {
      const check = canChangeUserRole({
        isSelf,
        targetIsActiveAdmin,
        activeAdminCount,
        newRole: data.role,
      });
      if (!check.allowed) {
        return jsonError(check.reason ?? "You cannot change this account's role.", 403);
      }
    }

    // studentId uniqueness (schema allows clearing it with null).
    if (data.studentId !== undefined && data.studentId !== null) {
      const conflict = await db.user.findFirst({
        where: { studentId: data.studentId, id: { not: id } },
        select: { id: true },
      });
      if (conflict) {
        return jsonError("This student ID is already in use.", 409);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.studentId !== undefined) updateData.studentId = data.studentId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.role !== undefined) updateData.role = data.role;

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: safeUserSelect,
    });

    await logAudit({
      actorId: auth.user.id,
      action: "user.update",
      targetType: "User",
      targetId: updated.id,
      details: {
        email: updated.email,
        changes: Object.keys(updateData),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        wasLastActiveAdmin: targetIsActiveAdmin && isLastActiveAdmin(activeAdminCount),
      },
      ip: getClientIp(req),
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/users/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
