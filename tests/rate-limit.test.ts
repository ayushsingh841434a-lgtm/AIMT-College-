import { describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../lib/rate-limit";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("checkRateLimit", () => {
  it("allows exactly `limit` requests, then blocks with retryAfter > 0", () => {
    const key = `limit-test-${Date.now()}`;
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit(key, limit, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, limit, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const keyA = `key-a-${Date.now()}`;
    const keyB = `key-b-${Date.now()}`;
    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000).allowed).toBe(true);
  });

  it("allows requests again after the window passes", async () => {
    const key = `window-test-${Date.now()}`;
    checkRateLimit(key, 1, 50);
    expect(checkRateLimit(key, 1, 50).allowed).toBe(false);
    await sleep(60);
    expect(checkRateLimit(key, 1, 50).allowed).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  it("returns a 429 response with the Retry-After header", async () => {
    const response = rateLimitResponse(30);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    const body = await response.json();
    expect(body.error).toContain("Too many requests");
  });
});

describe("getClientIp", () => {
  it("returns the first x-forwarded-for entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 198.51.100.2" },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("returns 'unknown' when the header is missing", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });
});
