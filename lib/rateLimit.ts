// Simple in-memory rate limiter (per Vercel edge / serverless instance).
// Limits each IP to `MAX_REQUESTS` per `WINDOW_MS` window.
// For production, consider a distributed store like Redis.

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 60; // per IP per hour

interface Record {
  count: number;
  expires: number; // timestamp when window resets
}

const store = new Map<string, Record>();

export function rateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const rec = store.get(ip);
  if (!rec || rec.expires < now) {
    store.set(ip, { count: 1, expires: now + WINDOW_MS });
    return { allowed: true };
  }
  if (rec.count < MAX_REQUESTS) {
    rec.count += 1;
    return { allowed: true };
  }
  // at limit
  return { allowed: false, retryAfter: Math.ceil((rec.expires - now) / 1000) };
}
