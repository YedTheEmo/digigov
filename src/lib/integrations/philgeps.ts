export async function publishToPhilGEPS(payload: {
  title: string;
  method: string;
  abc?: number | string | null;
  postingStartAt?: string | Date | null;
  postingEndAt?: string | Date | null;
}) {
  if (!process.env.PHILGEPS_ENABLED || process.env.PHILGEPS_ENABLED === 'false') {
    return { ok: true, stubbed: true, message: 'PHILGEPS disabled' } as const;
  }
  const url = process.env.PHILGEPS_API_URL;
  if (!url) return { ok: false, message: 'Missing PHILGEPS_API_URL' } as const;
  try {
    // Placeholder; replace with real API call details when available
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` } as const;
    const data = await res.json().catch(() => ({}));
    return { ok: true, reference: data?.reference ?? null } as const;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, message } as const;
  }
}
