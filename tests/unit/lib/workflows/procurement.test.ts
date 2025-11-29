import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { prisma } from '@/lib/prisma';
import { createProcurementCase } from '../../__helpers__/factories';
import type { ProcurementMethod } from '@/generated/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    quotation: { count: vi.fn() },
    abstractOfQuotations: { findUnique: vi.fn() },
    bACResolution: { findUnique: vi.fn() },
    award: { findUnique: vi.fn() },
    purchaseOrder: { findUnique: vi.fn() },
    contract: { findUnique: vi.fn() },
    noticeToProceed: { findUnique: vi.fn() },
    delivery: { count: vi.fn() },
    inspectionReport: { findUnique: vi.fn() },
    acceptance: { findUnique: vi.fn() },
    oRS: { findUnique: vi.fn() },
    dV: { findUnique: vi.fn() },
    check: { findUnique: vi.fn() },
    bid: { count: vi.fn() },
    tWGEvaluation: { findUnique: vi.fn() },
    postQualification: { findUnique: vi.fn() },
    progressBilling: { count: vi.fn(), findMany: vi.fn() },
    pMTInspectionReport: { findMany: vi.fn() },
  },
}));

describe('procurement workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assertCanTransition - SMALL_VALUE_RFQ', () => {
    const method = 'SMALL_VALUE_RFQ' as ProcurementMethod;

    it('allows transition from DRAFT to POSTING', async () => {
      const case_ = createProcurementCase({ method, currentState: 'DRAFT' });
      await expect(assertCanTransition(case_, 'POSTING')).resolves.toBe(true);
    });

    it('allows transition from DRAFT to RFQ_ISSUED', async () => {
      const case_ = createProcurementCase({ method, currentState: 'DRAFT' });
      await expect(assertCanTransition(case_, 'RFQ_ISSUED')).resolves.toBe(true);
    });

    it('allows transition from POSTING to RFQ_ISSUED', async () => {
      const case_ = createProcurementCase({ method, currentState: 'POSTING' });
      await expect(assertCanTransition(case_, 'RFQ_ISSUED')).resolves.toBe(true);
    });

    it('allows transition from RFQ_ISSUED to QUOTATION_COLLECTION', async () => {
      const case_ = createProcurementCase({ method, currentState: 'RFQ_ISSUED' });
      await expect(assertCanTransition(case_, 'QUOTATION_COLLECTION')).resolves.toBe(true);
    });

    it('allows transition from QUOTATION_COLLECTION to ABSTRACT_OF_QUOTATIONS', async () => {
      const case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION' });
      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });

    it('blocks transition to ABSTRACT_OF_QUOTATIONS without minimum quotations', async () => {
      const case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(0);
      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).rejects.toThrow(
        'Need at least',
      );
    });

    it('blocks transition to BAC_RESOLUTION without abstract', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ABSTRACT_OF_QUOTATIONS' });
      vi.mocked(prisma.abstractOfQuotations.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'BAC_RESOLUTION')).rejects.toThrow(
        'Abstract of Quotations required',
      );
    });

    it('allows transition to BAC_RESOLUTION with abstract', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ABSTRACT_OF_QUOTATIONS' });
      vi.mocked(prisma.abstractOfQuotations.findUnique).mockResolvedValue({} as any);
      await expect(assertCanTransition(case_, 'BAC_RESOLUTION')).resolves.toBe(true);
    });

    it('blocks transition to AWARDED without BAC resolution', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'AWARDED')).rejects.toThrow(
        'BAC Resolution required',
      );
    });

    it('blocks invalid transition', async () => {
      const case_ = createProcurementCase({ method, currentState: 'DRAFT' });
      await expect(assertCanTransition(case_, 'AWARDED')).rejects.toThrow('Transition not allowed');
    });
  });

  describe('assertCanTransition - PUBLIC_BIDDING', () => {
    const method = 'PUBLIC_BIDDING' as ProcurementMethod;

    it('allows transition from DRAFT to POSTING', async () => {
      const case_ = createProcurementCase({ method, currentState: 'DRAFT' });
      await expect(assertCanTransition(case_, 'POSTING')).resolves.toBe(true);
    });

    it('allows transition from POSTING to BID_BULLETIN', async () => {
      const case_ = createProcurementCase({ method, currentState: 'POSTING' });
      await expect(assertCanTransition(case_, 'BID_BULLETIN')).resolves.toBe(true);
    });

    it('allows transition from POSTING to BID_SUBMISSION_OPENING', async () => {
      const case_ = createProcurementCase({ method, currentState: 'POSTING' });
      await expect(assertCanTransition(case_, 'BID_SUBMISSION_OPENING')).resolves.toBe(true);
    });

    it('blocks transition to TWG_EVALUATION without bids', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BID_SUBMISSION_OPENING' });
      vi.mocked(prisma.bid.count).mockResolvedValue(0);
      await expect(assertCanTransition(case_, 'TWG_EVALUATION')).rejects.toThrow(
        'At least one bid required',
      );
    });

    it('allows transition to TWG_EVALUATION with bids', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BID_SUBMISSION_OPENING' });
      vi.mocked(prisma.bid.count).mockResolvedValue(1);
      await expect(assertCanTransition(case_, 'TWG_EVALUATION')).resolves.toBe(true);
    });

    it('blocks transition to POST_QUALIFICATION without TWG evaluation', async () => {
      const case_ = createProcurementCase({ method, currentState: 'TWG_EVALUATION' });
      vi.mocked(prisma.tWGEvaluation.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'POST_QUALIFICATION')).rejects.toThrow(
        'TWG Evaluation required',
      );
    });

    it('blocks transition to BAC_RESOLUTION without passed post-qualification', async () => {
      const case_ = createProcurementCase({ method, currentState: 'POST_QUALIFICATION' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: false } as any);
      await expect(assertCanTransition(case_, 'BAC_RESOLUTION')).rejects.toThrow(
        'Passed Post-Qualification required',
      );
    });
  });

  describe('assertCanTransition - INFRASTRUCTURE', () => {
    const method = 'INFRASTRUCTURE' as ProcurementMethod;

    it('allows transition from NTP_ISSUED to PROGRESS_BILLING', async () => {
      const case_ = createProcurementCase({ method, currentState: 'NTP_ISSUED' });
      vi.mocked(prisma.noticeToProceed.findUnique).mockResolvedValue({} as any);
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).resolves.toBe(true);
    });

    it('blocks transition to PROGRESS_BILLING without NTP', async () => {
      const case_ = createProcurementCase({ method, currentState: 'NTP_ISSUED' });
      vi.mocked(prisma.noticeToProceed.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).rejects.toThrow(
        'NTP required',
      );
    });

    it('blocks transition to PMT_INSPECTION without progress billing', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PROGRESS_BILLING' });
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(0);
      await expect(assertCanTransition(case_, 'PMT_INSPECTION')).rejects.toThrow(
        'Progress Billing required',
      );
    });

    it('blocks transition to ORS without passed PMT inspection', async () => {
      // Use ACCEPTANCE as currentState, which is the valid previous state for ORS in INFRASTRUCTURE
      const case_ = createProcurementCase({ method, currentState: 'ACCEPTANCE' });
      vi.mocked(prisma.pMTInspectionReport.findMany).mockResolvedValue([{ status: 'FAILED' } as any]);
      vi.mocked(prisma.acceptance.findUnique).mockResolvedValue({} as any);
      await expect(assertCanTransition(case_, 'ORS')).rejects.toThrow(/PMT.*Inspection.*PASSED/i);
    });
  });

  describe('assertCanTransition - Common prerequisites', () => {
    it('blocks transition to CONTRACT_SIGNED without award', async () => {
      // Use PO_APPROVED as currentState, which is the valid previous state for CONTRACT_SIGNED
      const case_ = createProcurementCase({ 
        currentState: 'PO_APPROVED',
        method: 'SMALL_VALUE_RFQ'
      });
      vi.mocked(prisma.award.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).rejects.toThrow(
        /Award.*required/i,
      );
    });

    it('blocks transition to CONTRACT_SIGNED without PO', async () => {
      const case_ = createProcurementCase({ 
        currentState: 'PO_APPROVED',
        method: 'SMALL_VALUE_RFQ'
      });
      vi.mocked(prisma.award.findUnique).mockResolvedValue({} as any);
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).rejects.toThrow(
        /Purchase Order.*approved/i,
      );
    });

    it('blocks transition to NTP_ISSUED without contract', async () => {
      const case_ = createProcurementCase({ currentState: 'CONTRACT_SIGNED' });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'NTP_ISSUED')).rejects.toThrow(
        'Contract must be signed',
      );
    });

    it('blocks transition to DELIVERY without NTP', async () => {
      const case_ = createProcurementCase({ currentState: 'NTP_ISSUED' });
      vi.mocked(prisma.noticeToProceed.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'DELIVERY')).rejects.toThrow('NTP required');
    });

    it('blocks transition to INSPECTION without deliveries', async () => {
      const case_ = createProcurementCase({ currentState: 'DELIVERY' });
      vi.mocked(prisma.delivery.count).mockResolvedValue(0);
      await expect(assertCanTransition(case_, 'INSPECTION')).rejects.toThrow(
        'At least one delivery record required',
      );
    });

    it('blocks transition to ACCEPTANCE without passed inspection', async () => {
      const case_ = createProcurementCase({ currentState: 'INSPECTION' });
      vi.mocked(prisma.inspectionReport.findUnique).mockResolvedValue({ status: 'FAILED' } as any);
      await expect(assertCanTransition(case_, 'ACCEPTANCE')).rejects.toThrow(
        'Inspection PASSED required',
      );
    });

    it('blocks transition to ORS without acceptance', async () => {
      const case_ = createProcurementCase({ currentState: 'ACCEPTANCE' });
      vi.mocked(prisma.acceptance.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'ORS')).rejects.toThrow('Acceptance required');
    });

    it('blocks transition to DV without ORS', async () => {
      const case_ = createProcurementCase({ currentState: 'ORS' });
      vi.mocked(prisma.oRS.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'DV')).rejects.toThrow('ORS required');
    });

    it('blocks transition to CHECK without DV', async () => {
      const case_ = createProcurementCase({ currentState: 'DV' });
      vi.mocked(prisma.dV.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'CHECK')).rejects.toThrow('DV required');
    });

    it('blocks transition to CLOSED without check', async () => {
      const case_ = createProcurementCase({ currentState: 'CHECK' });
      vi.mocked(prisma.check.findUnique).mockResolvedValue(null);
      await expect(assertCanTransition(case_, 'CLOSED')).rejects.toThrow('Check required');
    });
  });
});

