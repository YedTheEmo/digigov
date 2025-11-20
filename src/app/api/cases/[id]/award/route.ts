import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { AwardSchema } from '@/lib/validators/award';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '../../../../../lib/idempotency';
import { sendEmail } from '@/lib/notifications/resend';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState, UserRole } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['APPROVER', 'BAC_SECRETARIAT', 'ADMIN'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const rl = await rateLimit(req, clientIpKey(req, 'award'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  const { id: caseId } = await params;
  const json = await req.json();
  const parsed = AwardSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`award:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const c = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  // For public bidding, require both Post-Qualification PASSED and BAC Resolution per client flow
  if (c.method === 'PUBLIC_BIDDING') {
    const pq = await prisma.postQualification.findUnique({ where: { caseId } });
    if (!pq?.passed) return NextResponse.json({ error: 'Post-Qualification must be passed' }, { status: 400 });
    const bac = await prisma.bACResolution.findUnique({ where: { caseId } });
    if (!bac) return NextResponse.json({ error: 'BAC Resolution required' }, { status: 400 });
  } else {
    const bac = await prisma.bACResolution.findUnique({ where: { caseId } });
    if (!bac) return NextResponse.json({ error: 'BAC Resolution required' }, { status: 400 });
  }
  try {
    await assertCanTransition(c, 'AWARDED' as CaseState);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Transition not allowed' },
      { status: 400 },
    );
  }

  const created = await prisma.award.upsert({
    where: { caseId },
    update: {
      awardedTo: parsed.data.awardedTo,
      noticeDate: parsed.data.noticeDate ? new Date(parsed.data.noticeDate) : null,
    },
    create: {
      caseId,
      awardedTo: parsed.data.awardedTo,
      noticeDate: parsed.data.noticeDate ? new Date(parsed.data.noticeDate) : null,
    },
  });

  await prisma.procurementCase.update({
    where: { id: caseId },
    data: { currentState: 'AWARDED' as CaseState },
  });

  await logActivity({
    caseId,
    action: 'award',
    fromState: c.currentState,
    toState: 'AWARDED' as CaseState,
  });

  await sendEmail({
    to: 'approver@local',
    subject: 'Case Awarded',
    html: `<p>Case ${caseId} awarded to ${created.awardedTo || 'N/A'}.</p>`,
  });

  return NextResponse.json(created, { status: 201 });
}


