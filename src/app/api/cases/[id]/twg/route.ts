import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { TWGSchema } from '@/lib/validators/twg';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['TWG_MEMBER', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });
  const { id: caseId } = await params;
  const json = await req.json();
  const parsed = TWGSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const rl = await rateLimit(req, clientIpKey(req, 'twg'));
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`twg:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }
  const created = await prisma.tWGEvaluation.upsert({
    where: { caseId },
    update: { result: parsed.data.result, notes: parsed.data.notes ?? null, evaluatedAt: new Date() },
    create: { caseId, result: parsed.data.result, notes: parsed.data.notes ?? null, evaluatedAt: new Date() },
  });
  const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  await assertCanTransition(existing as any, 'TWG_EVALUATION' as any);
  await prisma.procurementCase.update({ where: { id: caseId }, data: { currentState: 'TWG_EVALUATION' } });
  await logActivity({ caseId, action: 'twg_evaluation', toState: 'TWG_EVALUATION', legalBasis: 'RA 9184 IRR Sec. 30-34 (Bid Eval)' });
  return NextResponse.json(created, { status: 201 });
}


