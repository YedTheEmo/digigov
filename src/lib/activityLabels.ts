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
  create_case: { label: 'Case Created', category: 'system' },

  // Procurement pre-award
  posting: { label: 'Posting Started', category: 'procurement' },
  start_posting: { label: 'Posting Started', category: 'procurement' },
  rfq_issued: { label: 'RFQ Issued', category: 'procurement' },
  issue_rfq: { label: 'RFQ Issued', category: 'procurement' },
  quotation_recorded: { label: 'Quotation Recorded', category: 'procurement' },
  add_quotation: { label: 'Quotation Added', category: 'procurement' },
  start_quotation_collection: { label: 'Quotation Collection Started', category: 'procurement' },
  abstract_generated: { label: 'Abstract of Quotations Generated', category: 'procurement' },
  abstract_of_quotations: { label: 'Abstract of Quotations', category: 'procurement' },
  generate_abstract: { label: 'Abstract of Quotations Generated', category: 'procurement' },

  // Public bidding / infra
  bid_bulletin: { label: 'Bid Bulletin Recorded', category: 'bidding' },
  pre_bid_conf: { label: 'Pre-Bid Conference Recorded', category: 'bidding' },
  bid_submission_opening: { label: 'Bid Submission/Opening', category: 'bidding' },
  bid_recorded: { label: 'Bid Recorded', category: 'bidding' },
  twg_evaluation: { label: 'TWG Evaluation Recorded', category: 'bidding' },
  post_qualification: { label: 'Post-Qualification Recorded', category: 'bidding' },
  bac_resolution: { label: 'BAC Resolution Recorded', category: 'bidding' },

  award: { label: 'Award Recorded', category: 'procurement' },
  po_approved: { label: 'Purchase Order Approved', category: 'procurement' },
  contract_signed: { label: 'Contract Signed', category: 'procurement' },
  ntp_issued: { label: 'Notice to Proceed Issued', category: 'procurement' },

  // Infra post-award
  progress_billing: { label: 'Progress Billing Recorded', category: 'post_award' },
  pmt_inspection: { label: 'PMT Inspection Recorded', category: 'post_award' },

  // Supply
  delivery_recorded: { label: 'Delivery Recorded', category: 'supply' },
  inspection_recorded: { label: 'Inspection Recorded', category: 'supply' },
  acceptance_recorded: { label: 'Acceptance Recorded', category: 'supply' },

  // Budget / Accounting / Cashier
  ors: { label: 'ORS Recorded', category: 'budget' },
  ors_recorded: { label: 'ORS Recorded', category: 'budget' },
  dv: { label: 'DV Recorded', category: 'accounting' },
  dv_recorded: { label: 'DV Recorded', category: 'accounting' },
  check_recorded: { label: 'Check Recorded', category: 'cashier' },
  check_advice_recorded: { label: 'Check Advice Recorded', category: 'cashier' },

  // Fallbacks for raw state transitions, if used as actions
  DRAFT: { label: 'Draft', category: 'system' },
  POSTING: { label: 'Posting', category: 'procurement' },
  RFQ_ISSUED: { label: 'RFQ Issued', category: 'procurement' },
  QUOTATION_COLLECTION: { label: 'Quotation Collection', category: 'procurement' },
  BID_BULLETIN: { label: 'Bid Bulletin Stage', category: 'bidding' },
  PRE_BID_CONF: { label: 'Pre-Bid Conference Stage', category: 'bidding' },
  BID_SUBMISSION_OPENING: { label: 'Bid Submission/Opening Stage', category: 'bidding' },
  TWG_EVALUATION: { label: 'TWG Evaluation Stage', category: 'bidding' },
  POST_QUALIFICATION: { label: 'Post-Qualification Stage', category: 'bidding' },
  ABSTRACT_OF_QUOTATIONS: { label: 'Abstract of Quotations', category: 'procurement' },
  BAC_RESOLUTION: { label: 'BAC Resolution Stage', category: 'bidding' },
  AWARDED: { label: 'Awarded', category: 'procurement' },
  PO_APPROVED: { label: 'PO Approved', category: 'procurement' },
  CONTRACT_SIGNED: { label: 'Contract Signed', category: 'procurement' },
  NTP_ISSUED: { label: 'NTP Issued', category: 'procurement' },
  PROGRESS_BILLING: { label: 'Progress Billing', category: 'post_award' },
  PMT_INSPECTION: { label: 'PMT Inspection', category: 'post_award' },
  DELIVERY: { label: 'Delivery', category: 'supply' },
  INSPECTION: { label: 'Inspection', category: 'supply' },
  ACCEPTANCE: { label: 'Acceptance', category: 'supply' },
  ORS: { label: 'ORS', category: 'budget' },
  DV: { label: 'DV', category: 'accounting' },
  CHECK: { label: 'Check', category: 'cashier' },
  CLOSED: { label: 'Case Closed', category: 'system' },
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



