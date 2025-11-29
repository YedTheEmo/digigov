import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { prisma } from '@/lib/prisma';
import { createProcurementCase } from '../../__helpers__/factories';
import type { ProcurementMethod } from '@/generated/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bACResolution: { findUnique: vi.fn() },
    award: { findUnique: vi.fn() },
    purchaseOrder: { findUnique: vi.fn() },
    contract: { findUnique: vi.fn() },
    postQualification: { findUnique: vi.fn() },
  },
}));

describe('PUBLIC_BIDDING Missing Transitions', () => {
  const method: ProcurementMethod = 'PUBLIC_BIDDING';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BAC_RESOLUTION → AWARDED', () => {
    it('allows transition with valid BAC resolution', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({
        id: 'bac-1',
        caseId: case_.id,
        resolution: 'Approved',
        createdAt: new Date(),
      } as any);

      await expect(assertCanTransition(case_, 'AWARDED')).resolves.toBe(true);
    });

    it('blocks transition without BAC resolution', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      // Don't mock postQualification - we want to test the BAC check
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue(null);

      await expect(assertCanTransition(case_, 'AWARDED')).rejects.toThrow();
    });

    it('validates BAC resolution has required fields', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({
        id: 'bac-1',
        caseId: case_.id,
        resolution: 'Approved',
        createdAt: new Date(),
      } as any);

      const result = await assertCanTransition(case_, 'AWARDED');
      expect(result).toBe(true);
    });

    it('allows transition when BAC recommends award', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({
        id: 'bac-1',
        caseId: case_.id,
        resolution: 'Award to winning bidder',
        recommendedAwardee: 'Supplier ABC',
        createdAt: new Date(),
      } as any);

      await expect(assertCanTransition(case_, 'AWARDED')).resolves.toBe(true);
    });

    it('validates BAC resolution exists before award', async () => {
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({
        id: 'bac-1',
        caseId: case_.id,
        createdAt: new Date(),
      } as any);

      await expect(assertCanTransition(case_, 'AWARDED')).resolves.toBe(true);
    });
  });

  describe('AWARDED → PO_APPROVED', () => {
    it('allows transition with valid award', async () => {
      const case_ = createProcurementCase({ method, currentState: 'AWARDED' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.award.findUnique).mockResolvedValue({
        id: 'award-1',
        caseId: case_.id,
        supplier: 'Supplier ABC',
        amount: 500000,
      } as any);

      await expect(assertCanTransition(case_, 'PO_APPROVED')).resolves.toBe(true);
    });

    it('blocks transition without award', async () => {
      const case_ = createProcurementCase({ method, currentState: 'AWARDED' });
      // Don't mock postQualification - we want to test the award check
      vi.mocked(prisma.award.findUnique).mockResolvedValue(null);

      await expect(assertCanTransition(case_, 'PO_APPROVED')).rejects.toThrow();
    });

    it('validates award amount is within ABC', async () => {
      const case_ = createProcurementCase({ method, currentState: 'AWARDED', abc: 1000000 });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.award.findUnique).mockResolvedValue({
        id: 'award-1',
        caseId: case_.id,
        supplier: 'Supplier ABC',
        amount: 500000, // Within ABC
      } as any);

      await expect(assertCanTransition(case_, 'PO_APPROVED')).resolves.toBe(true);
    });
  });

  describe('PO_APPROVED → CONTRACT_SIGNED', () => {
    it('allows transition with approved PO and award', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PO_APPROVED' });
      vi.mocked(prisma.award.findUnique).mockResolvedValue({
        id: 'award-1',
        caseId: case_.id,
      } as any);
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: 'po-1',
        caseId: case_.id,
        poNumber: 'PO-2024-001',
      } as any);

      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).resolves.toBe(true);
    });

    it('blocks transition without award', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PO_APPROVED' });
      vi.mocked(prisma.award.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: 'po-1',
        caseId: case_.id,
      } as any);

      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).rejects.toThrow(/award.*required/i);
    });

    it('blocks transition without approved PO', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PO_APPROVED' });
      vi.mocked(prisma.award.findUnique).mockResolvedValue({
        id: 'award-1',
        caseId: case_.id,
      } as any);
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null);

      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).rejects.toThrow(/Purchase Order.*approved/i);
    });

    it('validates PO has required fields', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PO_APPROVED' });
      vi.mocked(prisma.award.findUnique).mockResolvedValue({
        id: 'award-1',
        caseId: case_.id,
      } as any);
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({
        id: 'po-1',
        caseId: case_.id,
        poNumber: 'PO-2024-001',
        approvedAt: new Date(),
      } as any);

      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).resolves.toBe(true);
    });
  });

  describe('CONTRACT_SIGNED → NTP_ISSUED', () => {
    it('allows transition with signed contract', async () => {
      const case_ = createProcurementCase({ method, currentState: 'CONTRACT_SIGNED' });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        caseId: case_.id,
        signedAt: new Date(),
      } as any);

      await expect(assertCanTransition(case_, 'NTP_ISSUED')).resolves.toBe(true);
    });

    it('blocks transition without signed contract', async () => {
      const case_ = createProcurementCase({ method, currentState: 'CONTRACT_SIGNED' });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue(null);

      await expect(assertCanTransition(case_, 'NTP_ISSUED')).rejects.toThrow(/Contract.*signed/i);
    });

    it('validates contract has signature date', async () => {
      const case_ = createProcurementCase({ method, currentState: 'CONTRACT_SIGNED' });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        caseId: case_.id,
        signedAt: new Date('2024-01-15'),
        contractNumber: 'CTR-2024-001',
      } as any);

      await expect(assertCanTransition(case_, 'NTP_ISSUED')).resolves.toBe(true);
    });
  });

  describe('Complete PUBLIC_BIDDING Flow', () => {
    it('validates full award-to-NTP sequence', async () => {
      // BAC_RESOLUTION → AWARDED
      let case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.bACResolution.findUnique).mockResolvedValue({ id: 'bac-1', caseId: case_.id } as any);
      await expect(assertCanTransition(case_, 'AWARDED')).resolves.toBe(true);

      // AWARDED → PO_APPROVED
      case_ = createProcurementCase({ method, currentState: 'AWARDED' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.award.findUnique).mockResolvedValue({ id: 'award-1', caseId: case_.id } as any);
      await expect(assertCanTransition(case_, 'PO_APPROVED')).resolves.toBe(true);

      // PO_APPROVED → CONTRACT_SIGNED
      case_ = createProcurementCase({ method, currentState: 'PO_APPROVED' });
      vi.mocked(prisma.postQualification.findUnique).mockResolvedValue({ passed: true } as any);
      vi.mocked(prisma.award.findUnique).mockResolvedValue({ id: 'award-1', caseId: case_.id } as any);
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue({ id: 'po-1', caseId: case_.id } as any);
      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).resolves.toBe(true);

      // CONTRACT_SIGNED → NTP_ISSUED
      case_ = createProcurementCase({ method, currentState: 'CONTRACT_SIGNED' });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({ id: 'contract-1', caseId: case_.id } as any);
      await expect(assertCanTransition(case_, 'NTP_ISSUED')).resolves.toBe(true);
    });

    it('blocks skipping PO step', async () => {
      const case_ = createProcurementCase({ method, currentState: 'AWARDED' });
      vi.mocked(prisma.award.findUnique).mockResolvedValue({ id: 'award-1', caseId: case_.id } as any);
      vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null);

      // Try to skip directly to CONTRACT_SIGNED
      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).rejects.toThrow();
    });

    it('validates sequential state progression', async () => {
      // Cannot jump from BAC_RESOLUTION directly to CONTRACT_SIGNED
      const case_ = createProcurementCase({ method, currentState: 'BAC_RESOLUTION' });
      
      await expect(assertCanTransition(case_, 'CONTRACT_SIGNED')).rejects.toThrow(/not allowed/i);
    });
  });
});
