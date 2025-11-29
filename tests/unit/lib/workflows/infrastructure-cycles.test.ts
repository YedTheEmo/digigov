import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { prisma } from '@/lib/prisma';
import { createProcurementCase } from '../../__helpers__/factories';
import type { ProcurementMethod } from '@/generated/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    noticeToProceed: { findUnique: vi.fn() },
    progressBilling: { count: vi.fn(), findMany: vi.fn() },
    pMTInspectionReport: { findMany: vi.fn() },
    acceptance: { findUnique: vi.fn() },
  },
}));

describe('Infrastructure Cyclic Workflow Tests', () => {
  const method: ProcurementMethod = 'INFRASTRUCTURE';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Progress Billing Cycles', () => {
    it('allows transition from NTP_ISSUED to PROGRESS_BILLING (first billing)', async () => {
      const case_ = createProcurementCase({ method, currentState: 'NTP_ISSUED' });
      vi.mocked(prisma.noticeToProceed.findUnique).mockResolvedValue({ id: 'ntp-1' } as any);
      
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).resolves.toBe(true);
    });

    it('allows transition from PMT_INSPECTION to PROGRESS_BILLING (subsequent billing cycle)', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PMT_INSPECTION' });
      
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).resolves.toBe(true);
    });

    it('allows transition from PROGRESS_BILLING to PMT_INSPECTION', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PROGRESS_BILLING' });
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(1);
      
      await expect(assertCanTransition(case_, 'PMT_INSPECTION')).resolves.toBe(true);
    });

    it('blocks transition to PMT_INSPECTION without any progress billing', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PROGRESS_BILLING' });
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(0);
      
      await expect(assertCanTransition(case_, 'PMT_INSPECTION')).rejects.toThrow(
        'Progress Billing required'
      );
    });

    it('allows multiple billing cycles (3 cycles simulation)', async () => {
      const case_ = createProcurementCase({ method, currentState: 'NTP_ISSUED' });
      
      // First cycle: NTP → PROGRESS_BILLING
      vi.mocked(prisma.noticeToProceed.findUnique).mockResolvedValue({ id: 'ntp-1' } as any);
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).resolves.toBe(true);
      
      // First cycle: PROGRESS_BILLING → PMT_INSPECTION
      case_.currentState = 'PROGRESS_BILLING';
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(1);
      await expect(assertCanTransition(case_, 'PMT_INSPECTION')).resolves.toBe(true);
      
      // Second cycle: PMT_INSPECTION → PROGRESS_BILLING
      case_.currentState = 'PMT_INSPECTION';
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).resolves.toBe(true);
      
      // Second cycle: PROGRESS_BILLING → PMT_INSPECTION
      case_.currentState = 'PROGRESS_BILLING';
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(2);
      await expect(assertCanTransition(case_, 'PMT_INSPECTION')).resolves.toBe(true);
      
      // Third cycle: PMT_INSPECTION → PROGRESS_BILLING
      case_.currentState = 'PMT_INSPECTION';
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).resolves.toBe(true);
    });
  });

  describe('PMT Inspection Cycles', () => {
    it('allows PMT_INSPECTION after first progress billing', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PROGRESS_BILLING' });
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(1);
      
      await expect(assertCanTransition(case_, 'PMT_INSPECTION')).resolves.toBe(true);
    });

    it('allows PMT_INSPECTION after subsequent progress billings', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PROGRESS_BILLING' });
      vi.mocked(prisma.progressBilling.count).mockResolvedValue(5);
      
      await expect(assertCanTransition(case_, 'PMT_INSPECTION')).resolves.toBe(true);
    });
  });

  describe('Project Completion Path', () => {
    it('allows transition from PMT_INSPECTION to ACCEPTANCE (project completion)', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PMT_INSPECTION' });
      
      // Mock a PASSED PMT inspection for ACCEPTANCE validation
      vi.mocked(prisma.pMTInspectionReport.findMany).mockResolvedValue([
        { id: 'pmt-1', status: 'PASSED', inspectedAt: new Date() } as any,
      ]);
      
      await expect(assertCanTransition(case_, 'ACCEPTANCE')).resolves.toBe(true);
    });

    it('allows transition from ACCEPTANCE to ORS with PASSED PMT inspection', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ACCEPTANCE' });
      vi.mocked(prisma.pMTInspectionReport.findMany).mockResolvedValue([
        { id: 'pmt-1', status: 'PASSED', inspectedAt: new Date() } as any,
      ]);
      vi.mocked(prisma.acceptance.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      
      await expect(assertCanTransition(case_, 'ORS')).resolves.toBe(true);
    });

    it('blocks transition from ACCEPTANCE to ORS without PASSED PMT inspection', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ACCEPTANCE' });
      vi.mocked(prisma.pMTInspectionReport.findMany).mockResolvedValue([
        { id: 'pmt-1', status: 'FAILED', inspectedAt: new Date() } as any,
      ]);
      vi.mocked(prisma.acceptance.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      
      await expect(assertCanTransition(case_, 'ORS')).rejects.toThrow(/PMT.*Inspection.*PASSED/i);
    });

    it('blocks transition from ACCEPTANCE to ORS without any PMT inspection', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ACCEPTANCE' });
      vi.mocked(prisma.pMTInspectionReport.findMany).mockResolvedValue([]);
      vi.mocked(prisma.acceptance.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      
      await expect(assertCanTransition(case_, 'ORS')).rejects.toThrow(/PMT.*Inspection.*PASSED/i);
    });
  });

  describe('PMT Inspection Status Validation', () => {
    it('validates latest PMT inspection for ORS transition', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ACCEPTANCE' });
      
      // Multiple inspections, latest is PASSED
      vi.mocked(prisma.pMTInspectionReport.findMany).mockResolvedValue([
        { id: 'pmt-latest', status: 'PASSED', inspectedAt: new Date('2024-01-03') } as any,
      ]);
      vi.mocked(prisma.acceptance.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      
      await expect(assertCanTransition(case_, 'ORS')).resolves.toBe(true);
    });

    it('blocks ORS transition if latest PMT inspection is FAILED', async () => {
      const case_ = createProcurementCase({ method, currentState: 'ACCEPTANCE' });
      
      // Latest inspection is FAILED
      vi.mocked(prisma.pMTInspectionReport.findMany).mockResolvedValue([
        { id: 'pmt-latest', status: 'FAILED', inspectedAt: new Date('2024-01-03') } as any,
      ]);
      vi.mocked(prisma.acceptance.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      
      await expect(assertCanTransition(case_, 'ORS')).rejects.toThrow(/PMT.*Inspection.*PASSED/i);
    });
  });

  describe('Infrastructure Prerequisites', () => {
    it('blocks first PROGRESS_BILLING without NTP', async () => {
      const case_ = createProcurementCase({ method, currentState: 'NTP_ISSUED' });
      vi.mocked(prisma.noticeToProceed.findUnique).mockResolvedValue(null);
      
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).rejects.toThrow(
        'NTP required before Progress Billing'
      );
    });

    it('allows subsequent PROGRESS_BILLING from PMT_INSPECTION without checking NTP again', async () => {
      const case_ = createProcurementCase({ method, currentState: 'PMT_INSPECTION' });
      
      // No NTP check needed when coming from PMT_INSPECTION
      await expect(assertCanTransition(case_, 'PROGRESS_BILLING')).resolves.toBe(true);
    });
  });
});
