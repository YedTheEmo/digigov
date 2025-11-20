import type { CaseState, ProcurementCase, ProcurementMethod } from '@/generated/prisma';
import { legalConfig, type Regime } from '@/lib/legal-config';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

// High-level mapping of workflow states to client sections:
// - Procurement: all pre-award and award steps up to and including CONTRACT_SIGNED
// - Supply: NTP_ISSUED, DELIVERY, INSPECTION, ACCEPTANCE
// - Budget: ORS preparation happens after ACCEPTANCE
// - Accounting: DV creation after ORS
// - Cashier: CHECK and CHECK_ADVICE (CLOSED)

function transitionsForMethod(method: ProcurementMethod) {
  if (method === 'PUBLIC_BIDDING') {
    return {
      DRAFT: ['POSTING'],
      POSTING: ['BID_BULLETIN', 'PRE_BID_CONF', 'BID_SUBMISSION_OPENING'],
      BID_BULLETIN: ['PRE_BID_CONF', 'BID_SUBMISSION_OPENING'],
      PRE_BID_CONF: ['BID_SUBMISSION_OPENING'],
      BID_SUBMISSION_OPENING: ['TWG_EVALUATION'],
      TWG_EVALUATION: ['POST_QUALIFICATION'],
      POST_QUALIFICATION: ['BAC_RESOLUTION'],
      BAC_RESOLUTION: ['AWARDED'],
      AWARDED: ['PO_APPROVED'],
      PO_APPROVED: ['CONTRACT_SIGNED'],
      CONTRACT_SIGNED: ['NTP_ISSUED'],
      NTP_ISSUED: ['DELIVERY'],
      DELIVERY: ['INSPECTION'],
      INSPECTION: ['ACCEPTANCE'],
      ACCEPTANCE: ['ORS'],
      ORS: ['DV'],
      DV: ['CHECK'],
      CHECK: ['CLOSED'],
      CLOSED: [],
    } as Partial<Record<CaseState, CaseState[]>>;
  }

  if (method === 'INFRASTRUCTURE') {
    return {
      DRAFT: ['POSTING'],
      POSTING: ['BID_BULLETIN', 'PRE_BID_CONF', 'BID_SUBMISSION_OPENING'],
      BID_BULLETIN: ['PRE_BID_CONF', 'BID_SUBMISSION_OPENING'],
      PRE_BID_CONF: ['BID_SUBMISSION_OPENING'],
      BID_SUBMISSION_OPENING: ['TWG_EVALUATION'],
      TWG_EVALUATION: ['POST_QUALIFICATION'],
      POST_QUALIFICATION: ['BAC_RESOLUTION'],
      BAC_RESOLUTION: ['AWARDED'],
      AWARDED: ['PO_APPROVED'],
      PO_APPROVED: ['CONTRACT_SIGNED'],
      CONTRACT_SIGNED: ['NTP_ISSUED'],
      NTP_ISSUED: ['PROGRESS_BILLING'],
      PROGRESS_BILLING: ['PMT_INSPECTION'],
      PMT_INSPECTION: ['ACCEPTANCE'],
      ACCEPTANCE: ['ORS'],
      ORS: ['DV'],
      DV: ['CHECK'],
      CHECK: ['CLOSED'],
      CLOSED: [],
    } as Partial<Record<CaseState, CaseState[]>>;
  }

  // SMALL_VALUE_RFQ default
  return {
    DRAFT: ['POSTING', 'RFQ_ISSUED'],
    POSTING: ['RFQ_ISSUED'],
    RFQ_ISSUED: ['QUOTATION_COLLECTION', 'ABSTRACT_OF_QUOTATIONS'],
    QUOTATION_COLLECTION: ['ABSTRACT_OF_QUOTATIONS'],
    ABSTRACT_OF_QUOTATIONS: ['BAC_RESOLUTION'],
    BAC_RESOLUTION: ['AWARDED'],
    AWARDED: ['PO_APPROVED'],
    PO_APPROVED: ['CONTRACT_SIGNED'],
    CONTRACT_SIGNED: ['NTP_ISSUED'],
    NTP_ISSUED: ['DELIVERY'],
    DELIVERY: ['INSPECTION'],
    INSPECTION: ['ACCEPTANCE'],
    ACCEPTANCE: ['ORS'],
    ORS: ['DV'],
    DV: ['CHECK'],
    CHECK: ['CLOSED'],
    CLOSED: [],
  } as Partial<Record<CaseState, CaseState[]>>;
}

export async function assertCanTransition(case_: ProcurementCase, nextState: CaseState) {
  const current = case_.currentState as CaseState;
  const method = case_.method as ProcurementMethod;
  console.log(`[assertCanTransition] Checking: ${current} → ${nextState} (method: ${method})`);
  const map = transitionsForMethod(method);
  const allowed = map[current] ?? [];
  if (!allowed.includes(nextState)) {
    console.error(`[assertCanTransition] Transition not allowed: ${current} → ${nextState}. Allowed:`, allowed);
    throw new Error(`Transition not allowed: ${current} → ${nextState}`);
  }
  console.log(`[assertCanTransition] Transition is allowed in state machine`);

  const regimeCfg = legalConfig[(case_.regime as Regime) ?? 'RA9184'];
  if (!regimeCfg) throw new Error('Missing legal configuration');

  // Method-specific prerequisite checks
  const caseId = case_.id;
  if (method === 'SMALL_VALUE_RFQ') {
    if (nextState === 'ABSTRACT_OF_QUOTATIONS') {
      const count = await prisma.quotation.count({ where: { caseId } });
      if (count < regimeCfg.minQuotations) throw new Error(`Need at least ${regimeCfg.minQuotations} quotations`);
    }
    if (nextState === 'BAC_RESOLUTION') {
      const abstract = await prisma.abstractOfQuotations.findUnique({ where: { caseId } });
      if (!abstract) throw new Error('Abstract of Quotations required before BAC Resolution');
    }
    if (nextState === 'AWARDED') {
      const bac = await prisma.bACResolution.findUnique({ where: { caseId } });
      if (!bac) throw new Error('BAC Resolution required before Award');
    }
  } else if (method === 'PUBLIC_BIDDING') {
    // Check bid existence only when moving TO evaluation, not when entering bid submission
    // BID_SUBMISSION_OPENING is when bids are BEING created, so we don't require them yet
    if (nextState === 'TWG_EVALUATION') {
      const bids = await prisma.bid.count({ where: { caseId } });
      console.log(`[assertCanTransition] PUBLIC_BIDDING → TWG_EVALUATION: Found ${bids} bid(s)`);
      if (bids < 1) throw new Error('At least one bid required before TWG evaluation');
    }
    if (nextState === 'BID_SUBMISSION_OPENING') {
      console.log(`[assertCanTransition] PUBLIC_BIDDING → BID_SUBMISSION_OPENING: Skipping bid count check (bids are being created)`);
    }
    if (nextState === 'POST_QUALIFICATION') {
      const twg = await prisma.tWGEvaluation.findUnique({ where: { caseId } });
      if (!twg) throw new Error('TWG Evaluation required before Post-Qualification');
    }
    if (nextState === 'BAC_RESOLUTION' || nextState === 'AWARDED') {
      const pq = await prisma.postQualification.findUnique({ where: { caseId } });
      if (!pq?.passed) throw new Error('Passed Post-Qualification required before BAC Resolution/Award');
    }
  } else if (method === 'INFRASTRUCTURE') {
    // Check bid existence only when moving TO evaluation, not when entering bid submission
    // BID_SUBMISSION_OPENING is when bids are BEING created, so we don't require them yet
    if (nextState === 'TWG_EVALUATION') {
      const bids = await prisma.bid.count({ where: { caseId } });
      console.log(`[assertCanTransition] INFRASTRUCTURE → TWG_EVALUATION: Found ${bids} bid(s)`);
      if (bids < 1) throw new Error('At least one bid required before TWG evaluation');
    }
    if (nextState === 'BID_SUBMISSION_OPENING') {
      console.log(`[assertCanTransition] INFRASTRUCTURE → BID_SUBMISSION_OPENING: Skipping bid count check (bids are being created)`);
    }
    if (nextState === 'POST_QUALIFICATION') {
      const twg = await prisma.tWGEvaluation.findUnique({ where: { caseId } });
      if (!twg) throw new Error('TWG Evaluation required before Post-Qualification');
    }
    if (nextState === 'BAC_RESOLUTION' || nextState === 'AWARDED') {
      const pq = await prisma.postQualification.findUnique({ where: { caseId } });
      if (!pq?.passed) throw new Error('Passed Post-Qualification required before BAC Resolution/Award');
    }
    // Infrastructure-specific prerequisites
    if (nextState === 'PROGRESS_BILLING') {
      const ntp = await prisma.noticeToProceed.findUnique({ where: { caseId } });
      if (!ntp) throw new Error('NTP required before Progress Billing');
    }
    if (nextState === 'PMT_INSPECTION') {
      const pb = await prisma.progressBilling.findUnique({ where: { caseId } });
      if (!pb) throw new Error('Progress Billing required before PMT Inspection');
    }
    if (nextState === 'ORS') {
      const pmt = await prisma.pMTInspectionReport.findUnique({ where: { caseId } });
      if (!pmt || pmt.status !== 'PASSED') throw new Error('PMT Inspection PASSED before ORS');
    }
  }

  // Common tail prerequisites
  if (nextState === 'CONTRACT_SIGNED') {
    const award = await prisma.award.findUnique({ where: { caseId } });
    if (!award) throw new Error('Award is required before Contract Signing');
    // If PO gate exists, require PO approval before contract
    const po = await prisma.purchaseOrder.findUnique({ where: { caseId } });
    if (!po) throw new Error('Purchase Order must be approved before Contract Signing');
  }
  if (nextState === 'NTP_ISSUED') {
    const contract = await prisma.contract.findUnique({ where: { caseId } });
    if (!contract) throw new Error('Contract must be signed before issuing NTP');
  }
  if (nextState === 'DELIVERY') {
    const ntp = await prisma.noticeToProceed.findUnique({ where: { caseId } });
    if (!ntp) throw new Error('NTP required before Delivery');
  }
  if (nextState === 'INSPECTION') {
    const deliveries = await prisma.delivery.count({ where: { caseId } });
    if (deliveries < 1) throw new Error('At least one delivery record required before Inspection');
  }
  if (nextState === 'ACCEPTANCE') {
    if (method === 'INFRASTRUCTURE') {
      const pmt = await prisma.pMTInspectionReport.findUnique({ where: { caseId } });
      if (!pmt || pmt.status !== 'PASSED') {
        throw new Error('PMT Inspection PASSED required before Acceptance');
      }
    } else {
      const report = await prisma.inspectionReport.findUnique({ where: { caseId } });
      if (!report || report.status !== 'PASSED') {
        throw new Error('Inspection PASSED required before Acceptance');
      }
    }
  }
  if (nextState === 'ORS') {
    const acc = await prisma.acceptance.findUnique({ where: { caseId } });
    if (!acc) throw new Error('Acceptance required before ORS');
  }
  if (nextState === 'DV') {
    const ors = await prisma.oRS.findUnique({ where: { caseId } });
    if (!ors) throw new Error('ORS required before DV');
  }
  if (nextState === 'CHECK') {
    const dv = await prisma.dV.findUnique({ where: { caseId } });
    if (!dv) throw new Error('DV required before Check');
  }
  if (nextState === 'CLOSED') {
    const check = await prisma.check.findUnique({ where: { caseId } });
    if (!check) throw new Error('Check required before closing');
  }

  return true;
}

export async function transitionCaseState(
  caseId: string,
  nextState: CaseState,
  options?: {
    updateData?: Record<string, unknown>;
    action?: string;
    legalBasis?: string | null;
    payload?: unknown;
    actorId?: string | null;
  },
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.procurementCase.findUnique({ where: { id: caseId } });
    if (!existing) {
      throw new Error('Case not found');
    }

    await assertCanTransition(existing, nextState);

    const updated = await tx.procurementCase.update({
      where: { id: caseId },
      data: {
        currentState: nextState,
        ...(options?.updateData ?? {}),
      },
    });

    if (options?.action) {
      await logActivity({
        caseId,
        action: options.action,
        fromState: existing.currentState,
        toState: nextState,
        legalBasis: options.legalBasis ?? null,
        payload: options.payload,
        actorId: options.actorId ?? null,
      });
    }

    return updated;
  });
}
