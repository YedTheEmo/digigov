export type Role =
  | 'ADMIN'
  | 'PROCUREMENT_MANAGER'
  | 'SUPPLY_MANAGER'
  | 'BUDGET_MANAGER'
  | 'ACCOUNTING_MANAGER'
  | 'CASHIER_MANAGER'
  | 'BAC_SECRETARIAT'
  | 'TWG_MEMBER'
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

export function canRole(role: Role, action: Action) {
  const allowed = MAP[action] || [];
  return allowed.includes(role as any);
}

export function requiredRoles(action: Action): Role[] {
  return MAP[action] || [];
}


