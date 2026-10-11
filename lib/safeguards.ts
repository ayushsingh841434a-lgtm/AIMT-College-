/** Pure safeguard helpers for administrative user management. */

/** True when the given count means this is the last active administrator. */
export function isLastActiveAdmin(activeAdminCount: number): boolean {
  return activeAdminCount <= 1;
}

interface StatusChangeOpts {
  isSelf: boolean;
  targetIsActiveAdmin: boolean;
  activeAdminCount: number;
  newStatus: "ACTIVE" | "INACTIVE";
}

/** Check whether a user's account status may be changed. */
export function canChangeUserStatus(opts: StatusChangeOpts): { allowed: boolean; reason?: string } {
  if (opts.isSelf) {
    return { allowed: false, reason: "You cannot change your own account status." };
  }
  if (
    opts.newStatus === "INACTIVE" &&
    opts.targetIsActiveAdmin &&
    isLastActiveAdmin(opts.activeAdminCount)
  ) {
    return { allowed: false, reason: "You cannot deactivate the last active administrator." };
  }
  return { allowed: true };
}

interface RoleChangeOpts {
  isSelf: boolean;
  targetIsActiveAdmin: boolean;
  activeAdminCount: number;
  newRole: "STUDENT" | "MANAGEMENT" | "ADMIN";
}

/** Check whether a user's role may be changed. */
export function canChangeUserRole(opts: RoleChangeOpts): { allowed: boolean; reason?: string } {
  if (opts.isSelf) {
    return { allowed: false, reason: "You cannot change your own role." };
  }
  if (
    opts.targetIsActiveAdmin &&
    opts.newRole !== "ADMIN" &&
    isLastActiveAdmin(opts.activeAdminCount)
  ) {
    return { allowed: false, reason: "You cannot demote the last active administrator." };
  }
  return { allowed: true };
}
