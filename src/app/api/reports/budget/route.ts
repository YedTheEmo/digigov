import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureRole } from '@/lib/authz';
import type { UserRole } from '@/generated/prisma';

export async function GET(req: NextRequest) {
  // Only internal users can see reports
  const authz = await ensureRole(['ADMIN', 'BUDGET_MANAGER', 'ACCOUNTING_MANAGER', 'PROCUREMENT_MANAGER', 'BAC_SECRETARIAT'] as UserRole[]);
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status });

  const searchParams = req.nextUrl.searchParams;
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  // Date range for the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  // 1. Utilization: ABC vs Awarded
  const utilization = await prisma.procurementCase.aggregate({
    where: {
      createdAt: { gte: startDate, lt: endDate },
      award: { isNot: null },
    },
    _sum: {
      abc: true,
    },
  });
  
  // Award amounts come from Quotation (Small Value) or Bid (Public Bidding) usually, 
  // but for simplicity let's assume we might store awardedAmount on Award or calculate from winning quote/bid.
  // The schema has `amount` on Quotation and Bid.
  // Let's aggregate `Quotation.amount` for awarded cases.
  // Or simplified: `Contract.amount` if we had it, or sum of winning quotes.
  // Schema check: `Quotation` has `isResponsive`, `amount`. `Bid` has `amount`.
  // We'll approximate by summing responsive quotations for awarded cases.
  
  const awardedCases = await prisma.procurementCase.findMany({
    where: {
      createdAt: { gte: startDate, lt: endDate },
      currentState: { in: ['AWARDED', 'PO_APPROVED', 'CONTRACT_SIGNED', 'NTP_ISSUED', 'DELIVERY', 'INSPECTION', 'ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED'] },
    },
    select: {
      id: true,
      method: true,
      abc: true,
      quotations: { where: { isResponsive: true } }, // simplification
      bids: { where: { isResponsive: true } }, // simplification
    }
  });

  let totalAwarded = 0;
  for (const c of awardedCases) {
    if (c.method === 'SMALL_VALUE_RFQ' && c.quotations.length > 0) {
      // Assume lowest responsive
       const min = Math.min(...c.quotations.map(q => Number(q.amount)));
       totalAwarded += min;
    } else if (c.method === 'PUBLIC_BIDDING' && c.bids.length > 0) {
       const min = Math.min(...c.bids.map(b => Number(b.amount)));
       totalAwarded += min;
    }
  }

  // 2. Obligations vs Disbursements
  // ORS sum vs Check sum
  // Currently ORS/Check models don't store 'amount' explicitly, they link to Case.
  // Usually ORS amount = Award amount (or Contract amount).
  // We'll use the `totalAwarded` logic for ORS amount if ORS exists.
  
  let totalObligated = 0;
  let totalDisbursed = 0; // Checks
  let totalPayable = 0; // DVs

  const casesWithFinance = await prisma.procurementCase.findMany({
    where: {
      createdAt: { gte: startDate, lt: endDate },
    },
    include: {
      ors: true,
      dv: true,
      check: true,
      quotations: { where: { isResponsive: true } },
      bids: { where: { isResponsive: true } },
    }
  });

  const payables = [];

  for (const c of casesWithFinance) {
    let amount = 0;
    if (c.method === 'SMALL_VALUE_RFQ' && c.quotations.length > 0) {
       amount = Math.min(...c.quotations.map(q => Number(q.amount)));
    } else if (c.method === 'PUBLIC_BIDDING' && c.bids.length > 0) {
       amount = Math.min(...c.bids.map(b => Number(b.amount)));
    }
    
    // If amount is 0/NaN, skip or use ABC? Use ABC as fallback? No, 0 is safer.
    if (amount === Infinity) amount = 0;

    if (c.ors) totalObligated += amount;
    if (c.dv) totalPayable += amount;
    if (c.check) totalDisbursed += amount;

    // Aging: DV exists but Check does not
    if (c.dv && !c.check) {
      const dvDate = c.dv.preparedAt || c.dv.approvedAt || new Date();
      const ageDays = Math.floor((new Date().getTime() - new Date(dvDate).getTime()) / (1000 * 3600 * 24));
      payables.push({
        caseId: c.id,
        title: c.title,
        dvNumber: c.dv.dvNumber,
        amount,
        ageDays,
        status: ageDays > 7 ? 'OVERDUE' : 'PENDING',
      });
    }
  }

  return NextResponse.json({
    year,
    budget: {
      totalABC: Number(utilization._sum.abc || 0),
      totalAwarded,
      utilizationRate: utilization._sum.abc ? (totalAwarded / Number(utilization._sum.abc)) : 0,
    },
    execution: {
      totalObligated,
      totalPayable,
      totalDisbursed,
      disbursementRate: totalObligated ? (totalDisbursed / totalObligated) : 0,
    },
    payables: payables.sort((a, b) => b.ageDays - a.ageDays),
  });
}


