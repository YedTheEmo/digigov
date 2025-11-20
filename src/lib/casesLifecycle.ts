import type { ActivityLog, ProcurementCase } from '@/generated/prisma';

export type LifecycleModule = 'Procurement' | 'Supply' | 'Budget' | 'Accounting' | 'Cashier';

export type LifecycleStageId =
  | 'DRAFT'
  | 'POSTING'
  | 'RFQ_ISSUED'
  | 'QUOTATION_COLLECTION'
  | 'ABSTRACT_OF_QUOTATIONS'
  | 'BID_BULLETIN'
  | 'PRE_BID_CONF'
  | 'BID_SUBMISSION_OPENING'
  | 'TWG_EVALUATION'
  | 'POST_QUALIFICATION'
  | 'BAC_RESOLUTION'
  | 'AWARDED'
  | 'PO_APPROVED'
  | 'CONTRACT_SIGNED'
  | 'NTP_ISSUED'
  | 'PROGRESS_BILLING'
  | 'PMT_INSPECTION'
  | 'DELIVERY'
  | 'INSPECTION'
  | 'ACCEPTANCE'
  | 'ORS'
  | 'DV'
  | 'CHECK'
  | 'CLOSED';

export type LifecycleStage = {
  id: LifecycleStageId;
  label: string;
  module: LifecycleModule;
  completed: boolean;
  completedAt?: Date | null;
};

export type LifecycleSummary = {
  stages: LifecycleStage[];
  currentStageIndex: number;
  currentModule: LifecycleModule | null;
};

type CaseWithRelations = ProcurementCase & {
  rfq: { issuedAt: Date | null } | null;
  quotations: { submittedAt: Date }[];
  abstract: { createdAt: Date } | null;
  bacResolution: { createdAt: Date } | null;
  award: { noticeDate: Date | null } | null;
  purchaseOrder: { approvedAt: Date | null } | null;
  contract: { signedAt: Date | null } | null;
  ntp: { issuedAt: Date | null } | null;
  progressBilling: { billedAt: Date | null } | null;
  pmtInspection: { inspectedAt: Date | null } | null;
  deliveries: { deliveredAt: Date | null }[];
  inspection: { inspectedAt: Date | null } | null;
  acceptance: { acceptedAt: Date | null } | null;
  ors: { preparedAt: Date | null } | null;
  dv: { preparedAt: Date | null } | null;
  check: { preparedAt: Date | null } | null;
  checkAdvice: { approvedAt: Date | null } | null;
  bidBulletins: { publishedAt: Date | null }[];
  preBid: { scheduledAt: Date | null } | null;
  bids: { submittedAt: Date; openedAt: Date | null }[];
  twgEvaluation: { evaluatedAt: Date | null } | null;
  postQualification: { completedAt: Date | null } | null;
  activityLogs: ActivityLog[];
};

function findStageCompletedAt(
  stageId: LifecycleStageId,
  activityLogs: ActivityLog[],
  fallbackDates: (Date | null | undefined)[],
): Date | null {
  const log = activityLogs.find((l) => l.toState === stageId);
  if (log) return log.createdAt;

  const fallback = fallbackDates.find((d) => !!d) ?? null;
  return fallback ?? null;
}

type StageConfig = {
  id: LifecycleStageId;
  label: string;
  module: LifecycleModule;
  isCompleted: (c: CaseWithRelations) => boolean;
  dates: (c: CaseWithRelations) => (Date | null | undefined)[];
};

const COMMON_TAIL: StageConfig[] = [
  {
    id: 'DELIVERY',
    label: 'Delivered',
    module: 'Supply',
    isCompleted: (c) => (c.deliveries?.length || 0) > 0,
    dates: (c) => c.deliveries?.map((d) => d.deliveredAt ?? null) ?? [],
  },
  {
    id: 'INSPECTION',
    label: 'Inspected',
    module: 'Supply',
    isCompleted: (c) => !!c.inspection,
    dates: (c) => [c.inspection?.inspectedAt ?? null],
  },
  {
    id: 'ACCEPTANCE',
    label: 'Accepted',
    module: 'Supply',
    isCompleted: (c) => !!c.acceptance,
    dates: (c) => [c.acceptance?.acceptedAt ?? null],
  },
  {
    id: 'ORS',
    label: 'ORS recorded',
    module: 'Budget',
    isCompleted: (c) => !!c.ors,
    dates: (c) => [c.ors?.preparedAt ?? null],
  },
  {
    id: 'DV',
    label: 'DV recorded',
    module: 'Accounting',
    isCompleted: (c) => !!c.dv,
    dates: (c) => [c.dv?.preparedAt ?? null],
  },
  {
    id: 'CHECK',
    label: 'Check recorded',
    module: 'Cashier',
    isCompleted: (c) => !!c.check,
    dates: (c) => [c.check?.preparedAt ?? null],
  },
  {
    id: 'CLOSED',
    label: 'Closed',
    module: 'Cashier',
    isCompleted: (c) => c.currentState === 'CLOSED' || !!c.checkAdvice,
    dates: (c) => [c.checkAdvice?.approvedAt ?? null],
  },
];

function getStageConfigsForPublicBidding(): StageConfig[] {
  return [
    {
      id: 'DRAFT',
      label: 'Draft',
      module: 'Procurement',
      isCompleted: () => true,
      dates: (c) => [c.createdAt],
    },
    {
      id: 'POSTING',
      label: 'Posting',
      module: 'Procurement',
      isCompleted: (c) =>
        ['POSTING', 'BID_BULLETIN', 'PRE_BID_CONF', 'BID_SUBMISSION_OPENING'].includes(
          c.currentState as string,
        ) || !!c.postingStartAt,
      dates: (c) => [c.postingStartAt],
    },
    {
      id: 'BID_BULLETIN',
      label: 'Bid bulletin',
      module: 'Procurement',
      isCompleted: (c) => (c.bidBulletins?.length || 0) > 0,
      dates: (c) => c.bidBulletins?.map((b) => b.publishedAt ?? null) ?? [],
    },
    {
      id: 'PRE_BID_CONF',
      label: 'Pre-bid conference',
      module: 'Procurement',
      isCompleted: (c) => !!c.preBid,
      dates: (c) => [c.preBid?.scheduledAt ?? null],
    },
    {
      id: 'BID_SUBMISSION_OPENING',
      label: 'Bid submission & opening',
      module: 'Procurement',
      isCompleted: (c) => (c.bids?.length || 0) > 0,
      dates: (c) => c.bids?.map((b) => b.openedAt ?? b.submittedAt) ?? [],
    },
    {
      id: 'TWG_EVALUATION',
      label: 'TWG evaluation',
      module: 'Procurement',
      isCompleted: (c) => !!c.twgEvaluation,
      dates: (c) => [c.twgEvaluation?.evaluatedAt ?? null],
    },
    {
      id: 'POST_QUALIFICATION',
      label: 'Post-qualification',
      module: 'Procurement',
      isCompleted: (c) => !!c.postQualification,
      dates: (c) => [c.postQualification?.completedAt ?? null],
    },
    {
      id: 'BAC_RESOLUTION',
      label: 'BAC Resolution',
      module: 'Procurement',
      isCompleted: (c) => !!c.bacResolution,
      dates: (c) => [c.bacResolution?.createdAt ?? null],
    },
    {
      id: 'AWARDED',
      label: 'Award',
      module: 'Procurement',
      isCompleted: (c) => !!c.award,
      dates: (c) => [c.award?.noticeDate ?? null],
    },
    {
      id: 'PO_APPROVED',
      label: 'PO approved',
      module: 'Procurement',
      isCompleted: (c) => !!c.purchaseOrder,
      dates: (c) => [c.purchaseOrder?.approvedAt ?? null],
    },
    {
      id: 'CONTRACT_SIGNED',
      label: 'Contract signed',
      module: 'Procurement',
      isCompleted: (c) => !!c.contract,
      dates: (c) => [c.contract?.signedAt ?? null],
    },
    {
      id: 'NTP_ISSUED',
      label: 'NTP issued',
      module: 'Procurement',
      isCompleted: (c) => !!c.ntp,
      dates: (c) => [c.ntp?.issuedAt ?? null],
    },
  ];
}

function getStageConfigsForSmallValue(): StageConfig[] {
  return [
    {
      id: 'DRAFT',
      label: 'Draft',
      module: 'Procurement',
      isCompleted: () => true,
      dates: (c) => [c.createdAt],
    },
    {
      id: 'POSTING',
      label: 'Posting',
      module: 'Procurement',
      isCompleted: (c) =>
        ['POSTING', 'RFQ_ISSUED', 'QUOTATION_COLLECTION', 'ABSTRACT_OF_QUOTATIONS'].includes(
          c.currentState as string,
        ) || !!c.postingStartAt,
      dates: (c) => [c.postingStartAt],
    },
    {
      id: 'RFQ_ISSUED',
      label: 'RFQ issued',
      module: 'Procurement',
      isCompleted: (c) => !!c.rfq,
      dates: (c) => [c.rfq?.issuedAt ?? null],
    },
    {
      id: 'QUOTATION_COLLECTION',
      label: 'Quotations collected',
      module: 'Procurement',
      isCompleted: (c) => (c.quotations?.length || 0) > 0,
      dates: (c) => c.quotations?.map((q) => q.submittedAt) ?? [],
    },
    {
      id: 'ABSTRACT_OF_QUOTATIONS',
      label: 'Abstract of Quotations',
      module: 'Procurement',
      isCompleted: (c) => !!c.abstract,
      dates: (c) => [c.abstract?.createdAt ?? null],
    },
    {
      id: 'BAC_RESOLUTION',
      label: 'BAC Resolution',
      module: 'Procurement',
      isCompleted: (c) => !!c.bacResolution,
      dates: (c) => [c.bacResolution?.createdAt ?? null],
    },
    {
      id: 'AWARDED',
      label: 'Award',
      module: 'Procurement',
      isCompleted: (c) => !!c.award,
      dates: (c) => [c.award?.noticeDate ?? null],
    },
    {
      id: 'PO_APPROVED',
      label: 'PO approved',
      module: 'Procurement',
      isCompleted: (c) => !!c.purchaseOrder,
      dates: (c) => [c.purchaseOrder?.approvedAt ?? null],
    },
    {
      id: 'CONTRACT_SIGNED',
      label: 'Contract signed',
      module: 'Procurement',
      isCompleted: (c) => !!c.contract,
      dates: (c) => [c.contract?.signedAt ?? null],
    },
    {
      id: 'NTP_ISSUED',
      label: 'NTP issued',
      module: 'Procurement',
      isCompleted: (c) => !!c.ntp,
      dates: (c) => [c.ntp?.issuedAt ?? null],
    },
  ];
}

function getStageConfigsForInfrastructure(): StageConfig[] {
  return [
    ...getStageConfigsForPublicBidding(),
    {
      id: 'PROGRESS_BILLING',
      label: 'Progress billing',
      module: 'Procurement',
      isCompleted: (c) => !!c.progressBilling,
      dates: (c) => [c.progressBilling?.billedAt ?? null],
    },
    {
      id: 'PMT_INSPECTION',
      label: 'PMT inspection',
      module: 'Procurement',
      isCompleted: (c) => !!c.pmtInspection,
      dates: (c) => [c.pmtInspection?.inspectedAt ?? null],
    },
  ];
}

export function getLifecycleSummary(caseData: CaseWithRelations): LifecycleSummary {
  const currentState = caseData.currentState as LifecycleStageId;

  let headConfigs: StageConfig[];
  if (caseData.method === 'SMALL_VALUE_RFQ') {
    headConfigs = getStageConfigsForSmallValue();
  } else if (caseData.method === 'INFRASTRUCTURE') {
    headConfigs = getStageConfigsForInfrastructure();
  } else {
    headConfigs = getStageConfigsForPublicBidding();
  }

  const allConfigs = [...headConfigs, ...COMMON_TAIL];

  const stages: LifecycleStage[] = allConfigs.map((cfg) => ({
    id: cfg.id,
    label: cfg.label,
    module: cfg.module,
    completed: cfg.isCompleted(caseData),
    completedAt: findStageCompletedAt(cfg.id, caseData.activityLogs, cfg.dates(caseData)),
  }));

  const currentStageIndex = stages.findIndex((s) => s.id === currentState);

  return {
    stages,
    currentStageIndex: currentStageIndex === -1 ? 0 : currentStageIndex,
    currentModule: getCurrentOwner(caseData.currentState as LifecycleStageId)?.module ?? null,
  };
}

export function getCurrentOwner(
  state: LifecycleStageId,
): { module: LifecycleModule; roleHint: string } | null {
  if (
    [
      'DRAFT',
      'POSTING',
      'RFQ_ISSUED',
      'QUOTATION_COLLECTION',
      'ABSTRACT_OF_QUOTATIONS',
      'BID_BULLETIN',
      'PRE_BID_CONF',
      'BID_SUBMISSION_OPENING',
      'TWG_EVALUATION',
      'POST_QUALIFICATION',
      'BAC_RESOLUTION',
      'AWARDED',
      'PO_APPROVED',
      'CONTRACT_SIGNED',
      'NTP_ISSUED',
      'PROGRESS_BILLING',
      'PMT_INSPECTION',
    ].includes(state)
  ) {
    return { module: 'Procurement', roleHint: 'Procurement Manager / BAC' };
  }
  if (['DELIVERY', 'INSPECTION', 'ACCEPTANCE'].includes(state)) {
    return { module: 'Supply', roleHint: 'Supply Manager' };
  }
  if (state === 'ORS') {
    return { module: 'Budget', roleHint: 'Budget / Accounting' };
  }
  if (state === 'DV') {
    return { module: 'Accounting', roleHint: 'Accounting Manager' };
  }
  if (state === 'CHECK' || state === 'CLOSED') {
    return { module: 'Cashier', roleHint: 'Cashier Manager' };
  }
  return null;
}

export function getNextStepMessage(state: LifecycleStageId): string | null {
  if (state === 'DRAFT') {
    return 'Next step: set a posting period and start posting this case from the Procurement workspace.';
  }
  if (['POSTING', 'RFQ_ISSUED', 'QUOTATION_COLLECTION', 'ABSTRACT_OF_QUOTATIONS'].includes(state)) {
    return 'Next step: continue pre-award actions in Procurement until award and contract signing are completed.';
  }
  if (['BAC_RESOLUTION', 'AWARDED', 'PO_APPROVED', 'CONTRACT_SIGNED'].includes(state)) {
    return 'Next step: issue the Notice to Proceed (NTP) in Procurement, then Supply will handle delivery, inspection, and acceptance.';
  }
  if (state === 'NTP_ISSUED') {
    return 'Stage: Contract implementation. Next step: Supply records delivery, inspection, and acceptance for this case.';
  }
  if (['DELIVERY', 'INSPECTION'].includes(state)) {
    return 'Stage: Delivery and Inspection. Next step: complete remaining Supply actions, then move to Budget for ORS preparation.';
  }
  if (state === 'ACCEPTANCE') {
    return 'Stage: Accepted. Next step: Budget prepares the Obligation Request and Status (ORS) for this case.';
  }
  if (state === 'ORS') {
    return 'Stage: ORS prepared. Next step: Accounting prepares the Disbursement Voucher (DV), then Cashier issues the check and check advice.';
  }
  if (state === 'DV') {
    return 'Stage: Disbursement Voucher prepared. Next step: Cashier prepares the check in the Cashier workspace.';
  }
  if (state === 'CHECK') {
    return 'Stage: Check prepared. Next step: Cashier issues the check advice and closes the case.';
  }
  if (state === 'CLOSED') {
    return 'This case is fully closed. No further actions are required.';
  }
  return null;
}

export function getStateVariant(
  state: string,
): 'completed' | 'cancelled' | 'pending' | 'info' | 'warning' {
  if (state === 'CLOSED') return 'completed';
  if (['DRAFT', 'POSTING'].includes(state)) return 'pending';
  if (['ORS', 'DV', 'CHECK'].includes(state)) return 'warning';
  return 'info';
}


