import type { Role } from "@prisma/client";
import { db } from "./db";
import { getSessionUser, type SessionUser } from "./session";
import { jsonError } from "./rbac";

export type PermissionDef = {
  key: string;
  label: string;
  description: string;
};

/** The permission catalog. New keys must also be added to DEFAULT_MATRIX. */
export const PERMISSION_CATALOG: PermissionDef[] = [
  { key: "users.view", label: "View users", description: "View the list of user accounts." },
  { key: "users.manage", label: "Manage users", description: "Create, activate, deactivate and edit user accounts." },
  { key: "roles.assign", label: "Assign roles & permissions", description: "Change user roles and edit the permission matrix." },
  { key: "notices.publish", label: "Publish notices", description: "Create, edit and delete college notices." },
  { key: "tasks.manage", label: "Manage tasks", description: "Create and assign tasks / assignments to students." },
  { key: "records.manage", label: "Manage student records", description: "Add, edit and delete student records." },
  { key: "reports.generate", label: "Generate reports", description: "Generate and view analytical reports." },
  { key: "attendance.manage", label: "Manage attendance", description: "Mark and edit student attendance." },
  { key: "exams.manage", label: "Manage exam results", description: "Enter and edit examination results." },
  { key: "settings.manage", label: "Manage system settings", description: "Change system-wide configuration." },
  { key: "audit.view", label: "View audit logs", description: "Inspect the audit trail of administrative actions." },
  { key: "support.manage", label: "Manage support requests", description: "View and resolve student support requests." },
];

/** Seed-time default permission set per role. Admins can change this at runtime. */
export const DEFAULT_MATRIX: Record<Role, string[]> = {
  ADMIN: PERMISSION_CATALOG.map((p) => p.key),
  MANAGEMENT: [
    "notices.publish",
    "tasks.manage",
    "records.manage",
    "reports.generate",
    "attendance.manage",
    "exams.manage",
    "support.manage",
  ],
  STUDENT: [],
};

/** Permission key type (string-backed so new keys stay flexible). */
export type PermissionKey = string;

/** Flat list of all permission keys in the catalog. */
export const PERMISSION_KEYS: PermissionKey[] = PERMISSION_CATALOG.map((p) => p.key);

/** Label/description lookup by permission key. */
export const PERMISSION_META: Record<PermissionKey, { label: string; description: string | null }> =
  Object.fromEntries(
    PERMISSION_CATALOG.map((p) => [p.key, { label: p.label, description: p.description ?? null }]),
  );

/** Idempotently ensure every catalog permission exists as a row. */
export async function ensurePermissionCatalog(): Promise<void> {
  for (const def of PERMISSION_CATALOG) {
    await db.permission.upsert({
      where: { key: def.key },
      update: { label: def.label, description: def.description },
      create: { key: def.key, label: def.label, description: def.description },
    });
  }
}

/** Permission keys currently granted to a role. */
export async function getRolePermissions(role: Role): Promise<string[]> {
  const rows = await db.rolePermission.findMany({
    where: { role },
    include: { permission: { select: { key: true } } },
  });
  return rows.map((r) => r.permission.key);
}

/** True when the role currently holds the permission key. */
export async function hasPermission(role: Role, key: string): Promise<boolean> {
  const row = await db.rolePermission.findFirst({
    where: { role, permission: { key } },
    select: { id: true },
  });
  return row !== null;
}

export type RequirePermissionResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: Response };

/**
 * Require authentication AND a specific permission key.
 * 401 when unauthenticated, 403 when the user's role lacks the permission.
 */
export async function requirePermission(
  key: string,
): Promise<RequirePermissionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: jsonError("Authentication required", 401) };
  }
  const allowed = await hasPermission(user.role, key);
  if (!allowed) {
    return {
      ok: false,
      response: jsonError("You do not have permission to perform this action", 403),
    };
  }
  return { ok: true, user };
}
