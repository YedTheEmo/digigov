import type { ProcurementMethod, Regime } from '@/generated/prisma';

const MAP: Record<string, string> = {
  posting: 'RA 9184 IRR Sec. 21 (Advertising and Posting)',
  pre_bid_conf: 'RA 9184 IRR Sec. 22 (Pre-Bid Conference)',
  bid_submission_opening: 'RA 9184 IRR Sec. 29-30 (Submission and Opening of Bids)',
  twg_evaluation: 'RA 9184 IRR Sec. 30-34 (Bid Evaluation)',
  post_qualification: 'RA 9184 IRR Sec. 34 (Post-Qualification)',
  abstract_of_quotations: 'RA 9184 IRR Sec. 54.2 (Shopping/Small Value Procurement)',
  bac_resolution: 'RA 9184 IRR Sec. 12-14 (BAC functions and Awards)',
  award: 'RA 9184 IRR Sec. 37 (Notice and Award of Contract)',
  ntp_issued: 'RA 9184 IRR Sec. 37.4 (Notice to Proceed)',
  inspection: 'COA Rules: Inspection prior to Acceptance',
  acceptance: 'Property/Supply Acceptance Procedures',
  ors: 'PFM: ORS preparation (Budget)',
  dv: 'PFM: DV preparation (Accounting)',
  check: 'PFM: Check preparation (Cashier)',
};

export function getLegalBasis(action: string, _method?: ProcurementMethod | null, _regime?: Regime | null) {
  return MAP[action] ?? null;
}



