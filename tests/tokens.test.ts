import { describe, expect, it } from "vitest";
import { generateOpaqueToken, sha256Hex } from "../lib/tokens";

describe("sha256Hex", () => {
  it("is deterministic for the same input", () => {
    expect(sha256Hex("hello")).toBe(sha256Hex("hello"));
  });

  it("produces different digests for different inputs", () => {
    expect(sha256Hex("hello")).not.toBe(sha256Hex("world"));
  });

  it("produces a 64-character hex string", () => {
    const digest = sha256Hex("some input");
    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("generateOpaqueToken", () => {
  it("returns a 64-character hex string for 32 bytes", () => {
    const token = generateOpaqueToken(32);
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique tokens across 100 calls", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateOpaqueToken());
    }
    expect(tokens.size).toBe(100);
  });
});
