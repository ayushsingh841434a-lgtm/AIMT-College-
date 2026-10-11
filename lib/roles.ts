import type { Role } from "@prisma/client";

/** Home dashboard path for a role. */
export function roleHome(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student/dashboard";
    case "MANAGEMENT":
      return "/management/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
  }
}

/** Human-readable labels for roles. */
export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  MANAGEMENT: "Management",
  ADMIN: "Administrator",
};

/** True for staff roles (MANAGEMENT or ADMIN). */
export function isStaffRole(role: Role): boolean {
  return role === "MANAGEMENT" || role === "ADMIN";
}
