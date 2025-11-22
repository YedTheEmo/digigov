import { prisma } from '@/lib/prisma';
import type { CaseState, Prisma, ChangeType, UserRole } from '@/generated/prisma';

export async function logActivity(params: {
  caseId: string;
  action: string;
  fromState?: CaseState | null;
  toState?: CaseState | null;
  legalBasis?: string | null;
  payload?: unknown;
  actorId?: string | null;
  // New fields
  changeType?: ChangeType;
  entity?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  performedByRole?: UserRole | null;
  isOverride?: boolean;
}) {
  const {
    caseId,
    action,
    fromState = null,
    toState = null,
    legalBasis = null,
    payload = null,
    actorId = null,
    changeType = 'TRANSITION',
    entity = null,
    entityId = null,
    before = null,
    after = null,
    reason = null,
    performedByRole = null,
    isOverride = false,
  } = params;

  await prisma.activityLog.create({
    data: {
      caseId,
      action,
      fromState,
      toState,
      legalBasis,
      payload: payload ? (payload as Prisma.InputJsonValue) : undefined,
      actorId: actorId ?? undefined,
      changeType,
      entity,
      entityId,
      before: before ? (before as Prisma.InputJsonValue) : undefined,
      after: after ? (after as Prisma.InputJsonValue) : undefined,
      reason,
      performedByRole: performedByRole ?? undefined,
      isOverride,
    },
  });
}

export async function logEdit(params: {
  caseId: string;
  entity: string;
  entityId?: string;
  before: unknown;
  after: unknown;
  reason?: string | null;
  actorId?: string | null;
  role?: UserRole | null;
  isOverride?: boolean;
}) {
  await logActivity({
    caseId: params.caseId,
    action: `update_${params.entity.toLowerCase()}`,
    changeType: 'UPDATE',
    entity: params.entity,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
    reason: params.reason,
    actorId: params.actorId,
    performedByRole: params.role,
    isOverride: params.isOverride,
  });
}

export async function logDelete(params: {
  caseId: string;
  entity: string;
  entityId?: string;
  before: unknown; // Snapshot of what was deleted
  reason: string; // Reason is required for delete usually, but we'll handle null
  actorId?: string | null;
  role?: UserRole | null;
  isOverride?: boolean;
  fromState?: CaseState | null; // If delete causes state rollback
  toState?: CaseState | null;
}) {
  await logActivity({
    caseId: params.caseId,
    action: `delete_${params.entity.toLowerCase()}`,
    changeType: 'DELETE',
    entity: params.entity,
    entityId: params.entityId,
    before: params.before,
    reason: params.reason,
    actorId: params.actorId,
    performedByRole: params.role,
    isOverride: params.isOverride,
    fromState: params.fromState,
    toState: params.toState,
  });
}
