import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.bidBulletin.findMany({ where: { caseId: id }, orderBy: { publishedAt: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['BAC_SECRETARIAT', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const rl = await rateLimit(req, clientIpKey(req, 'bid_bulletin'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`bid_bulletin:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const body = await req.json();
  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  await assertCanTransition(existing as any, 'BID_BULLETIN' as any);
  const rawNumber = body.number;
  const number =
    rawNumber === undefined || rawNumber === null || rawNumber === ''
      ? null
      : Number(rawNumber);
  if (number !== null && !Number.isInteger(number)) {
    return NextResponse.json(
      { error: 'Bid bulletin number must be an integer or left blank.' },
      { status: 400 },
    );
  }

  const created = await prisma.bidBulletin.create({
    data: {
      caseId,
      number,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      notes: body.notes ?? null,
    },
  });
  await prisma.procurementCase.update({ where: { id: caseId }, data: { currentState: 'BID_BULLETIN' } });
  await logActivity({ caseId, action: 'bid_bulletin', toState: 'BID_BULLETIN' });
  return NextResponse.json(created, { status: 201 });
}


