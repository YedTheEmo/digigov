import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertCanTransition } from '@/lib/workflows/procurement';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const caseId = params.id;
  const { action, payload } = await req.json();

  if (payload?.nextState) {
    const existing = await prisma.procurementCase.findUnique({ where: { id: caseId } });
    if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    try {
      await assertCanTransition(existing, payload.nextState);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const fromState = existing.currentState;
    const updated = await prisma.procurementCase.update({
      where: { id: caseId },
      data: { currentState: payload.nextState },
    });
    await prisma.activityLog.create({
      data: {
        caseId,
        action: action ?? 'transition',
        fromState: fromState as any,
        toState: payload.nextState,
        legalBasis: payload?.legalBasis ?? null,
        payload,
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}


