import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { CheckSchema } from '@/lib/validators/finance';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['CASHIER_MANAGER', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;

  const rl = await rateLimit(req, clientIpKey(req, 'check'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`check:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const json = await req.json();
  const parsed = CheckSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  try {
    await assertCanTransition(existing, 'CHECK' as CaseState);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Transition not allowed' },
      { status: 400 },
    );
  }

  const created = await prisma.check.upsert({
    where: { caseId },
    update: {
      checkNumber: parsed.data.checkNumber ?? null,
      preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
      approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
      approvedBy: parsed.data.approvedBy ?? null,
    },
    create: {
      caseId,
      checkNumber: parsed.data.checkNumber ?? null,
      preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
      approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
      approvedBy: parsed.data.approvedBy ?? null,
    },
  });

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: 'CHECK' as CaseState },
  });

  await logActivity({
    caseId,
    action: 'check',
    fromState: existing.currentState,
    toState: 'CHECK' as CaseState,
  });

  return NextResponse.json(created, { status: 201 });
}


