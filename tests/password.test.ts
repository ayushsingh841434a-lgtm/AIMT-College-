import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/password";

describe("hashPassword", () => {
  it("produces a hash that differs from the plaintext", async () => {
    const hash = await hashPassword("Student123!");
    expect(hash).not.toBe("Student123!");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("produces a different hash each time for the same password (salted)", async () => {
    const first = await hashPassword("SamePassword1");
    const second = await hashPassword("SamePassword1");
    expect(first).not.toBe(second);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const hash = await hashPassword("Correct123!");
    expect(await verifyPassword("Correct123!", hash)).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = await hashPassword("Correct123!");
    expect(await verifyPassword("WrongPassword1", hash)).toBe(false);
  });
});
