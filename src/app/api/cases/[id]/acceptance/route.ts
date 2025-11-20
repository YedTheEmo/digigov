import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { AcceptanceSchema } from '@/lib/validators/post_award';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['SUPPLY_MANAGER', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const rl = await rateLimit(req, clientIpKey(req, 'acceptance'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`acceptance:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const json = await req.json();
  const parsed = AcceptanceSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const currentState = existing.currentState as any;
  const canFirstTransition = currentState === 'INSPECTION';
  const canEditAcceptance = ['ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED'].includes(currentState);

  if (!canFirstTransition && !canEditAcceptance) {
    return NextResponse.json(
      { error: 'Cannot record acceptance in the current state.' },
      { status: 400 },
    );
  }

  if (canFirstTransition) {
    try {
      await assertCanTransition(existing as any, 'ACCEPTANCE' as any);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message || 'Transition not allowed' },
        { status: 400 },
      );
    }
  }

  const created = await prisma.acceptance.upsert({
    where: { caseId },
    update: {
      acceptedAt: parsed.data.acceptedAt ? new Date(parsed.data.acceptedAt) : new Date(),
      officer: parsed.data.officer ?? null,
    },
    create: {
      caseId,
      acceptedAt: parsed.data.acceptedAt ? new Date(parsed.data.acceptedAt) : new Date(),
      officer: parsed.data.officer ?? null,
    },
  });

  if (canFirstTransition) {
    await prisma.procurementCase.update({
      where: { id: caseId },
      data: { currentState: 'ACCEPTANCE' as any },
    });
  }

  await logActivity({
    caseId,
    action: 'acceptance',
    fromState: existing.currentState as any,
    toState: (canFirstTransition ? 'ACCEPTANCE' : existing.currentState) as any,
    legalBasis: 'Acceptance by Supply Officer',
  });

  return NextResponse.json(created, { status: 201 });
}


