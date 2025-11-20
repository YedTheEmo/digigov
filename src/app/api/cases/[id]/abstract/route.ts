import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { AbstractSchema } from '@/lib/validators/abstract';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = AbstractSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const rl = await rateLimit(req, clientIpKey(req, 'abstract'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`abstract:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  try {
    await assertCanTransition(existing as any, 'ABSTRACT_OF_QUOTATIONS' as any);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Transition not allowed' },
      { status: 400 },
    );
  }

  const created = await prisma.abstractOfQuotations.upsert({
    where: { caseId },
    update: { notes: parsed.data?.notes ?? null },
    create: { caseId, notes: parsed.data?.notes ?? null },
  });

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: 'ABSTRACT_OF_QUOTATIONS' as any },
  });

  await logActivity({
    caseId,
    action: 'abstract_of_quotations',
    fromState: existing.currentState as any,
    toState: 'ABSTRACT_OF_QUOTATIONS' as any,
  });

  return NextResponse.json(created, { status: 201 });
}


