// Simple in-memory idempotency for dev. Replace with Redis in prod.
const seen = new Map<string, number>();

export async function useIdempotencyKey(key: string, ttlMs = 5 * 60_000) {
  const now = Date.now();
  const expires = seen.get(key);
  if (expires && expires > now) return { ok: false as const };
  seen.set(key, now + ttlMs);
  return { ok: true as const };
}


