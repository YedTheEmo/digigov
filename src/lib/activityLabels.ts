// Maps internal activity `action` keys to human-friendly labels and broad categories.
// This is used in the unified Cases overview and Activity Logs.

export type ActivityCategory =
  | 'procurement'
  | 'bidding'
  | 'post_award'
  | 'supply'
  | 'budget'
  | 'accounting'
  | 'cashier'
  | 'system'
  | 'other';

type ActivityMeta = {
  label: string;
  category: ActivityCategory;
};

const ACTION_LABELS: Record<string, ActivityMeta> = {
  // System / generic
  create_case: { label: 'Case created', category: 'system' },

  // Procurement pre-award
  posting: { label: 'Posting started', category: 'procurement' },
  rfq_issued: { label: 'RFQ issued', category: 'procurement' },
  quotation_recorded: { label: 'Quotation recorded', category: 'procurement' },
  abstract_generated: { label: 'Abstract of Quotations generated', category: 'procurement' },

  // Public bidding / infra
  bid_bulletin: { label: 'Bid bulletin recorded', category: 'bidding' },
  pre_bid_conf: { label: 'Pre-bid conference recorded', category: 'bidding' },
  bid_submission_opening: { label: 'Bid submission/opening', category: 'bidding' },
  bid_recorded: { label: 'Bid recorded', category: 'bidding' },
  twg_evaluation: { label: 'TWG evaluation recorded', category: 'bidding' },
  post_qualification: { label: 'Post-qualification recorded', category: 'bidding' },
  bac_resolution: { label: 'BAC Resolution recorded', category: 'bidding' },

  award: { label: 'Award recorded', category: 'procurement' },
  po_approved: { label: 'Purchase Order approved', category: 'procurement' },
  contract_signed: { label: 'Contract signed', category: 'procurement' },
  ntp_issued: { label: 'Notice to Proceed issued', category: 'procurement' },

  // Infra post-award
  progress_billing: { label: 'Progress billing recorded', category: 'post_award' },
  pmt_inspection: { label: 'PMT inspection recorded', category: 'post_award' },

  // Supply
  delivery_recorded: { label: 'Delivery recorded', category: 'supply' },
  inspection_recorded: { label: 'Inspection recorded', category: 'supply' },
  acceptance_recorded: { label: 'Acceptance recorded', category: 'supply' },

  // Budget / Accounting / Cashier
  ors_recorded: { label: 'ORS recorded', category: 'budget' },
  dv_recorded: { label: 'Disbursement Voucher recorded', category: 'accounting' },
  check_recorded: { label: 'Check recorded', category: 'cashier' },
  check_advice_recorded: { label: 'Check advice recorded', category: 'cashier' },

  // Fallbacks for raw state transitions, if used as actions
  DRAFT: { label: 'Draft', category: 'system' },
  POSTING: { label: 'Posting', category: 'procurement' },
  RFQ_ISSUED: { label: 'RFQ issued', category: 'procurement' },
  QUOTATION_COLLECTION: { label: 'Quotation collection', category: 'procurement' },
  BID_BULLETIN: { label: 'Bid bulletin stage', category: 'bidding' },
  PRE_BID_CONF: { label: 'Pre-bid conference stage', category: 'bidding' },
  BID_SUBMISSION_OPENING: { label: 'Bid submission/opening stage', category: 'bidding' },
  TWG_EVALUATION: { label: 'TWG evaluation stage', category: 'bidding' },
  POST_QUALIFICATION: { label: 'Post-qualification stage', category: 'bidding' },
  ABSTRACT_OF_QUOTATIONS: { label: 'Abstract of Quotations', category: 'procurement' },
  BAC_RESOLUTION: { label: 'BAC Resolution stage', category: 'bidding' },
  AWARDED: { label: 'Awarded', category: 'procurement' },
  PO_APPROVED: { label: 'PO approved', category: 'procurement' },
  CONTRACT_SIGNED: { label: 'Contract signed', category: 'procurement' },
  NTP_ISSUED: { label: 'NTP issued', category: 'procurement' },
  PROGRESS_BILLING: { label: 'Progress billing', category: 'post_award' },
  PMT_INSPECTION: { label: 'PMT inspection', category: 'post_award' },
  DELIVERY: { label: 'Delivery', category: 'supply' },
  INSPECTION: { label: 'Inspection', category: 'supply' },
  ACCEPTANCE: { label: 'Acceptance', category: 'supply' },
  ORS: { label: 'ORS', category: 'budget' },
  DV: { label: 'DV', category: 'accounting' },
  CHECK: { label: 'Check', category: 'cashier' },
  CLOSED: { label: 'Case closed', category: 'system' },
};

export function getActionMeta(action: string): ActivityMeta {
  const key = action as keyof typeof ACTION_LABELS;
  if (ACTION_LABELS[key]) return ACTION_LABELS[key];

  // Fallback: derive a readable label from the raw key.
  const normalized = action.replace(/[_\-]+/g, ' ').trim();
  const label =
    normalized.length > 0
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : 'Activity';

  return { label, category: 'other' };
}

export const ACTION_FILTERS: { key: string; label: string; category: ActivityCategory }[] = [
  'posting',
  'rfq_issued',
  'quotation_recorded',
  'abstract_generated',
  'bid_bulletin',
  'pre_bid_conf',
  'bid_submission_opening',
  'bid_recorded',
  'twg_evaluation',
  'post_qualification',
  'bac_resolution',
  'award',
  'po_approved',
  'contract_signed',
  'ntp_issued',
  'progress_billing',
  'pmt_inspection',
  'delivery_recorded',
  'inspection_recorded',
  'acceptance_recorded',
  'ors_recorded',
  'dv_recorded',
  'check_recorded',
  'check_advice_recorded',
].map((key) => {
  const meta = getActionMeta(key);
  return { key, label: meta.label, category: meta.category };
});



