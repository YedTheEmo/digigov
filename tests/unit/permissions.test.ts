import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canPerform, requiresAdminOverride } from '../../src/lib/permissions';

describe('Permissions Matrix', () => {
  it('allows ADMIN to do everything', () => {
    assert.equal(canPerform('ADMIN', 'ors', 'view'), true);
    assert.equal(canPerform('ADMIN', 'ors', 'create'), true);
    assert.equal(canPerform('ADMIN', 'ors', 'edit'), true);
    assert.equal(canPerform('ADMIN', 'ors', 'delete'), true);
    assert.equal(canPerform('ADMIN', 'ors', 'admin_override'), true);
  });

  it('allows BUDGET_MANAGER to manage ORS but not delete/override', () => {
    assert.equal(canPerform('BUDGET_MANAGER', 'ors', 'create'), true);
    assert.equal(canPerform('BUDGET_MANAGER', 'ors', 'edit'), true);
    assert.equal(canPerform('BUDGET_MANAGER', 'ors', 'delete'), false);
    assert.equal(canPerform('BUDGET_MANAGER', 'ors', 'admin_override'), false);
  });

  it('allows ACCOUNTING_MANAGER to manage DV', () => {
    assert.equal(canPerform('ACCOUNTING_MANAGER', 'dv', 'create'), true);
    assert.equal(canPerform('ACCOUNTING_MANAGER', 'dv', 'edit'), true);
  });

  it('allows PROCUREMENT_MANAGER to manage RFQ', () => {
    assert.equal(canPerform('PROCUREMENT_MANAGER', 'rfq', 'create'), true);
    assert.equal(canPerform('PROCUREMENT_MANAGER', 'rfq', 'edit'), true);
  });

  it('checks admin override requirements correctly', () => {
    assert.equal(requiresAdminOverride('ADMIN', 'ors'), true);
    assert.equal(requiresAdminOverride('BUDGET_MANAGER', 'ors'), false);
  });
});
