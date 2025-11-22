import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity, logEdit, logDelete } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { RFQSchema } from '@/lib/validators/rfq';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { validateEdit, validateDelete, getPreviousState } from '@/lib/workflows/workflowMutations';
import type { CaseState, UserRole } from '@/generated/prisma';
import { logOverrideAlert } from '@/lib/alerts/overrideAlerts';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const rl = await rateLimit(req, clientIpKey(req, 'rfq'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const { id: caseId } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = RFQSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`rfq:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const caseExisting = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!caseExisting) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  await assertCanTransition(caseExisting, 'RFQ_ISSUED' as CaseState);

  const existingRFQ = await prisma.rFQ.findUnique({ where: { caseId } });
  if (existingRFQ) return NextResponse.json(existingRFQ);

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.rFQ.create({
      data: {
        caseId,
        issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : new Date(),
      },
    });

    await tx.procurementCase.update({
      where: { id: caseId },
      data: { currentState: 'RFQ_ISSUED' as CaseState },
    });

    await logActivity({
      caseId,
      action: 'issue_rfq',
      fromState: caseExisting.currentState,
      toState: 'RFQ_ISSUED' as CaseState,
      actorId: authz.user.id,
      changeType: 'CREATE',
      entity: 'RFQ',
      entityId: created.id,
    });

    return created;
  });

  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;
  const json = await req.json();
  const { reason, ...data } = json;

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required for edits' }, { status: 400 });
  }

  const parsed = RFQSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const validation = await validateEdit(caseId, 'rfq', authz.user.role);
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  const existingRFQ = await prisma.rFQ.findUnique({ where: { caseId } });
  if (!existingRFQ) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

  const updated = await prisma.rFQ.update({
    where: { caseId },
    data: {
      issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : undefined,
      rfqNumber: parsed.data.rfqNumber ?? undefined,
    },
  });

  await logEdit({
    caseId,
    entity: 'RFQ',
    entityId: updated.id,
    before: existingRFQ,
    after: updated,
    reason,
    actorId: authz.user.id,
    role: authz.user.role,
    isOverride: validation.requiresOverride
  });

  if (validation.requiresOverride) {
    logOverrideAlert('UPDATE', 'RFQ', caseId, authz.user, reason);
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;
  const json = await req.json().catch(() => ({}));
  const { reason } = json;

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required for deletion' }, { status: 400 });
  }

  const validation = await validateDelete(caseId, 'rfq', authz.user.role);
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  const existingRFQ = await prisma.rFQ.findUnique({ where: { caseId } });
  if (!existingRFQ) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

  const currentCase = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!currentCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const previousState = getPreviousState(currentCase.currentState as CaseState) || 'DRAFT';

  await prisma.rFQ.delete({ where: { caseId } });

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: previousState },
  });

  await logDelete({
    caseId,
    entity: 'RFQ',
    entityId: existingRFQ.id,
    before: existingRFQ,
    reason,
    actorId: authz.user.id,
    role: authz.user.role,
    isOverride: validation.requiresOverride,
    fromState: currentCase.currentState as CaseState,
    toState: previousState,
  });

  if (validation.requiresOverride) {
    logOverrideAlert('DELETE', 'RFQ', caseId, authz.user, reason);
  }

  return NextResponse.json({ success: true });
}
