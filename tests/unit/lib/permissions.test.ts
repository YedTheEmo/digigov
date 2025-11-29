import { describe, it, expect } from 'vitest';
import {
  canPerform,
  requiresAdminOverride,
  canRole,
  requiredRoles,
  type Role,
  type Action,
} from '@/lib/permissions';

describe('Permissions Matrix', () => {
  describe('canPerform', () => {
    it('allows ADMIN to do everything', () => {
      const actions: Action[] = [
        'ors',
        'dv',
        'check',
        'rfq',
        'quotation',
        'abstract',
        'posting',
        'bid_bulletin',
        'pre_bid',
        'bid',
        'twg',
        'post_qualification',
        'bac_resolution',
        'award',
        'contract',
        'ntp',
        'delivery',
        'inspection',
        'acceptance',
      ];

      actions.forEach((action) => {
        expect(canPerform('ADMIN', action, 'view')).toBe(true);
        expect(canPerform('ADMIN', action, 'create')).toBe(true);
        expect(canPerform('ADMIN', action, 'edit')).toBe(true);
        expect(canPerform('ADMIN', action, 'delete')).toBe(true);
        expect(canPerform('ADMIN', action, 'admin_override')).toBe(true);
      });
    });

    it('allows BUDGET_MANAGER to manage ORS but not delete/override', () => {
      expect(canPerform('BUDGET_MANAGER', 'ors', 'view')).toBe(true);
      expect(canPerform('BUDGET_MANAGER', 'ors', 'create')).toBe(true);
      expect(canPerform('BUDGET_MANAGER', 'ors', 'edit')).toBe(true);
      expect(canPerform('BUDGET_MANAGER', 'ors', 'delete')).toBe(false);
      expect(canPerform('BUDGET_MANAGER', 'ors', 'admin_override')).toBe(false);
    });

    it('allows ACCOUNTING_MANAGER to manage DV', () => {
      expect(canPerform('ACCOUNTING_MANAGER', 'dv', 'view')).toBe(true);
      expect(canPerform('ACCOUNTING_MANAGER', 'dv', 'create')).toBe(true);
      expect(canPerform('ACCOUNTING_MANAGER', 'dv', 'edit')).toBe(true);
      expect(canPerform('ACCOUNTING_MANAGER', 'dv', 'delete')).toBe(false);
    });

    it('allows PROCUREMENT_MANAGER to manage RFQ', () => {
      expect(canPerform('PROCUREMENT_MANAGER', 'rfq', 'view')).toBe(true);
      expect(canPerform('PROCUREMENT_MANAGER', 'rfq', 'create')).toBe(true);
      expect(canPerform('PROCUREMENT_MANAGER', 'rfq', 'edit')).toBe(true);
      expect(canPerform('PROCUREMENT_MANAGER', 'rfq', 'delete')).toBe(false);
    });

    it('allows PROCUREMENT_MANAGER to manage quotations with delete', () => {
      expect(canPerform('PROCUREMENT_MANAGER', 'quotation', 'view')).toBe(true);
      expect(canPerform('PROCUREMENT_MANAGER', 'quotation', 'create')).toBe(true);
      expect(canPerform('PROCUREMENT_MANAGER', 'quotation', 'edit')).toBe(true);
      expect(canPerform('PROCUREMENT_MANAGER', 'quotation', 'delete')).toBe(true);
    });

    it('allows BAC_SECRETARIAT to manage bidding actions', () => {
      expect(canPerform('BAC_SECRETARIAT', 'bid_bulletin', 'view')).toBe(true);
      expect(canPerform('BAC_SECRETARIAT', 'bid_bulletin', 'create')).toBe(true);
      expect(canPerform('BAC_SECRETARIAT', 'bid_bulletin', 'edit')).toBe(true);
      expect(canPerform('BAC_SECRETARIAT', 'pre_bid', 'view')).toBe(true);
      expect(canPerform('BAC_SECRETARIAT', 'bid', 'view')).toBe(true);
      expect(canPerform('BAC_SECRETARIAT', 'post_qualification', 'view')).toBe(true);
    });

    it('allows SUPPLY_MANAGER to manage supply actions', () => {
      expect(canPerform('SUPPLY_MANAGER', 'delivery', 'view')).toBe(true);
      expect(canPerform('SUPPLY_MANAGER', 'delivery', 'create')).toBe(true);
      expect(canPerform('SUPPLY_MANAGER', 'inspection', 'view')).toBe(true);
      expect(canPerform('SUPPLY_MANAGER', 'acceptance', 'view')).toBe(true);
    });

    it('allows CASHIER_MANAGER to manage check actions', () => {
      expect(canPerform('CASHIER_MANAGER', 'check', 'view')).toBe(true);
      expect(canPerform('CASHIER_MANAGER', 'check', 'create')).toBe(true);
      expect(canPerform('CASHIER_MANAGER', 'check', 'edit')).toBe(true);
      expect(canPerform('CASHIER_MANAGER', 'check_advice', 'view')).toBe(true);
    });

    it('allows TWG_MEMBER to manage TWG evaluation', () => {
      expect(canPerform('TWG_MEMBER', 'twg', 'view')).toBe(true);
      expect(canPerform('TWG_MEMBER', 'twg', 'create')).toBe(true);
      expect(canPerform('TWG_MEMBER', 'twg', 'edit')).toBe(true);
    });

    it('allows APPROVER to view and edit awards', () => {
      expect(canPerform('APPROVER', 'award', 'view')).toBe(true);
      expect(canPerform('APPROVER', 'award', 'edit')).toBe(true);
      expect(canPerform('APPROVER', 'award', 'create')).toBe(false);
      expect(canPerform('APPROVER', 'award', 'delete')).toBe(false);
    });

    it('returns false for unknown roles', () => {
      expect(canPerform('UNKNOWN_ROLE' as Role, 'ors', 'view')).toBe(false);
      expect(canPerform('UNKNOWN_ROLE' as Role, 'ors', 'create')).toBe(false);
    });

    it('returns false for actions not in role capabilities', () => {
      expect(canPerform('BUDGET_MANAGER', 'rfq', 'view')).toBe(false);
      expect(canPerform('ACCOUNTING_MANAGER', 'ors', 'view')).toBe(false);
      expect(canPerform('PROCUREMENT_MANAGER', 'dv', 'view')).toBe(false);
    });
  });

  describe('requiresAdminOverride', () => {
    it('returns true for ADMIN role', () => {
      expect(requiresAdminOverride('ADMIN', 'ors')).toBe(true);
      expect(requiresAdminOverride('ADMIN', 'dv')).toBe(true);
      expect(requiresAdminOverride('ADMIN', 'rfq')).toBe(true);
    });

    it('returns false for non-admin roles', () => {
      expect(requiresAdminOverride('BUDGET_MANAGER', 'ors')).toBe(false);
      expect(requiresAdminOverride('ACCOUNTING_MANAGER', 'dv')).toBe(false);
      expect(requiresAdminOverride('PROCUREMENT_MANAGER', 'rfq')).toBe(false);
    });
  });

  describe('canRole', () => {
    it('returns true for allowed roles', () => {
      expect(canRole('PROCUREMENT_MANAGER', 'rfq')).toBe(true);
      expect(canRole('BUDGET_MANAGER', 'ors')).toBe(true);
      expect(canRole('ACCOUNTING_MANAGER', 'dv')).toBe(true);
      expect(canRole('ADMIN', 'ors')).toBe(true);
    });

    it('returns false for disallowed roles', () => {
      expect(canRole('BUDGET_MANAGER', 'rfq')).toBe(false);
      expect(canRole('PROCUREMENT_MANAGER', 'ors')).toBe(false);
      expect(canRole('ACCOUNTING_MANAGER', 'rfq')).toBe(false);
    });
  });

  describe('requiredRoles', () => {
    it('returns correct roles for each action', () => {
      expect(requiredRoles('ors')).toContain('BUDGET_MANAGER');
      expect(requiredRoles('ors')).toContain('ADMIN');
      expect(requiredRoles('dv')).toContain('ACCOUNTING_MANAGER');
      expect(requiredRoles('rfq')).toContain('PROCUREMENT_MANAGER');
      expect(requiredRoles('bid_bulletin')).toContain('BAC_SECRETARIAT');
    });

    it('returns empty array for unknown actions', () => {
      expect(requiredRoles('UNKNOWN_ACTION' as Action)).toEqual([]);
    });
  });
});

