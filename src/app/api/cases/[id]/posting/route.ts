import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureRole } from '@/lib/authz';
import { publishToPhilGEPS } from '@/lib/integrations/philgeps';
import { getLegalBasis } from '@/lib/legal-basis';
import { PostingSchema } from '@/lib/validators/posting';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const rl = await rateLimit(req, clientIpKey(req, 'posting'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`posting:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = PostingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  await assertCanTransition(existing, 'POSTING' as CaseState);

  const postingStartAt = parsed.data.postingStartAt ? new Date(parsed.data.postingStartAt) : new Date();
  const postingEndAt = parsed.data.postingEndAt ? new Date(parsed.data.postingEndAt) : new Date(postingStartAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  // Enforce minimum 7 days posting window
  const minMs = 7 * 24 * 60 * 60 * 1000;
  if (postingEndAt.getTime() - postingStartAt.getTime() < minMs) {
    return NextResponse.json({ error: 'Posting must be at least 7 days' }, { status: 400 });
  }

  const updated = await prisma.procurementCase.update({
    where: { id: caseId },
    data: {
      postingStartAt,
      postingEndAt,
      currentState: 'POSTING',
    },
  });

  const publish = await publishToPhilGEPS({
    title: existing.title,
    method: String(existing.method),
    abc: existing.abc ? Number(existing.abc) : null,
    postingStartAt,
    postingEndAt,
  });

  await prisma.activityLog.create({
    data: {
      caseId,
      action: 'posting',
      fromState: existing.currentState,
      toState: 'POSTING' as CaseState,
      legalBasis: getLegalBasis('posting'),
      payload: { publish },
    },
  });

  if ('ok' in publish && publish.ok && 'reference' in publish && publish.reference) {
    await prisma.attachment.create({
      data: {
        caseId,
        type: 'PHILGEPS_REFERENCE',
        url: String('reference' in publish ? publish.reference : ''),
        uploadedBy: null,
      },
    });
  }

  // Create delivery reminder baseline (30 days from posting end)
  const dueAt = new Date(postingEndAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.reminder.create({ data: { caseId, type: 'DELIVERY_DUE', dueAt } });
  await prisma.procurementCase.update({ where: { id: caseId }, data: { deliveryDueAt: dueAt } });

  return NextResponse.json(updated, { status: 201 });
}


