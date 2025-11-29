import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditDeleteAccess } from '@/hooks/useEditDeleteAccess';
import { createProcurementCase } from '../__helpers__/factories';

describe('useEditDeleteAccess', () => {
  it('allows edit and delete when user has permission and no downstream data', () => {
    const case_ = createProcurementCase({ currentState: 'ORS' });
    const caseData = {
      ...case_,
      dv: null,
      check: null,
      quotations: [],
      abstract: null,
    } as any;

    const { result } = renderHook(() =>
      useEditDeleteAccess({
        role: 'BUDGET_MANAGER',
        action: 'ors',
        caseData,
      }),
    );

    expect(result.current.canEdit).toBe(true);
    expect(result.current.canDelete).toBe(false); // BUDGET_MANAGER can't delete
    expect(result.current.isLocked).toBe(false);
  });

  it('blocks edit when downstream data exists and user is not admin', () => {
    const case_ = createProcurementCase({ currentState: 'ORS' });
    const caseData = {
      ...case_,
      dv: { id: 'dv-1' },
      check: null,
      quotations: [],
      abstract: null,
    } as any;

    const { result } = renderHook(() =>
      useEditDeleteAccess({
        role: 'BUDGET_MANAGER',
        action: 'ors',
        caseData,
      }),
    );

    expect(result.current.canEdit).toBe(false);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockedReason).toBe('DV already created');
  });

  it('allows edit with override when downstream data exists and user is admin', () => {
    const case_ = createProcurementCase({ currentState: 'ORS' });
    const caseData = {
      ...case_,
      dv: { id: 'dv-1' },
      check: null,
      quotations: [],
      abstract: null,
    } as any;

    const { result } = renderHook(() =>
      useEditDeleteAccess({
        role: 'ADMIN',
        action: 'ors',
        caseData,
      }),
    );

    expect(result.current.canEdit).toBe(true);
    expect(result.current.requiresOverride).toBe(true);
    expect(result.current.isLocked).toBe(true);
  });

  it('blocks edit when quotations exist after RFQ', () => {
    const case_ = createProcurementCase({ currentState: 'RFQ_ISSUED' });
    const caseData = {
      ...case_,
      rfq: { id: 'rfq-1' },
      quotations: [{ id: 'q-1' }],
      abstract: null,
    } as any;

    const { result } = renderHook(() =>
      useEditDeleteAccess({
        role: 'PROCUREMENT_MANAGER',
        action: 'rfq',
        caseData,
      }),
    );

    expect(result.current.canEdit).toBe(false);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockedReason).toBe('Quotations already collected');
  });

  it('blocks edit when abstract exists after quotation', () => {
    const case_ = createProcurementCase({ currentState: 'QUOTATION_COLLECTION' });
    const caseData = {
      ...case_,
      quotations: [{ id: 'q-1' }],
      abstract: { id: 'abs-1' },
    } as any;

    const { result } = renderHook(() =>
      useEditDeleteAccess({
        role: 'PROCUREMENT_MANAGER',
        action: 'quotation',
        caseData,
      }),
    );

    expect(result.current.canEdit).toBe(false);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockedReason).toBe('Abstract of Quotations already created');
  });

  it('blocks edit when check exists after DV', () => {
    const case_ = createProcurementCase({ currentState: 'DV' });
    const caseData = {
      ...case_,
      dv: { id: 'dv-1' },
      check: { id: 'check-1' },
    } as any;

    const { result } = renderHook(() =>
      useEditDeleteAccess({
        role: 'ACCOUNTING_MANAGER',
        action: 'dv',
        caseData,
      }),
    );

    expect(result.current.canEdit).toBe(false);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockedReason).toBe('Check already created');
  });

  it('blocks edit when case is CLOSED after check', () => {
    const case_ = createProcurementCase({ currentState: 'CLOSED' });
    const caseData = {
      ...case_,
      check: { id: 'check-1' },
    } as any;

    const { result } = renderHook(() =>
      useEditDeleteAccess({
        role: 'CASHIER_MANAGER',
        action: 'check',
        caseData,
      }),
    );

    expect(result.current.canEdit).toBe(false);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockedReason).toBe('Case is Closed');
  });
});

