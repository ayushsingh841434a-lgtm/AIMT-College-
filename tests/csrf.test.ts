import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { checkCsrf } from "../lib/csrf";

function makeRequest(origin?: string, referer?: string): NextRequest {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);
  headers.set("host", "portal.aimt.edu");
  return new NextRequest("https://portal.aimt.edu/api/tasks", {
    method: "POST",
    headers,
  });
}

describe("checkCsrf", () => {
  it("allows requests without Origin/Referer (non-browser clients)", () => {
    expect(checkCsrf(makeRequest())).toBe(true);
  });

  it("allows matching Origin", () => {
    expect(checkCsrf(makeRequest("https://portal.aimt.edu"))).toBe(true);
  });

  it("rejects a cross-site Origin", () => {
    expect(checkCsrf(makeRequest("https://evil.example"))).toBe(false);
  });

  it("rejects a cross-site Referer when Origin is absent", () => {
    expect(
      checkCsrf(makeRequest(undefined, "https://evil.example/steal")),
    ).toBe(false);
  });

  it("allows a same-site Referer", () => {
    expect(
      checkCsrf(makeRequest(undefined, "https://portal.aimt.edu/login")),
    ).toBe(true);
  });

  it("rejects malformed Origin values", () => {
    expect(checkCsrf(makeRequest("not-a-url"))).toBe(false);
  });
});
