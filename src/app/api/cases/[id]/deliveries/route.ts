import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { DeliverySchema } from '@/lib/validators/post_award';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deliveries = await prisma.delivery.findMany({ where: { caseId: id }, orderBy: { deliveredAt: 'asc' } });
  return NextResponse.json(deliveries);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['SUPPLY_MANAGER', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const rl = await rateLimit(req, clientIpKey(req, 'delivery'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`delivery:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const json = await req.json();
  const parsed = DeliverySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const currentState = existing.currentState as CaseState;
  const canFirstTransition = currentState === 'NTP_ISSUED';
  const canAppendDelivery = ['DELIVERY', 'INSPECTION', 'ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED'].includes(
    currentState,
  );

  if (!canFirstTransition && !canAppendDelivery) {
    return NextResponse.json(
      { error: 'Cannot record delivery in the current state.' },
      { status: 400 },
    );
  }

  if (canFirstTransition) {
    try {
      await assertCanTransition(existing, 'DELIVERY' as CaseState);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message || 'Transition not allowed' },
        { status: 400 },
      );
    }
  }

  const created = await prisma.delivery.create({
    data: {
      caseId,
      deliveredAt: parsed.data.deliveredAt ? new Date(parsed.data.deliveredAt) : new Date(),
      notes: parsed.data.notes ?? null,
    },
  });

  if (canFirstTransition) {
    await prisma.procurementCase.update({
      where: { id: caseId },
      data: { currentState: 'DELIVERY' as CaseState },
    });
  }

  await logActivity({
    caseId,
    action: 'delivery',
    fromState: existing.currentState,
    toState: (canFirstTransition ? 'DELIVERY' : existing.currentState) as CaseState,
    legalBasis: 'RA 9184: Contract Implementation/Delivery',
  });

  return NextResponse.json(created, { status: 201 });
}


