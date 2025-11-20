import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logs = await prisma.activityLog.findMany({ where: { caseId: id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(logs);
}


