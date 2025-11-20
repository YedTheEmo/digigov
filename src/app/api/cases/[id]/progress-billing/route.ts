import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureRole } from '@/lib/authz';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '../../../../../lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { logActivity } from '@/lib/activity';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;
  const rl = await rateLimit(req, clientIpKey(req, 'progress_billing'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`progress_billing:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const billingNo: string | undefined = body.billingNo;
  const amount: number | undefined = body.amount ? Number(body.amount) : undefined;
  const billedAt = body.billedAt ? new Date(body.billedAt) : new Date();

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  try {
    await assertCanTransition(existing, 'PROGRESS_BILLING' as CaseState);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Transition not allowed' },
      { status: 400 },
    );
  }

  const created = await prisma.progressBilling.upsert({
    where: { caseId },
    update: {
      billingNo: billingNo ?? null,
      amount: amount ?? null,
      billedAt,
      notes: body.notes ?? null,
    },
    create: {
      caseId,
      billingNo: billingNo ?? null,
      amount: amount ?? null,
      billedAt,
      notes: body.notes ?? null,
    },
  });

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: 'PROGRESS_BILLING' as CaseState },
  });

  await logActivity({
    caseId,
    action: 'progress_billing',
    fromState: existing.currentState,
    toState: 'PROGRESS_BILLING' as CaseState,
  });

  return NextResponse.json(created, { status: 201 });
}

