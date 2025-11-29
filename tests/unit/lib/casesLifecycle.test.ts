import { describe, it, expect } from 'vitest';
import {
  getLifecycleSummary,
  getCurrentOwner,
  getNextStepMessage,
  getStateVariant,
} from '@/lib/casesLifecycle';
import { createProcurementCase } from '../__helpers__/factories';

describe('casesLifecycle', () => {
  describe('getLifecycleSummary', () => {
    it('returns correct summary for SMALL_VALUE_RFQ case in DRAFT', () => {
      const case_ = createProcurementCase({
        method: 'SMALL_VALUE_RFQ',
        currentState: 'DRAFT',
        postingStartAt: null,
      }) as any;

      const summary = getLifecycleSummary({
        ...case_,
        rfq: null,
        quotations: [],
        abstract: null,
        bacResolution: null,
        award: null,
        purchaseOrder: null,
        contract: null,
        ntp: null,
        deliveries: [],
        inspection: null,
        acceptance: null,
        ors: null,
        dv: null,
        check: null,
        checkAdvice: null,
        bidBulletins: [],
        preBid: null,
        bids: [],
        twgEvaluation: null,
        postQualification: null,
        progressBilling: null,
        pmtInspection: null,
        activityLogs: [],
      });

      expect(summary.stages.length).toBeGreaterThan(0);
      expect(summary.currentStageIndex).toBe(0);
      expect(summary.currentModule).toBe('Procurement');
    });

    it('marks POSTING as completed when postingStartAt is set', () => {
      const case_ = createProcurementCase({
        method: 'SMALL_VALUE_RFQ',
        currentState: 'RFQ_ISSUED',
        postingStartAt: new Date(),
      }) as any;

      const summary = getLifecycleSummary({
        ...case_,
        rfq: { issuedAt: new Date() },
        quotations: [],
        abstract: null,
        bacResolution: null,
        award: null,
        purchaseOrder: null,
        contract: null,
        ntp: null,
        deliveries: [],
        inspection: null,
        acceptance: null,
        ors: null,
        dv: null,
        check: null,
        checkAdvice: null,
        bidBulletins: [],
        preBid: null,
        bids: [],
        twgEvaluation: null,
        postQualification: null,
        progressBilling: null,
        pmtInspection: null,
        activityLogs: [],
      });

      const postingStage = summary.stages.find((s) => s.id === 'POSTING');
      expect(postingStage?.completed).toBe(true);
    });

    it('marks RFQ_ISSUED as completed when rfq exists', () => {
      const case_ = createProcurementCase({
        method: 'SMALL_VALUE_RFQ',
        currentState: 'QUOTATION_COLLECTION',
      }) as any;

      const summary = getLifecycleSummary({
        ...case_,
        rfq: { issuedAt: new Date() },
        quotations: [],
        abstract: null,
        bacResolution: null,
        award: null,
        purchaseOrder: null,
        contract: null,
        ntp: null,
        deliveries: [],
        inspection: null,
        acceptance: null,
        ors: null,
        dv: null,
        check: null,
        checkAdvice: null,
        bidBulletins: [],
        preBid: null,
        bids: [],
        twgEvaluation: null,
        postQualification: null,
        progressBilling: null,
        pmtInspection: null,
        activityLogs: [],
      });

      const rfqStage = summary.stages.find((s) => s.id === 'RFQ_ISSUED');
      expect(rfqStage?.completed).toBe(true);
    });

    it('marks QUOTATION_COLLECTION as completed when quotations exist', () => {
      const case_ = createProcurementCase({
        method: 'SMALL_VALUE_RFQ',
        currentState: 'ABSTRACT_OF_QUOTATIONS',
      }) as any;

      const summary = getLifecycleSummary({
        ...case_,
        rfq: { issuedAt: new Date() },
        quotations: [{ submittedAt: new Date() }],
        abstract: null,
        bacResolution: null,
        award: null,
        purchaseOrder: null,
        contract: null,
        ntp: null,
        deliveries: [],
        inspection: null,
        acceptance: null,
        ors: null,
        dv: null,
        check: null,
        checkAdvice: null,
        bidBulletins: [],
        preBid: null,
        bids: [],
        twgEvaluation: null,
        postQualification: null,
        progressBilling: null,
        pmtInspection: null,
        activityLogs: [],
      });

      const quotationStage = summary.stages.find((s) => s.id === 'QUOTATION_COLLECTION');
      expect(quotationStage?.completed).toBe(true);
    });

    it('returns correct summary for PUBLIC_BIDDING case', () => {
      const case_ = createProcurementCase({
        method: 'PUBLIC_BIDDING',
        currentState: 'POSTING',
      }) as any;

      const summary = getLifecycleSummary({
        ...case_,
        rfq: null,
        quotations: [],
        abstract: null,
        bacResolution: null,
        award: null,
        purchaseOrder: null,
        contract: null,
        ntp: null,
        deliveries: [],
        inspection: null,
        acceptance: null,
        ors: null,
        dv: null,
        check: null,
        checkAdvice: null,
        bidBulletins: [],
        preBid: null,
        bids: [],
        twgEvaluation: null,
        postQualification: null,
        progressBilling: null,
        pmtInspection: null,
        activityLogs: [],
      });

      expect(summary.stages.some((s) => s.id === 'BID_BULLETIN')).toBe(true);
      expect(summary.currentModule).toBe('Procurement');
    });

    it('returns correct summary for INFRASTRUCTURE case', () => {
      const case_ = createProcurementCase({
        method: 'INFRASTRUCTURE',
        currentState: 'NTP_ISSUED',
      }) as any;

      const summary = getLifecycleSummary({
        ...case_,
        rfq: null,
        quotations: [],
        abstract: null,
        bacResolution: null,
        award: null,
        purchaseOrder: null,
        contract: null,
        ntp: { issuedAt: new Date() },
        deliveries: [],
        inspection: null,
        acceptance: null,
        ors: null,
        dv: null,
        check: null,
        checkAdvice: null,
        bidBulletins: [],
        preBid: null,
        bids: [],
        twgEvaluation: null,
        postQualification: null,
        progressBilling: null,
        pmtInspection: null,
        activityLogs: [],
      });

      expect(summary.stages.some((s) => s.id === 'PROGRESS_BILLING')).toBe(true);
      expect(summary.stages.some((s) => s.id === 'PMT_INSPECTION')).toBe(true);
    });
  });

  describe('getCurrentOwner', () => {
    it('returns Procurement module for procurement states', () => {
      const procurementStates: CaseState[] = [
        'DRAFT',
        'POSTING',
        'RFQ_ISSUED',
        'QUOTATION_COLLECTION',
        'ABSTRACT_OF_QUOTATIONS',
        'BAC_RESOLUTION',
        'AWARDED',
        'PO_APPROVED',
        'CONTRACT_SIGNED',
        'NTP_ISSUED',
      ];

      procurementStates.forEach((state) => {
        const owner = getCurrentOwner(state);
        expect(owner?.module).toBe('Procurement');
      });
    });

    it('returns Supply module for supply states', () => {
      expect(getCurrentOwner('DELIVERY')?.module).toBe('Supply');
      expect(getCurrentOwner('INSPECTION')?.module).toBe('Supply');
      expect(getCurrentOwner('ACCEPTANCE')?.module).toBe('Supply');
    });

    it('returns Budget module for ORS state', () => {
      expect(getCurrentOwner('ORS')?.module).toBe('Budget');
    });

    it('returns Accounting module for DV state', () => {
      expect(getCurrentOwner('DV')?.module).toBe('Accounting');
    });

    it('returns Cashier module for CHECK and CLOSED states', () => {
      expect(getCurrentOwner('CHECK')?.module).toBe('Cashier');
      expect(getCurrentOwner('CLOSED')?.module).toBe('Cashier');
    });
  });

  describe('getNextStepMessage', () => {
    it('returns message for DRAFT state', () => {
      const message = getNextStepMessage('DRAFT');
      expect(message).toContain('posting period');
    });

    it('returns message for POSTING state', () => {
      const message = getNextStepMessage('POSTING');
      expect(message).toContain('pre-award');
    });

    it('returns message for NTP_ISSUED state', () => {
      const message = getNextStepMessage('NTP_ISSUED');
      expect(message).toContain('Supply');
    });

    it('returns message for ACCEPTANCE state', () => {
      const message = getNextStepMessage('ACCEPTANCE');
      expect(message).toContain('ORS');
    });

    it('returns message for ORS state', () => {
      const message = getNextStepMessage('ORS');
      expect(message).toContain('DV');
    });

    it('returns message for DV state', () => {
      const message = getNextStepMessage('DV');
      expect(message).toContain('Cashier');
    });

    it('returns message for CHECK state', () => {
      const message = getNextStepMessage('CHECK');
      expect(message).toContain('check advice');
    });

    it('returns message for CLOSED state', () => {
      const message = getNextStepMessage('CLOSED');
      expect(message).toContain('fully closed');
    });

    it('returns null for unknown state', () => {
      const message = getNextStepMessage('UNKNOWN_STATE' as CaseState);
      expect(message).toBeNull();
    });
  });

  describe('getStateVariant', () => {
    it('returns "completed" for CLOSED state', () => {
      expect(getStateVariant('CLOSED')).toBe('completed');
    });

    it('returns "pending" for DRAFT and POSTING states', () => {
      expect(getStateVariant('DRAFT')).toBe('pending');
      expect(getStateVariant('POSTING')).toBe('pending');
    });

    it('returns "warning" for ORS, DV, and CHECK states', () => {
      expect(getStateVariant('ORS')).toBe('warning');
      expect(getStateVariant('DV')).toBe('warning');
      expect(getStateVariant('CHECK')).toBe('warning');
    });

    it('returns "info" for other states', () => {
      expect(getStateVariant('RFQ_ISSUED')).toBe('info');
      expect(getStateVariant('ACCEPTANCE')).toBe('info');
      expect(getStateVariant('AWARDED')).toBe('info');
    });
  });
});

