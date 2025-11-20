import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureRole } from '@/lib/authz';
import { PostQualificationSchema } from '@/lib/validators/post-qualification';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { transitionCaseState } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['BAC_SECRETARIAT', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const json = await req.json();
  const parsed = PostQualificationSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const rl = await rateLimit(req, clientIpKey(req, 'post_qualification'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`post_qualification:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const created = await prisma.postQualification.upsert({
    where: { caseId },
    update: { lowestResponsiveBidder: parsed.data.lowestResponsiveBidder ?? null, passed: parsed.data.passed ?? null, notes: parsed.data.notes ?? null, completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : new Date() },
    create: { caseId, lowestResponsiveBidder: parsed.data.lowestResponsiveBidder ?? null, passed: parsed.data.passed ?? null, notes: parsed.data.notes ?? null, completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : new Date() },
  });
  await transitionCaseState(caseId, 'POST_QUALIFICATION' as any, {
    action: 'post_qualification',
    legalBasis: 'RA 9184 IRR Sec. 34 (Post-Qualification)',
  });
  return NextResponse.json(created, { status: 201 });
}


