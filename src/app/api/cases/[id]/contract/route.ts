import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContractSchema } from '@/lib/validators/contract';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '../../../../../lib/idempotency';
import { sendEmail } from '@/lib/notifications/resend';
import { ensureRole } from '@/lib/authz';
import { transitionCaseState } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const rl = await rateLimit(req, clientIpKey(req, 'contract'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const { id: caseId } = await params;
  const json = await req.json();
  const parsed = ContractSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`contract:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const created = await prisma.contract.upsert({
    where: { caseId },
    update: {
      contractNo: parsed.data.contractNo,
      signedAt: parsed.data.signedAt ? new Date(parsed.data.signedAt) : null,
    },
    create: {
      caseId,
      contractNo: parsed.data.contractNo,
      signedAt: parsed.data.signedAt ? new Date(parsed.data.signedAt) : null,
    },
  });

  try {
    await transitionCaseState(caseId, 'CONTRACT_SIGNED' as any, {
      action: 'contract_signed',
      legalBasis: 'RA 9184 IRR Sec. 37 (Contract Signing)',
    });
  } catch (error) {
    const message = (error as Error).message || 'Transition not allowed';
    const status = message === 'Case not found' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  await sendEmail({
    to: 'procurement@local',
    subject: 'Contract Signed',
    html: `<p>Case ${caseId} contract ${created.contractNo || ''} signed.</p>`,
  });

  return NextResponse.json(created, { status: 201 });
}
