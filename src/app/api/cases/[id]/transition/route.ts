import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertCanTransition } from '@/lib/workflows/procurement';
import type { CaseState } from '@/generated/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params;
  const { action, payload } = await req.json();

  if (payload?.nextState) {
    const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
    if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    try {
      await assertCanTransition(existing, payload.nextState as CaseState);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const fromState = existing.currentState;
    const updated = await prisma.procurementCase.update({
      where: { id: caseId },
      data: { currentState: payload.nextState as CaseState },
    });
    await prisma.activityLog.create({
      data: {
        caseId,
        action: action ?? 'transition',
        fromState: fromState as CaseState,
        toState: payload.nextState as CaseState,
        legalBasis: payload?.legalBasis ?? null,
        payload,
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}


