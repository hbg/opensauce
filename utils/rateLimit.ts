import type { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory rate limiter suitable for single-node or Vercel function.
// Limits each IP to `max` requests in a sliding window of `windowMs`.
// Returns true if the request is allowed, false if the caller was already
// responded to (429) due to limit breach.

interface RateLimitOptions {
  windowMs?: number; // e.g. 60_000 = 1 minute
  max?: number;      // max requests per window
}

const DEFAULT_WINDOW = 60_000; // 1 minute
const DEFAULT_MAX = 30;

// Map<ip, { count: number; expires: number }>
const store = new Map<string, { count: number; expires: number }>();

export function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  { windowMs = DEFAULT_WINDOW, max = DEFAULT_MAX }: RateLimitOptions = {}
): boolean {
  const ip =
    (req.headers["x-real-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  const record = store.get(ip);
  if (record && record.expires > now) {
    if (record.count >= max) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return false;
    }
    record.count += 1;
  } else {
    // new window
    store.set(ip, { count: 1, expires: now + windowMs });
  }
  return true;
}
