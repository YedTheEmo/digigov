import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { InspectionSchema } from '@/lib/validators/post_award';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['SUPPLY_MANAGER', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const rl = await rateLimit(req, clientIpKey(req, 'inspection'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`inspection:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const json = await req.json();
  const parsed = InspectionSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const currentState = existing.currentState as CaseState;
  const canFirstTransition = currentState === 'DELIVERY';
  const canEditInspection = ['INSPECTION', 'ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED'].includes(currentState);

  if (!canFirstTransition && !canEditInspection) {
    return NextResponse.json(
      { error: 'Cannot record inspection in the current state.' },
      { status: 400 },
    );
  }

  if (canFirstTransition) {
    try {
      await assertCanTransition(existing, 'INSPECTION' as CaseState);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message || 'Transition not allowed' },
        { status: 400 },
      );
    }
  }

  const created = await prisma.inspectionReport.upsert({
    where: { caseId },
    update: {
      status: parsed.data.status ?? null,
      inspector: parsed.data.inspector ?? null,
      inspectedAt: parsed.data.inspectedAt ? new Date(parsed.data.inspectedAt) : new Date(),
      notes: parsed.data.notes ?? null,
      coaSignatory: parsed.data.coaSignatory ?? null,
      coaSignedAt: parsed.data.coaSignedAt ? new Date(parsed.data.coaSignedAt) : null,
      endUserSignatory: parsed.data.endUserSignatory ?? null,
      endUserSignedAt: parsed.data.endUserSignedAt ? new Date(parsed.data.endUserSignedAt) : null,
    },
    create: {
      caseId,
      status: parsed.data.status ?? null,
      inspector: parsed.data.inspector ?? null,
      inspectedAt: parsed.data.inspectedAt ? new Date(parsed.data.inspectedAt) : new Date(),
      notes: parsed.data.notes ?? null,
      coaSignatory: parsed.data.coaSignatory ?? null,
      coaSignedAt: parsed.data.coaSignedAt ? new Date(parsed.data.coaSignedAt) : null,
      endUserSignatory: parsed.data.endUserSignatory ?? null,
      endUserSignedAt: parsed.data.endUserSignedAt ? new Date(parsed.data.endUserSignedAt) : null,
    },
  });

  if (canFirstTransition) {
    await prisma.procurementCase.update({
      where: { id: caseId },
      data: { currentState: 'INSPECTION' as CaseState },
    });
  }

  await logActivity({
    caseId,
    action: 'inspection',
    fromState: existing.currentState,
    toState: (canFirstTransition ? 'INSPECTION' : existing.currentState) as CaseState,
    legalBasis: 'COA & End-User Inspection',
  });

  return NextResponse.json(created, { status: 201 });
}


