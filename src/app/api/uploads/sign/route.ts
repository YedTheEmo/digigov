import { NextRequest, NextResponse } from 'next/server';
import { presignUpload } from '@/lib/storage/s3';
import { PresignSchema } from '@/lib/validators/upload';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { ensureRole } from '@/lib/authz';

export async function POST(req: NextRequest) {
  const authz = await ensureRole(['ADMIN', 'PROCUREMENT_MANAGER', 'SUPPLY_MANAGER', 'BUDGET_MANAGER', 'ACCOUNTING_MANAGER', 'CASHIER_MANAGER', 'BAC_SECRETARIAT', 'TWG_MEMBER'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const rl = await rateLimit(req, clientIpKey(req, 'uploads_sign'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  const json = await req.json();
  const parsed = PresignSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  // Basic hardening: restrict content types and key patterns (no traversal)
  const allowed = new Set(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']);
  if (!allowed.has(parsed.data.contentType)) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  }
  if (parsed.data.key.includes('..') || parsed.data.key.startsWith('/') || parsed.data.key.trim().length < 3) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }
  const res = await presignUpload(parsed.data);
  return NextResponse.json(res, { status: 200 });
}











