export type Role =
  | 'ADMIN'
  | 'PROCUREMENT_MANAGER'
  | 'SUPPLY_MANAGER'
  | 'BUDGET_MANAGER'
  | 'ACCOUNTING_MANAGER'
  | 'CASHIER_MANAGER'
  | 'BAC_SECRETARIAT'
  | 'TWG_MEMBER'
  | 'APPROVER'
  | string;

export type Action =
  | 'posting'
  | 'rfq'
  | 'quotation'
  | 'abstract'
  | 'bid_bulletin'
  | 'pre_bid'
  | 'bid'
  | 'twg'
  | 'post_qualification'
  | 'bac_resolution'
  | 'award'
  | 'contract'
  | 'ntp'
  | 'delivery'
  | 'inspection'
  | 'acceptance'
  | 'ors'
  | 'dv'
  | 'check'
  | 'check_advice';

export type Capability = 'view' | 'create' | 'edit' | 'delete' | 'admin_override';

// Simplified mapping for roles to basic read/write access
// Use ROLE_CAPABILITIES for granular control
const MAP: Record<Action, Role[]> = {
  posting: ['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'],
  rfq: ['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'],
  quotation: ['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN'],
  abstract: ['PROCUREMENT_MANAGER', 'ADMIN'],
  bid_bulletin: ['BAC_SECRETARIAT', 'ADMIN'],
  pre_bid: ['BAC_SECRETARIAT', 'ADMIN'],
  bid: ['BAC_SECRETARIAT', 'ADMIN'],
  twg: ['TWG_MEMBER', 'ADMIN'],
  post_qualification: ['BAC_SECRETARIAT', 'ADMIN'],
  bac_resolution: ['BAC_SECRETARIAT', 'ADMIN'],
  award: ['APPROVER', 'BAC_SECRETARIAT', 'ADMIN'],
  contract: ['PROCUREMENT_MANAGER', 'ADMIN'],
  ntp: ['PROCUREMENT_MANAGER', 'ADMIN'],
  delivery: ['SUPPLY_MANAGER', 'ADMIN'],
  inspection: ['SUPPLY_MANAGER', 'ADMIN'],
  acceptance: ['SUPPLY_MANAGER', 'ADMIN'],
  ors: ['BUDGET_MANAGER', 'ADMIN'],
  dv: ['ACCOUNTING_MANAGER', 'ADMIN'],
  check: ['CASHIER_MANAGER', 'ADMIN'],
  check_advice: ['CASHIER_MANAGER', 'ADMIN'],
};

// Granular Capabilities Matrix
export const ROLE_CAPABILITIES: Record<Role, Partial<Record<Action, Capability[]>>> = {
  ADMIN: {
    // Admin can do everything, including override
    posting: ['view', 'create', 'edit', 'delete', 'admin_override'],
    rfq: ['view', 'create', 'edit', 'delete', 'admin_override'],
    quotation: ['view', 'create', 'edit', 'delete', 'admin_override'],
    abstract: ['view', 'create', 'edit', 'delete', 'admin_override'],
    bid_bulletin: ['view', 'create', 'edit', 'delete', 'admin_override'],
    pre_bid: ['view', 'create', 'edit', 'delete', 'admin_override'],
    bid: ['view', 'create', 'edit', 'delete', 'admin_override'],
    twg: ['view', 'create', 'edit', 'delete', 'admin_override'],
    post_qualification: ['view', 'create', 'edit', 'delete', 'admin_override'],
    bac_resolution: ['view', 'create', 'edit', 'delete', 'admin_override'],
    award: ['view', 'create', 'edit', 'delete', 'admin_override'],
    contract: ['view', 'create', 'edit', 'delete', 'admin_override'],
    ntp: ['view', 'create', 'edit', 'delete', 'admin_override'],
    delivery: ['view', 'create', 'edit', 'delete', 'admin_override'],
    inspection: ['view', 'create', 'edit', 'delete', 'admin_override'],
    acceptance: ['view', 'create', 'edit', 'delete', 'admin_override'],
    ors: ['view', 'create', 'edit', 'delete', 'admin_override'],
    dv: ['view', 'create', 'edit', 'delete', 'admin_override'],
    check: ['view', 'create', 'edit', 'delete', 'admin_override'],
    check_advice: ['view', 'create', 'edit', 'delete', 'admin_override'],
  },
  PROCUREMENT_MANAGER: {
    posting: ['view', 'create', 'edit'],
    rfq: ['view', 'create', 'edit'],
    quotation: ['view', 'create', 'edit', 'delete'], // Can delete individual quotes if needed? Usually soft delete.
    abstract: ['view', 'create', 'edit'],
    contract: ['view', 'create', 'edit'],
    ntp: ['view', 'create', 'edit'],
  },
  BAC_SECRETARIAT: {
    posting: ['view', 'create', 'edit'],
    rfq: ['view', 'create', 'edit'],
    quotation: ['view', 'create', 'edit'],
    bid_bulletin: ['view', 'create', 'edit'],
    pre_bid: ['view', 'create', 'edit'],
    bid: ['view', 'create', 'edit'],
    post_qualification: ['view', 'create', 'edit'],
    bac_resolution: ['view', 'create', 'edit'],
    award: ['view', 'create', 'edit'],
  },
  SUPPLY_MANAGER: {
    delivery: ['view', 'create', 'edit'],
    inspection: ['view', 'create', 'edit'],
    acceptance: ['view', 'create', 'edit'],
  },
  BUDGET_MANAGER: {
    ors: ['view', 'create', 'edit'],
  },
  ACCOUNTING_MANAGER: {
    dv: ['view', 'create', 'edit'],
  },
  CASHIER_MANAGER: {
    check: ['view', 'create', 'edit'],
    check_advice: ['view', 'create', 'edit'],
  },
  TWG_MEMBER: {
    twg: ['view', 'create', 'edit'],
  },
  APPROVER: {
    award: ['view', 'edit'], // Approver mostly signs off
  }
};

// Fallback for 'create' checks using the old MAP
export function canRole(role: Role, action: Action) {
  const allowed = MAP[action] || [];
  return allowed.includes(role);
}

export function requiredRoles(action: Action): Role[] {
  return MAP[action] || [];
}

export function canPerform(role: Role, action: Action, capability: Capability): boolean {
  // Admins can do anything by default, but we check the matrix to be explicit
  // If role is not in matrix, default to no access
  const roleCaps = ROLE_CAPABILITIES[role];
  if (!roleCaps) return false;

  const actionCaps = roleCaps[action];
  if (!actionCaps) return false;

  return actionCaps.includes(capability);
}

export function requiresAdminOverride(role: Role, action: Action): boolean {
  // If the user CAN perform the action, but ONLY because they are admin or have override capability,
  // AND the context requires it (checked elsewhere via downstream data), then yes.
  // This function is more about "Does this role *have* the power to override?"
  // Usually ADMIN has this.
  return canPerform(role, action, 'admin_override');
}
