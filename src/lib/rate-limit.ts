import type { NextRequest } from 'next/server';

// Simple in-memory fallback limiter for dev; Upstash for prod if configured
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(req: NextRequest, key: string, limit = 30, windowMs = 60_000) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const now = Date.now();
  if (url && token) {
    const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
    const res = await fetch(`${url}/incr/${encodeURIComponent(windowKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const count = Number(await res.text());
    if (count === 1) {
      await fetch(`${url}/pexpire/${encodeURIComponent(windowKey)}/${windowMs}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    }
    if (count > limit) {
      const ttlRes = await fetch(`${url}/pttl/${encodeURIComponent(windowKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const ttl = Number(await ttlRes.text());
      return { ok: false as const, retryAfter: Math.ceil(ttl / 1000) };
    }
    return { ok: true as const };
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true } as const;
  }
  if (bucket.count >= limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) } as const;
  bucket.count += 1;
  return { ok: true } as const;
}

export function clientIpKey(req: NextRequest, route: string) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return `${route}:${ip}`;
}



