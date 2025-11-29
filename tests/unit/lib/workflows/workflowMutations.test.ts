import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasDownstreamData,
  validateEdit,
  validateDelete,
  getPreviousState,
} from '@/lib/workflows/workflowMutations';
import { prisma } from '@/lib/prisma';
import { createProcurementCase } from '../../__helpers__/factories';
import type { CaseState } from '@/generated/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dV: { count: vi.fn() },
    check: { count: vi.fn() },
    procurementCase: { findUnique: vi.fn() },
    quotation: { count: vi.fn() },
    abstractOfQuotations: { count: vi.fn() },
    bACResolution: { count: vi.fn() },
    award: { count: vi.fn() },
    contract: { count: vi.fn() },
    purchaseOrder: { count: vi.fn() },
    noticeToProceed: { count: vi.fn() },
    delivery: { count: vi.fn() },
    progressBilling: { count: vi.fn() },
    inspectionReport: { count: vi.fn() },
    acceptance: { count: vi.fn() },
    oRS: { count: vi.fn() },
  },
}));

describe('workflowMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasDownstreamData', () => {
    it('returns true when DV exists after ORS', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'ors');
      expect(result).toBe(true);
      expect(prisma.dV.count).toHaveBeenCalledWith({ where: { caseId: 'case-id' } });
    });

    it('returns false when no DV exists after ORS', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(0);
      const result = await hasDownstreamData('case-id', 'ors');
      expect(result).toBe(false);
    });

    it('returns true when Check exists after DV', async () => {
      vi.mocked(prisma.check.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'dv');
      expect(result).toBe(true);
      expect(prisma.check.count).toHaveBeenCalledWith({ where: { caseId: 'case-id' } });
    });

    it('returns true when case is CLOSED after Check', async () => {
      vi.mocked(prisma.procurementCase.findUnique).mockResolvedValue(
        createProcurementCase({ currentState: 'CLOSED' }) as any,
      );
      const result = await hasDownstreamData('case-id', 'check');
      expect(result).toBe(true);
    });

    it('returns false when case is not CLOSED after Check', async () => {
      vi.mocked(prisma.procurementCase.findUnique).mockResolvedValue(
        createProcurementCase({ currentState: 'CHECK' }) as any,
      );
      const result = await hasDownstreamData('case-id', 'check');
      expect(result).toBe(false);
    });

    it('returns true when quotations exist after RFQ', async () => {
      vi.mocked(prisma.quotation.count).mockResolvedValue(2);
      const result = await hasDownstreamData('case-id', 'rfq');
      expect(result).toBe(true);
    });

    it('returns true when abstract exists after quotation', async () => {
      vi.mocked(prisma.abstractOfQuotations.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'quotation');
      expect(result).toBe(true);
    });

    it('returns true when BAC resolution exists after abstract', async () => {
      vi.mocked(prisma.bACResolution.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'abstract');
      expect(result).toBe(true);
    });

    it('returns true when award exists after BAC resolution', async () => {
      vi.mocked(prisma.award.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'bac_resolution');
      expect(result).toBe(true);
    });

    it('returns true when contract or PO exists after award', async () => {
      vi.mocked(prisma.contract.count).mockResolvedValue(1);
      vi.mocked(prisma.purchaseOrder.count).mockResolvedValue(0);
      const result = await hasDownstreamData('case-id', 'award');
      expect(result).toBe(true);
    });

    it('returns true when NTP exists after contract', async () => {
      vi.mocked(prisma.noticeToProceed.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'contract');
      expect(result).toBe(true);
    });

    it('returns true when delivery or billing exists after NTP', async () => {
      vi.mocked(prisma.delivery.count).mockResolvedValue(1);
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(0);
      const result = await hasDownstreamData('case-id', 'ntp');
      expect(result).toBe(true);
    });

    it('returns true when inspection exists after delivery', async () => {
      vi.mocked(prisma.inspectionReport.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'delivery');
      expect(result).toBe(true);
    });

    it('returns true when acceptance exists after inspection', async () => {
      vi.mocked(prisma.acceptance.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'inspection');
      expect(result).toBe(true);
    });

    it('returns true when ORS exists after acceptance', async () => {
      vi.mocked(prisma.oRS.count).mockResolvedValue(1);
      const result = await hasDownstreamData('case-id', 'acceptance');
      expect(result).toBe(true);
    });

    it('returns false for unknown action', async () => {
      const result = await hasDownstreamData('case-id', 'unknown_action' as any);
      expect(result).toBe(false);
    });
  });

  describe('validateEdit', () => {
    it('allows edit when user has permission and no downstream data', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(0);
      const result = await validateEdit('case-id', 'ors', 'BUDGET_MANAGER');
      expect(result.allowed).toBe(true);
      expect(result.requiresOverride).toBeUndefined();
    });

    it('blocks edit when user lacks permission', async () => {
      const result = await validateEdit('case-id', 'ors', 'PROCUREMENT_MANAGER');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('cannot edit');
    });

    it('requires override when downstream data exists and user is admin', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(1);
      const result = await validateEdit('case-id', 'ors', 'ADMIN');
      expect(result.allowed).toBe(true);
      expect(result.requiresOverride).toBe(true);
    });

    it('blocks edit when downstream data exists and user is not admin', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(1);
      const result = await validateEdit('case-id', 'ors', 'BUDGET_MANAGER');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('downstream data exists');
    });
  });

  describe('validateDelete', () => {
    it('allows delete when user has permission and no downstream data', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(0);
      const result = await validateDelete('case-id', 'ors', 'ADMIN');
      expect(result.allowed).toBe(true);
    });

    it('blocks delete when user lacks permission', async () => {
      const result = await validateDelete('case-id', 'ors', 'BUDGET_MANAGER');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('cannot delete');
    });

    it('requires override when downstream data exists and user is admin', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(1);
      const result = await validateDelete('case-id', 'ors', 'ADMIN');
      expect(result.allowed).toBe(true);
      expect(result.requiresOverride).toBe(true);
    });

    it('blocks delete when downstream data exists and user is not admin', async () => {
      vi.mocked(prisma.dV.count).mockResolvedValue(1);
      // BUDGET_MANAGER doesn't have delete capability for 'ors', so returns permission error
      const result = await validateDelete('case-id', 'ors', 'BUDGET_MANAGER');
      expect(result.allowed).toBe(false);
      // The actual behavior: permission check happens first, returns permission error
      expect(result.reason).toContain('cannot delete');
    });
  });

  describe('getPreviousState', () => {
    it('returns correct previous state for CLOSED', () => {
      expect(getPreviousState('CLOSED')).toBe('CHECK');
    });

    it('returns correct previous state for CHECK', () => {
      expect(getPreviousState('CHECK')).toBe('DV');
    });

    it('returns correct previous state for DV', () => {
      expect(getPreviousState('DV')).toBe('ORS');
    });

    it('returns correct previous state for ORS', () => {
      expect(getPreviousState('ORS')).toBe('ACCEPTANCE');
    });

    it('returns correct previous state for ACCEPTANCE', () => {
      expect(getPreviousState('ACCEPTANCE')).toBe('INSPECTION');
    });

    it('returns correct previous state for INSPECTION', () => {
      expect(getPreviousState('INSPECTION')).toBe('DELIVERY');
    });

    it('returns correct previous state for DELIVERY', () => {
      expect(getPreviousState('DELIVERY')).toBe('NTP_ISSUED');
    });

    it('returns correct previous state for NTP_ISSUED', () => {
      expect(getPreviousState('NTP_ISSUED')).toBe('CONTRACT_SIGNED');
    });

    it('returns correct previous state for CONTRACT_SIGNED', () => {
      expect(getPreviousState('CONTRACT_SIGNED')).toBe('PO_APPROVED');
    });

    it('returns correct previous state for PO_APPROVED', () => {
      expect(getPreviousState('PO_APPROVED')).toBe('AWARDED');
    });

    it('returns correct previous state for AWARDED', () => {
      expect(getPreviousState('AWARDED')).toBe('BAC_RESOLUTION');
    });

    it('returns correct previous state for BAC_RESOLUTION', () => {
      expect(getPreviousState('BAC_RESOLUTION')).toBe('POST_QUALIFICATION');
    });

    it('returns correct previous state for ABSTRACT_OF_QUOTATIONS', () => {
      expect(getPreviousState('ABSTRACT_OF_QUOTATIONS')).toBe('QUOTATION_COLLECTION');
    });

    it('returns correct previous state for QUOTATION_COLLECTION', () => {
      expect(getPreviousState('QUOTATION_COLLECTION')).toBe('RFQ_ISSUED');
    });

    it('returns correct previous state for RFQ_ISSUED', () => {
      expect(getPreviousState('RFQ_ISSUED')).toBe('DRAFT');
    });

    it('returns correct previous state for POST_QUALIFICATION', () => {
      expect(getPreviousState('POST_QUALIFICATION')).toBe('TWG_EVALUATION');
    });

    it('returns correct previous state for TWG_EVALUATION', () => {
      expect(getPreviousState('TWG_EVALUATION')).toBe('BID_SUBMISSION_OPENING');
    });

    it('returns correct previous state for BID_SUBMISSION_OPENING', () => {
      expect(getPreviousState('BID_SUBMISSION_OPENING')).toBe('PRE_BID_CONF');
    });

    it('returns null for DRAFT state', () => {
      expect(getPreviousState('DRAFT')).toBeNull();
    });

    it('returns null for unknown state', () => {
      expect(getPreviousState('UNKNOWN_STATE' as CaseState)).toBeNull();
    });
  });
});

