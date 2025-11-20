import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import type { Prisma } from '@/generated/prisma';
import type { CaseState } from '@/generated/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const query = url.searchParams.get('query');
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  const take = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 100) : undefined;
  const skip = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : undefined;

  const where: Prisma.ProcurementCaseWhereInput = {};
  if (status) where.currentState = status as CaseState;
  if (query && query.trim().length > 0) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { id: query },
    ];
  }
  // section filter is for UI grouping; for now return all cases

  const cases = await prisma.procurementCase.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    skip,
    include: { rfq: true, quotations: true, abstract: true, bacResolution: true, award: true, contract: true, ntp: true, deliveries: true, inspection: true, acceptance: true, ors: true, dv: true, check: true, checkAdvice: true, bidBulletins: true, preBid: true, bids: true, twgEvaluation: true, postQualification: true },
  });
  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.procurementCase.create({ data: body });
  try {
    await logActivity({ caseId: created.id, action: 'create_case', toState: 'DRAFT' });
  } catch {}
  return NextResponse.json(created, { status: 201 });
}


