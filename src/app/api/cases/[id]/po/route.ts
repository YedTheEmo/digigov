import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureRole } from '@/lib/authz';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '../../../../../lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { logActivity } from '@/lib/activity';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authz = await ensureRole(['APPROVER', 'ADMIN'] as UserRole[]);
    if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

    const { id: caseId } = await params;
    const rl = await rateLimit(req, clientIpKey(req, 'po'));
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Rate limited' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const idemKey = req.headers.get('Idempotency-Key');
    if (idemKey) {
      const idem = await useIdempotencyKey(`po:${caseId}:${idemKey}`);
      if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
    }

    const json = await req.json().catch(() => ({}));
    const poNo: string | undefined = json?.poNo;
    const approvedAtRaw: string | undefined = json?.approvedAt;
    const approvedAt = approvedAtRaw ? new Date(approvedAtRaw) : new Date();

    const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
    if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    try {
      await assertCanTransition(existing, 'PO_APPROVED' as CaseState);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message || 'Transition not allowed' },
        { status: 400 },
      );
    }

    const created = await prisma.purchaseOrder.upsert({
      where: { caseId },
      update: {
        poNo: poNo ?? null,
        approvedAt,
        approvedBy: authz.user.name ?? authz.user.email ?? 'Approver',
      },
      create: {
        caseId,
        poNo: poNo ?? null,
        approvedAt,
        approvedBy: authz.user.name ?? authz.user.email ?? 'Approver',
      },
    });

    await prisma.procurementCase.update({
      where: { id: caseId },
      data: { currentState: 'PO_APPROVED' as CaseState },
    });

    await logActivity({
      caseId,
      action: 'po_approved',
      fromState: existing.currentState,
      toState: 'PO_APPROVED' as CaseState,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    // Surface error details during E2E to avoid opaque 500/null failures
    console.error('PO route error', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

