import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureRole } from '@/lib/authz';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '../../../../../lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { logActivity } from '@/lib/activity';
import { InspectionSchema } from '@/lib/validators/post_award';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;

  const rl = await rateLimit(req, clientIpKey(req, 'pmt_inspection'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`pmt_inspection:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = InspectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  try {
    await assertCanTransition(existing, 'PMT_INSPECTION' as CaseState);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Transition not allowed' },
      { status: 400 },
    );
  }

  const created = await prisma.pMTInspectionReport.upsert({
    where: { caseId },
    update: {
      status: parsed.data.status ?? null,
      inspector: parsed.data.inspector ?? null,
      inspectedAt: parsed.data.inspectedAt ? new Date(parsed.data.inspectedAt) : new Date(),
      notes: parsed.data.notes ?? null,
    },
    create: {
      caseId,
      status: parsed.data.status ?? null,
      inspector: parsed.data.inspector ?? null,
      inspectedAt: parsed.data.inspectedAt ? new Date(parsed.data.inspectedAt) : new Date(),
      notes: parsed.data.notes ?? null,
    },
  });

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: 'PMT_INSPECTION' as CaseState },
  });

  await logActivity({
    caseId,
    action: 'pmt_inspection',
    fromState: existing.currentState,
    toState: 'PMT_INSPECTION' as CaseState,
  });

  return NextResponse.json(created, { status: 201 });
}

