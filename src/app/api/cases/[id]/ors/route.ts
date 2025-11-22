import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity, logEdit, logDelete } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { ORSSchema } from '@/lib/validators/finance';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { validateEdit, validateDelete, getPreviousState } from '@/lib/workflows/workflowMutations';
import type { CaseState, UserRole } from '@/generated/prisma';
import { logOverrideAlert } from '@/lib/alerts/overrideAlerts';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['BUDGET_MANAGER', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;

  const rl = await rateLimit(req, clientIpKey(req, 'ors'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`ors:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const json = await req.json();
  const parsed = ORSSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  try {
    await assertCanTransition(existing, 'ORS' as CaseState);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Transition not allowed' },
      { status: 400 },
    );
  }

  const created = await prisma.oRS.create({
    data: {
      caseId,
      orsNumber: parsed.data.orsNumber ?? null,
      preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
      approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
      approvedBy: parsed.data.approvedBy ?? null,
    },
  });

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: 'ORS' as CaseState },
  });

  await logActivity({
    caseId,
    action: 'ors',
    fromState: existing.currentState,
    toState: 'ORS' as CaseState,
    actorId: authz.user.id,
    changeType: 'CREATE',
    entity: 'ORS',
    entityId: created.id,
  });

  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['BUDGET_MANAGER', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;
  const json = await req.json();
  
  // Extract reason and data
  const { reason, ...data } = json;
  
  if (!reason) {
    return NextResponse.json({ error: 'Reason is required for edits' }, { status: 400 });
  }

  const parsed = ORSSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Check permissions
  const validation = await validateEdit(caseId, 'ors', authz.user.role);
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  const existingORS = await prisma.oRS.findUnique({ where: { caseId } });
  if (!existingORS) return NextResponse.json({ error: 'ORS not found' }, { status: 404 });

  const updated = await prisma.oRS.update({
    where: { caseId },
    data: {
      orsNumber: parsed.data.orsNumber ?? null,
      preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
      approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
      approvedBy: parsed.data.approvedBy ?? null,
    },
  });

  await logEdit({
    caseId,
    entity: 'ORS',
    entityId: updated.id,
    before: existingORS,
    after: updated,
    reason,
    actorId: authz.user.id,
    role: authz.user.role,
    isOverride: validation.requiresOverride
  });

  if (validation.requiresOverride) {
    logOverrideAlert('UPDATE', 'ORS', caseId, authz.user, reason);
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['ADMIN'] as UserRole[]); // Usually only ADMIN can delete
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;
  const json = await req.json().catch(() => ({})); // Optional body for DELETE
  const { reason } = json;

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required for deletion' }, { status: 400 });
  }

  const validation = await validateDelete(caseId, 'ors', authz.user.role);
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  const existingORS = await prisma.oRS.findUnique({ where: { caseId } });
  if (!existingORS) return NextResponse.json({ error: 'ORS not found' }, { status: 404 });

  // Determine previous state
  const currentCase = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!currentCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const previousState = getPreviousState(currentCase.currentState as CaseState) || 'ACCEPTANCE'; // Fallback?

  // Perform delete
  await prisma.oRS.delete({ where: { caseId } });

  // Rollback state
  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: previousState },
  });

  await logDelete({
    caseId,
    entity: 'ORS',
    entityId: existingORS.id,
    before: existingORS,
    reason,
    actorId: authz.user.id,
    role: authz.user.role,
    isOverride: validation.requiresOverride,
    fromState: currentCase.currentState as CaseState,
    toState: previousState,
  });

  if (validation.requiresOverride) {
    logOverrideAlert('DELETE', 'ORS', caseId, authz.user, reason);
  }

  return NextResponse.json({ success: true });
}
