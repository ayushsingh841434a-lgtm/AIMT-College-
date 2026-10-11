/** In-memory sliding-window rate limiter (per process). */

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

const buckets = new Map<string, number[]>();

/**
 * Check whether a request under `key` is allowed within `limit` requests per
 * `windowMs` milliseconds (sliding window). Records the hit when allowed.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  let hits = buckets.get(key);
  if (!hits) {
    hits = [];
    buckets.set(key, hits);
  }

  // Prune expired timestamps.
  while (hits.length > 0 && hits[0]! <= cutoff) {
    hits.shift();
  }

  if (hits.length < limit) {
    hits.push(now);
    return { allowed: true, retryAfter: 0 };
  }

  const retryAfter = Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000));
  return { allowed: false, retryAfter };
}

/** Build a 429 JSON response for rate-limited requests. */
export function rateLimitResponse(retryAfter: number): Response {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}

/** Extract the client IP from a request (first x-forwarded-for entry). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}
