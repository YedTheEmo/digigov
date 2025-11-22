import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureRole } from '@/lib/authz';
import type { UserRole } from '@/generated/prisma';

export async function GET(req: NextRequest) {
  const authz = await ensureRole(['ADMIN', 'PROCUREMENT_MANAGER', 'BAC_SECRETARIAT'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const searchParams = req.nextUrl.searchParams;
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const cases = await prisma.procurementCase.findMany({
    where: { createdAt: { gte: startDate, lt: endDate } },
    include: {
      rfq: true,
      abstract: true,
      bacResolution: true,
      award: true,
      contract: true,
      ntp: true,
      ors: true,
      dv: true,
      check: true,
    }
  });

  // Calculate durations
  const durations: Record<string, number[]> = {
    'RFQ-Award': [],
    'Award-Contract': [],
    'Contract-NTP': [],
    'NTP-Check': [],
    'Total': [],
  };

  let completedCount = 0;
  let awardedCount = 0;

  for (const c of cases) {
    if (c.currentState === 'CLOSED' || c.currentState === 'CHECK') completedCount++;
    if (c.award) awardedCount++;

    const created = c.createdAt.getTime();
    const rfq = c.rfq?.issuedAt?.getTime();
    const award = c.award?.noticeDate?.getTime();
    const contract = c.contract?.signedAt?.getTime();
    const ntp = c.ntp?.issuedAt?.getTime();
    const check = c.check?.approvedAt?.getTime();

    if (rfq && award) durations['RFQ-Award'].push((award - rfq) / (1000 * 3600 * 24));
    if (award && contract) durations['Award-Contract'].push((contract - award) / (1000 * 3600 * 24));
    if (contract && ntp) durations['Contract-NTP'].push((ntp - contract) / (1000 * 3600 * 24));
    if (ntp && check) durations['NTP-Check'].push((check - ntp) / (1000 * 3600 * 24));
    if (check) durations['Total'].push((check - created) / (1000 * 3600 * 24));
  }

  const stats = Object.entries(durations).map(([stage, values]) => {
    const count = values.length;
    const avg = count ? values.reduce((a, b) => a + b, 0) / count : 0;
    const min = count ? Math.min(...values) : 0;
    const max = count ? Math.max(...values) : 0;
    return { stage, avg, min, max, count };
  });

  // Identify bottlenecks (stages taking > 7 days avg)
  const bottlenecks = stats.filter(s => s.avg > 7).map(s => ({ stage: s.stage, avg: s.avg }));

  return NextResponse.json({
    totalCases: cases.length,
    completedCount,
    awardedCount,
    stats,
    bottlenecks,
  });
}


