import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logEdit, logDelete } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { QuotationSchema } from '@/lib/validators/quotation';
import { validateEdit, validateDelete } from '@/lib/workflows/workflowMutations';
import type { UserRole } from '@/generated/prisma';
import { logOverrideAlert } from '@/lib/alerts/overrideAlerts';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quotationId: string }> }
) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId, quotationId } = await params;
  const json = await req.json();
  const { reason, ...data } = json;

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required for edits' }, { status: 400 });
  }

  const parsed = QuotationSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const validation = await validateEdit(caseId, 'quotation', authz.user.role);
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  const existingQuotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!existingQuotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  if (existingQuotation.caseId !== caseId) {
    return NextResponse.json({ error: 'Quotation does not belong to this case' }, { status: 400 });
  }

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      supplierName: parsed.data.supplierName,
      amount: parsed.data.amount,
      isResponsive: parsed.data.isResponsive,
    },
  });

  await logEdit({
    caseId,
    entity: 'Quotation',
    entityId: updated.id,
    before: existingQuotation,
    after: updated,
    reason,
    actorId: authz.user.id,
    role: authz.user.role,
    isOverride: validation.requiresOverride
  });

  if (validation.requiresOverride) {
    logOverrideAlert('UPDATE', 'Quotation', caseId, authz.user, reason);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quotationId: string }> }
) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId, quotationId } = await params;
  const json = await req.json().catch(() => ({}));
  const { reason } = json;

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required for deletion' }, { status: 400 });
  }

  const validation = await validateDelete(caseId, 'quotation', authz.user.role);
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  const existingQuotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!existingQuotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  if (existingQuotation.caseId !== caseId) {
    return NextResponse.json({ error: 'Quotation does not belong to this case' }, { status: 400 });
  }

  await prisma.quotation.delete({ where: { id: quotationId } });

  await logDelete({
    caseId,
    entity: 'Quotation',
    entityId: existingQuotation.id,
    before: existingQuotation,
    reason,
    actorId: authz.user.id,
    role: authz.user.role,
    isOverride: validation.requiresOverride,
    // No state rollback for individual quotation delete usually
  });

  if (validation.requiresOverride) {
    logOverrideAlert('DELETE', 'Quotation', caseId, authz.user, reason);
  }

  return NextResponse.json({ success: true });
}


