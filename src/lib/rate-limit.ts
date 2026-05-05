/**
 * In-memory token-bucket rate limiter.
 *
 * Suitable for a single Node instance (e.g. a Vercel function or a self-hosted
 * `next start`). For multi-region / multi-instance deployments you should
 * front this with a shared store (Redis / Upstash / etc.) — the public API of
 * this module is stable enough that you can swap the implementation without
 * touching call sites.
 *
 * Defaults:
 *   - capacity:    20 requests
 *   - refillRate:  20 tokens / 60s (so ~1 req every 3 seconds sustained)
 *
 * Override at runtime via env:
 *   - ARC_AI_RATE_CAPACITY     (integer, default 20)
 *   - ARC_AI_RATE_WINDOW_MS    (integer ms, default 60_000)
 */

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const DEFAULT_CAPACITY = 20;
const DEFAULT_WINDOW_MS = 60_000;

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCapacity(): number {
  return readNumberEnv("ARC_AI_RATE_CAPACITY", DEFAULT_CAPACITY);
}

function getWindowMs(): number {
  return readNumberEnv("ARC_AI_RATE_WINDOW_MS", DEFAULT_WINDOW_MS);
}

const buckets = new Map<string, Bucket>();

// Periodically discard stale buckets so an unbounded number of unique IPs
// can't grow the map indefinitely. Idle 10 minutes => evict.
const EVICT_AFTER_MS = 10 * 60_000;
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (now - v.updatedAt > EVICT_AFTER_MS) buckets.delete(k);
  }
}

export type RateResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
};

export function consume(key: string, cost = 1): RateResult {
  const capacity = getCapacity();
  const windowMs = getWindowMs();
  const refillPerMs = capacity / windowMs;
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, updatedAt: now };
    buckets.set(key, bucket);
  }
  // refill since last touch
  const elapsed = now - bucket.updatedAt;
  if (elapsed > 0) {
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerMs);
    bucket.updatedAt = now;
  }
  if (bucket.tokens >= cost) {
    bucket.tokens -= cost;
    return {
      ok: true,
      remaining: Math.floor(bucket.tokens),
      limit: capacity,
      resetMs: Math.ceil((capacity - bucket.tokens) / refillPerMs),
    };
  }
  const resetMs = Math.ceil((cost - bucket.tokens) / refillPerMs);
  return { ok: false, remaining: 0, limit: capacity, resetMs };
}

/**
 * Best-effort client IP extraction. Honors common proxy headers but stays
 * intentionally simple — true source-of-truth IPs require infrastructure
 * cooperation (e.g. setting `x-real-ip`) and we never want to trust raw
 * client-supplied values for anything more than rate bucketing.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "anon";
}
