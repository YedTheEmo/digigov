import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { RFQSchema } from '@/lib/validators/rfq';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState, UserRole } from '@/generated/prisma';

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
    });

    return created;
  });

  return NextResponse.json(result, { status: 201 });
}


