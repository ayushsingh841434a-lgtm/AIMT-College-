import { describe, expect, it } from "vitest";
import {
  PERMISSION_CATALOG,
  PERMISSION_KEYS,
  PERMISSION_META,
  DEFAULT_MATRIX,
} from "../lib/permissions";

describe("permission catalog", () => {
  it("exposes a non-empty catalog with unique keys", () => {
    expect(PERMISSION_CATALOG.length).toBeGreaterThan(0);
    const keys = PERMISSION_CATALOG.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("PERMISSION_KEYS matches the catalog", () => {
    expect([...PERMISSION_KEYS].sort()).toEqual(
      PERMISSION_CATALOG.map((p) => p.key).sort(),
    );
  });

  it("PERMISSION_META has a label for every key", () => {
    for (const key of PERMISSION_KEYS) {
      expect(PERMISSION_META[key]?.label).toBeTruthy();
    }
  });

  it("every catalog key appears in at least one role default", () => {
    const granted = new Set(Object.values(DEFAULT_MATRIX).flat());
    for (const key of PERMISSION_KEYS) {
      expect(granted.has(key)).toBe(true);
    }
  });

  it("ADMIN default matrix contains every permission", () => {
    expect([...DEFAULT_MATRIX.ADMIN].sort()).toEqual([...PERMISSION_KEYS].sort());
  });

  it("STUDENT default matrix is empty (least privilege)", () => {
    expect(DEFAULT_MATRIX.STUDENT).toEqual([]);
  });

  it("MANAGEMENT cannot manage users or roles by default", () => {
    expect(DEFAULT_MATRIX.MANAGEMENT).not.toContain("users.manage");
    expect(DEFAULT_MATRIX.MANAGEMENT).not.toContain("roles.assign");
    expect(DEFAULT_MATRIX.MANAGEMENT).not.toContain("settings.manage");
    expect(DEFAULT_MATRIX.MANAGEMENT).not.toContain("audit.view");
  });

  it("MANAGEMENT can publish notices and manage academic data by default", () => {
    for (const key of [
      "notices.publish",
      "tasks.manage",
      "records.manage",
      "attendance.manage",
      "exams.manage",
    ]) {
      expect(DEFAULT_MATRIX.MANAGEMENT).toContain(key);
    }
  });
});
