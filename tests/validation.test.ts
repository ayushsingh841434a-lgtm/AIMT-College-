import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  loginSchema,
  noticeSchema,
  registerSchema,
  reportGenerateSchema,
  settingsSchema,
  taskCreateSchema,
  userCreateSchema,
  zodErrorMessage,
} from "../lib/validation";

describe("registerSchema", () => {
  const valid = {
    name: "Aarav Sharma",
    email: "Aarav@Example.com ",
    studentId: "AIMT2024001",
    password: "Student123!",
    confirmPassword: "Student123!",
  };

  it("accepts valid input and normalises the email", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("aarav@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Ab1", confirmPassword: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a digit", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "PasswordOnly",
      confirmPassword: "PasswordOnly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Different123!" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorMessage(result.error)).toContain("Passwords do not match");
    }
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ email: "admin@aimt.edu", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "admin@aimt.edu", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("noticeSchema", () => {
  it("rejects a short title", () => {
    const result = noticeSchema.safeParse({ title: "Hi", body: "This body is long enough." });
    expect(result.success).toBe(false);
  });

  it("defaults audience to ALL", () => {
    const result = noticeSchema.safeParse({
      title: "Exam schedule",
      body: "The exams start next week for all students.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audience).toBe("ALL");
    }
  });
});

describe("taskCreateSchema", () => {
  it("rejects missing assignedTo", () => {
    const result = taskCreateSchema.safeParse({
      title: "Do the report",
      description: "Write a detailed internship report.",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete task", () => {
    const result = taskCreateSchema.safeParse({
      title: "Do the report",
      description: "Write a detailed internship report.",
      assignedTo: "clx0000000000000000000001",
      dueDate: "2026-11-05T23:59:59.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("userCreateSchema", () => {
  const valid = {
    name: "New Manager",
    email: "manager2@aimt.edu",
    password: "Manager123!",
    role: "MANAGEMENT" as const,
  };

  it("accepts MANAGEMENT and ADMIN roles", () => {
    expect(userCreateSchema.safeParse(valid).success).toBe(true);
    expect(userCreateSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(true);
  });

  it("rejects the STUDENT role", () => {
    const result = userCreateSchema.safeParse({ ...valid, role: "STUDENT" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorMessage(result.error)).toContain("Public registration");
    }
  });
});

describe("changePasswordSchema", () => {
  it("rejects mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Old123456",
      newPassword: "NewPass123!",
      confirmNewPassword: "NewPass124!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Old123456",
      newPassword: "NewPass123!",
      confirmNewPassword: "NewPass123!",
    });
    expect(result.success).toBe(true);
  });
});

describe("reportGenerateSchema", () => {
  it("accepts the four supported report types", () => {
    for (const type of ["students-by-branch", "students-by-year", "task-completion", "notices"]) {
      expect(reportGenerateSchema.safeParse({ type }).success).toBe(true);
    }
  });

  it("rejects an unknown report type", () => {
    const result = reportGenerateSchema.safeParse({ type: "unknown-report" });
    expect(result.success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts partial updates", () => {
    const result = settingsSchema.safeParse({ siteName: "AIMT", allowRegistration: false });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    expect(settingsSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an out-of-range sessionDays", () => {
    const result = settingsSchema.safeParse({ sessionDays: 60 });
    expect(result.success).toBe(false);
  });
});
