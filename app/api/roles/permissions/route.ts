import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { PERMISSION_KEYS, PERMISSION_META, type PermissionKey } from "@/lib/permissions";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/validation";

const patchSchema = z.object({
  role: z.string().min(1, "Role is required"),
  permissions: z.array(z.string()).default([]),
});

function emptyMatrix(): Record<Role, string[]> {
  return {
    [Role.STUDENT]: [],
    [Role.MANAGEMENT]: [],
    [Role.ADMIN]: [],
  };
}

function buildMatrix(
  rows: { role: Role; permission: { key: string } }[],
): Record<Role, string[]> {
  const matrix = emptyMatrix();
  for (const row of rows) {
    matrix[row.role].push(row.permission.key);
  }
  return matrix;
}

/** GET /api/roles/permissions — permission catalog + role matrix (ADMIN). */
export async function GET(_req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const rows = await db.rolePermission.findMany({
      include: { permission: { select: { key: true } } },
    });

    const meta = PERMISSION_META as unknown as Record<string, { label?: string; description?: string | null }>;
    const permissions = (PERMISSION_KEYS as string[]).map((key) => ({
      key,
      label: meta[key]?.label ?? key,
      description: meta[key]?.description ?? null,
    }));

    return Response.json({ permissions, matrix: buildMatrix(rows) });
  } catch (error) {
    console.error("GET /api/roles/permissions failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** PATCH /api/roles/permissions — replace a role's permission set (ADMIN). */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { role: roleParam, permissions: rawPermissions } = parsed.data;

    if (!(Object.values(Role) as string[]).includes(roleParam)) {
      return jsonError("Invalid role.", 400);
    }
    const role = roleParam as Role;

    const permissionKeys = [...new Set(rawPermissions)];
    const knownKeys = new Set<string>(PERMISSION_KEYS as string[]);
    if (!permissionKeys.every((key) => knownKeys.has(key))) {
      return jsonError("One or more permissions are invalid.", 400);
    }

    if (role === Role.ADMIN && !permissionKeys.includes("roles.assign")) {
      return jsonError(
        "The 'roles.assign' permission cannot be removed from the Administrator role.",
        403,
      );
    }

    const meta = PERMISSION_META as unknown as Record<string, { label?: string; description?: string | null }>;

    const matrix = await db.$transaction(async (tx) => {
      // Resolve permission ids, creating catalog rows for any missing keys.
      const existing = await tx.permission.findMany({
        where: { key: { in: permissionKeys } },
        select: { id: true, key: true },
      });
      const existingKeys = new Set(existing.map((p) => p.key));
      for (const key of permissionKeys) {
        if (!existingKeys.has(key)) {
          const created = await tx.permission.create({
            data: {
              key,
              label: meta[key]?.label ?? key,
              description: meta[key]?.description ?? null,
            },
            select: { id: true, key: true },
          });
          existing.push(created);
        }
      }

      await tx.rolePermission.deleteMany({ where: { role } });
      if (existing.length > 0) {
        await tx.rolePermission.createMany({
          data: existing.map((p) => ({ role, permissionId: p.id })),
        });
      }

      return tx.rolePermission.findMany({
        include: { permission: { select: { key: true } } },
      });
    });

    await logAudit({
      actorId: auth.user.id,
      action: "roles.permissions_update",
      targetType: "Role",
      targetId: role,
      details: { role, permissions: permissionKeys },
      ip: getClientIp(req),
    });

    return Response.json({ message: "Permissions updated.", matrix: buildMatrix(matrix) });
  } catch (error) {
    console.error("PATCH /api/roles/permissions failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

// Keep the PermissionKey type import referenced for tooling.
void (null as unknown as PermissionKey | null);
