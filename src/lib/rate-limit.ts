type Bucket = { hits: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function takeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { hits: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }
  if (current.hits >= limit) {
    return { ok: false as const, retryAfterMs: current.resetAt - now };
  }
  current.hits += 1;
  return { ok: true as const };
}

export function clearRateLimits() {
  buckets.clear();
}
