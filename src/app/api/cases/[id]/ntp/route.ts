import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { NTPSchema } from '@/lib/validators/ntp';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '../../../../../lib/idempotency';
import { sendEmail } from '@/lib/notifications/resend';
import { ensureRole } from '@/lib/authz';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const rl = await rateLimit(req, clientIpKey(req, 'ntp'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const { id: caseId } = await params;
  const json = await req.json();
  const parsed = NTPSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`ntp:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  try {
    await assertCanTransition(existing as any, 'NTP_ISSUED' as any);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Transition not allowed' },
      { status: 400 },
    );
  }

  const created = await prisma.noticeToProceed.upsert({
    where: { caseId },
    update: {
      issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : null,
      daysToComply: parsed.data.daysToComply ?? null,
    },
    create: {
      caseId,
      issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : null,
      daysToComply: parsed.data.daysToComply ?? null,
    },
  });

  const issuedAt = created.issuedAt ?? new Date();
  const days = created.daysToComply ?? 30;
  const deliveryDueAt = new Date(issuedAt.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: 'NTP_ISSUED' as any, deliveryDueAt },
  });

  await prisma.reminder.upsert({
    where: { id: `${caseId}_delivery_due` },
    update: { dueAt: deliveryDueAt, type: 'DELIVERY_DUE' },
    create: { id: `${caseId}_delivery_due`, caseId, dueAt: deliveryDueAt, type: 'DELIVERY_DUE' },
  });

  await logActivity({
    caseId,
    action: 'ntp_issued',
    fromState: existing.currentState as any,
    toState: 'NTP_ISSUED' as any,
  });

  await sendEmail({
    to: 'supply@local',
    subject: 'NTP Issued',
    html: `<p>Case ${caseId} NTP issued.</p>`,
  });

  return NextResponse.json(created, { status: 201 });
}
