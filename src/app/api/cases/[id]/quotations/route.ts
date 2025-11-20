import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { ensureRole } from '@/lib/authz';
import { QuotationSchema } from '@/lib/validators/quotation';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { useIdempotencyKey } from '@/lib/idempotency';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotations = await prisma.quotation.findMany({
    where: { caseId: id },
    orderBy: { submittedAt: 'desc' },
  });
  return NextResponse.json(quotations);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await ensureRole(['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'] as any);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const { id: caseId } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = QuotationSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const rl = await rateLimit(req, clientIpKey(req, 'quotation'));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey) {
    const idem = await useIdempotencyKey(`quotation:${caseId}:${idemKey}`);
    if (!idem.ok) return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
  }

  const existingCase = await prisma.procurementCase.findUnique({ where: { id: caseId } });
  if (!existingCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  let shouldEnterCollection = false;
  if (existingCase.currentState === 'RFQ_ISSUED') {
    try {
      await assertCanTransition(existingCase as any, 'QUOTATION_COLLECTION' as any);
      shouldEnterCollection = true;
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message || 'Transition not allowed' },
        { status: 400 },
      );
    }
  }

  const created = await prisma.quotation.create({
    data: {
      caseId,
      supplierName: parsed.data.supplierName,
      amount: parsed.data.amount as any,
      isResponsive: parsed.data.isResponsive ?? true,
    },
  });

  if (shouldEnterCollection) {
    await prisma.procurementCase.update({
      where: { id: caseId },
      data: { currentState: 'QUOTATION_COLLECTION' as any },
    });

    await logActivity({
      caseId,
      action: 'start_quotation_collection',
      fromState: existingCase.currentState as any,
      toState: 'QUOTATION_COLLECTION' as any,
    });
  }

  await logActivity({
    caseId,
    action: 'add_quotation',
    payload: created,
  });

  return NextResponse.json(created, { status: 201 });
}


