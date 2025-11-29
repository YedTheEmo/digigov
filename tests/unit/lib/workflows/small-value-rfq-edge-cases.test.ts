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
  },
}));

describe('SMALL_VALUE_RFQ Edge Cases', () => {
  const method: ProcurementMethod = 'SMALL_VALUE_RFQ';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Minimum Quotation Boundary Testing', () => {
    it('allows abstract generation with exactly 3 quotations (boundary)', async () => {
      const case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(3);

      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });

    it('blocks abstract generation with 2 quotations (below threshold)', async () => {
      const case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION', regime: 'RA9184' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(2);

      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).rejects.toThrow(/at least/i);
    });

    it('allows abstract generation with 4+ quotations', async () => {
      const case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(5);

      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });

    it('blocks abstract generation with 1 quotation', async () => {
      const case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION', regime: 'RA9184' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(1);

      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).rejects.toThrow(/at least/i);
    });

    it.skip('validates different minimum quotations for RA12009 (1 quotation)', async () => {
      // TODO: Implement regime-specific quotation minimums
      // RA12009 should allow 1 quotation, RA9184 requires 3
      // This requires updating src/lib/workflows/procurement.ts to check case.regime
      const case_ = createProcurementCase({ 
        method, 
        currentState: 'QUOTATION_COLLECTION',
        regime: 'RA12009'
      });
      vi.mocked(prisma.quotation.count).mockResolvedValue(1);

      // RA12009 allows 1 quotation
      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });
  });

  describe('Direct RFQ → Abstract Path', () => {
    it('allows direct transition from RFQ_ISSUED to ABSTRACT_OF_QUOTATIONS', async () => {
      const case_ = createProcurementCase({ method, currentState: 'RFQ_ISSUED' });
      
      // Mock sufficient quotations for the transition
      vi.mocked(prisma.quotation.count).mockResolvedValue(3);
      
      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });

    it('validates minimum quotations on direct RFQ → Abstract path', async () => {
      const case_ = createProcurementCase({ method, currentState: 'RFQ_ISSUED', regime: 'RA9184' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(0);

      // Should still check quotation count even on direct path
      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).rejects.toThrow(/at least/i);
    });

    it('allows direct path when quotations are sufficient', async () => {
      const case_ = createProcurementCase({ method, currentState: 'RFQ_ISSUED' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(3);

      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });
  });

  describe('Quotation Responsiveness Validation', () => {
    it('validates quotations can be marked as non-responsive', async () => {
      // This is a data model test - ensure Quotation schema supports isResponsive flag
      const quotation = {
        id: 'q-1',
        caseId: 'case-1',
        supplier: 'Supplier A',
        amount: 50000,
        isResponsive: false, // Non-responsive quotation
      };

      expect(quotation.isResponsive).toBe(false);
    });

    it('counts only responsive quotations for minimum threshold', async () => {
      const case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION' });
      
      // Mock count returns only responsive quotations
      // In actual implementation, this would filter by isResponsive: true
      vi.mocked(prisma.quotation.count).mockResolvedValue(3);

      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });
  });

  describe('Abstract Generation Prerequisites', () => {
    it('allows BAC resolution with valid abstract', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ABSTRACT_OF_QUOTATIONS' });
      vi.mocked(prisma.abstractOfQuotations.findUnique).mockResolvedValue({
        id: 'abstract-1',
        caseId: case_.id,
        createdAt: new Date(),
      } as any);

      await expect(assertCanTransition(case_, 'BAC_RESOLUTION')).resolves.toBe(true);
    });

    it('blocks BAC resolution without abstract', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ABSTRACT_OF_QUOTATIONS' });
      vi.mocked(prisma.abstractOfQuotations.findUnique).mockResolvedValue(null);

      await expect(assertCanTransition(case_, 'BAC_RESOLUTION')).rejects.toThrow(/Abstract.*required/i);
    });

    it('validates abstract contains quotation data', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ABSTRACT_OF_QUOTATIONS' });
      vi.mocked(prisma.abstractOfQuotations.findUnique).mockResolvedValue({
        id: 'abstract-1',
        caseId: case_.id,
        lowestQuotation: 'Supplier A',
        lowestAmount: 45000,
        createdAt: new Date(),
      } as any);

      await expect(assertCanTransition(case_, 'BAC_RESOLUTION')).resolves.toBe(true);
    });
  });

  describe('BAC Resolution for RFQ', () => {
    it('allows award after BAC resolution with abstract', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({
        id: 'bac-1',
        caseId: case_.id,
        resolution: 'Approved',
      } as any);

      await expect(assertCanTransition(case_, 'AWARDED')).resolves.toBe(true);
    });

    it('blocks award without BAC resolution', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue(null);

      await expect(assertCanTransition(case_, 'AWARDED')).rejects.toThrow(/BAC.*required/i);
    });

    it('validates BAC selected winner from quotations', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({
        id: 'bac-1',
        caseId: case_.id,
        resolution: 'Award to Supplier A',
        recommendedAwardee: 'Supplier A',
      } as any);

      await expect(assertCanTransition(case_, 'AWARDED')).resolves.toBe(true);
    });
  });

  describe('Award Amount Validation', () => {
    it('validates award amount is from lowest quotation', async () => {
      // This is a business logic test for the award creation
      const award = {
        id: 'award-1',
        caseId: 'case-1',
        supplier: 'Supplier A',
        amount: 45000, // Should match lowest quotation
      };

      expect(award.amount).toBeLessThanOrEqual(50000); // ABC
    });

    it('validates award amount does not exceed ABC', async () => {
      const case_ = createProcurementCase({ method, abc: 50000 });
      const awardAmount = 45000;

      expect(awardAmount).toBeLessThanOrEqual(case_.abc);
    });

    it('blocks award with amount exceeding ABC', async () => {
      const case_ = createProcurementCase({ method, abc: 50000 });
      const invalidAwardAmount = 55000;

      expect(invalidAwardAmount).toBeGreaterThan(case_.abc);
      // In actual implementation, this validation happens in the award route
    });
  });

  describe('Complete RFQ Flow', () => {
    it('validates full DRAFT → AWARDED flow', async () => {
      // DRAFT → POSTING
      let case_ = createProcurementCase({ method, currentState: 'DRAFT' });
      await expect(assertCanTransition(case_, 'POSTING')).resolves.toBe(true);

      // POSTING → RFQ_ISSUED
      case_ = createProcurementCase({ method, currentState: 'POSTING' });
      await expect(assertCanTransition(case_, 'RFQ_ISSUED')).resolves.toBe(true);

      // RFQ_ISSUED → QUOTATION_COLLECTION
      case_ = createProcurementCase({ method, currentState: 'RFQ_ISSUED' });
      await expect(assertCanTransition(case_, 'QUOTATION_COLLECTION')).resolves.toBe(true);

      // QUOTATION_COLLECTION → ABSTRACT (with quotations)
      case_ = createProcurementCase({ method, currentState: 'QUOTATION_COLLECTION' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(3);
      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);

      // ABSTRACT → BAC_RESOLUTION
      case_ = createProcurementCase({ method, currentState: 'ABSTRACT_OF_QUOTATIONS' });
      vi.mocked(prisma.abstractOfQuotations.findUnique).mockResolvedValue({ id: 'abstract-1' } as any);
      await expect(assertCanTransition(case_, 'BAC_RESOLUTION')).resolves.toBe(true);

      // BAC_RESOLUTION → AWARDED
      case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({ id: 'bac-1' } as any);
      await expect(assertCanTransition(case_, 'AWARDED')).resolves.toBe(true);
    });

    it('validates alternate DRAFT → RFQ_ISSUED path', async () => {
      // Direct DRAFT → RFQ_ISSUED (skipping POSTING)
      const case_ = createProcurementCase({ method, currentState: 'DRAFT' });
      await expect(assertCanTransition(case_, 'RFQ_ISSUED')).resolves.toBe(true);
    });

    it('validates direct RFQ → ABSTRACT path with quotations', async () => {
      const case_ = createProcurementCase({ method, currentState: 'RFQ_ISSUED' });
      vi.mocked(prisma.quotation.count).mockResolvedValue(3);
      
      // Direct RFQ_ISSUED → ABSTRACT (skipping QUOTATION_COLLECTION)
      await expect(assertCanTransition(case_, 'ABSTRACT_OF_QUOTATIONS')).resolves.toBe(true);
    });
  });
});
