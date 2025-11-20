import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['BAC_SECRETARIAT', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const rl = await rateLimit(req, clientIpKey(req, 'pre_bid'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`pre_bid:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const body = await req.json();
  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  await assertCanTransition(existing as any, 'PRE_BID_CONF' as any);
  const created = await prisma.preBidConference.upsert({
    where: { caseId },
    update: { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null, minutesUrl: body.minutesUrl ?? null, notes: body.notes ?? null },
    create: { caseId, scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null, minutesUrl: body.minutesUrl ?? null, notes: body.notes ?? null },
  });
  await prisma.procurementCase.update({ where: { id: caseId }, data: { currentState: 'PRE_BID_CONF' } });
  await logActivity({ caseId, action: 'pre_bid_conf', toState: 'PRE_BID_CONF', legalBasis: 'RA 9184 IRR Sec. 22 (Pre-Bid Conference)' });
  if (created.scheduledAt) {
    await prisma.reminder.create({ data: { caseId, type: 'PRE_BID_CONF', dueAt: created.scheduledAt } });
  }
  if (body.bidOpeningAt) {
    const bidOpeningAt = new Date(body.bidOpeningAt);
    await prisma.reminder.create({ data: { caseId, type: 'BID_OPENING', dueAt: bidOpeningAt } });
  }
  return NextResponse.json(created, { status: 201 });
}


