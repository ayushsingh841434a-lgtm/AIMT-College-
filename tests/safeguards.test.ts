import { describe, expect, it } from "vitest";
import {
  canChangeUserRole,
  canChangeUserStatus,
  isLastActiveAdmin,
} from "../lib/safeguards";

describe("isLastActiveAdmin", () => {
  it("is true when the count is 1 or less", () => {
    expect(isLastActiveAdmin(1)).toBe(true);
    expect(isLastActiveAdmin(0)).toBe(true);
  });

  it("is false when there are multiple active admins", () => {
    expect(isLastActiveAdmin(2)).toBe(false);
  });
});

describe("canChangeUserStatus", () => {
  it("denies deactivating the last active administrator", () => {
    const result = canChangeUserStatus({
      isSelf: false,
      targetIsActiveAdmin: true,
      activeAdminCount: 1,
      newStatus: "INACTIVE",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("last active administrator");
  });

  it("allows deactivating a non-last admin", () => {
    const result = canChangeUserStatus({
      isSelf: false,
      targetIsActiveAdmin: true,
      activeAdminCount: 2,
      newStatus: "INACTIVE",
    });
    expect(result.allowed).toBe(true);
  });

  it("denies changing your own status", () => {
    const result = canChangeUserStatus({
      isSelf: true,
      targetIsActiveAdmin: false,
      activeAdminCount: 5,
      newStatus: "INACTIVE",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("own account status");
  });
});

describe("canChangeUserRole", () => {
  it("denies demoting the last active administrator", () => {
    const result = canChangeUserRole({
      isSelf: false,
      targetIsActiveAdmin: true,
      activeAdminCount: 1,
      newRole: "MANAGEMENT",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("demote the last active administrator");
  });

  it("allows demoting a non-last admin", () => {
    const result = canChangeUserRole({
      isSelf: false,
      targetIsActiveAdmin: true,
      activeAdminCount: 2,
      newRole: "STUDENT",
    });
    expect(result.allowed).toBe(true);
  });

  it("denies changing your own role", () => {
    const result = canChangeUserRole({
      isSelf: true,
      targetIsActiveAdmin: true,
      activeAdminCount: 3,
      newRole: "STUDENT",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("own role");
  });
});
