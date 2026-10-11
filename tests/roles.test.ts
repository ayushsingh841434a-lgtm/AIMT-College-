import { describe, expect, it } from "vitest";
import { isStaffRole, ROLE_LABELS, roleHome } from "../lib/roles";

describe("roleHome", () => {
  it("returns the student dashboard for STUDENT", () => {
    expect(roleHome("STUDENT")).toBe("/student/dashboard");
  });

  it("returns the management dashboard for MANAGEMENT", () => {
    expect(roleHome("MANAGEMENT")).toBe("/management/dashboard");
  });

  it("returns the admin dashboard for ADMIN", () => {
    expect(roleHome("ADMIN")).toBe("/admin/dashboard");
  });
});

describe("isStaffRole", () => {
  it("is true for MANAGEMENT and ADMIN", () => {
    expect(isStaffRole("MANAGEMENT")).toBe(true);
    expect(isStaffRole("ADMIN")).toBe(true);
  });

  it("is false for STUDENT", () => {
    expect(isStaffRole("STUDENT")).toBe(false);
  });
});

describe("ROLE_LABELS", () => {
  it("defines a label for every role", () => {
    expect(ROLE_LABELS.STUDENT).toBeDefined();
    expect(ROLE_LABELS.MANAGEMENT).toBeDefined();
    expect(ROLE_LABELS.ADMIN).toBeDefined();
  });
});
