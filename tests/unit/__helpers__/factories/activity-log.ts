import { faker } from '@faker-js/faker';
import type {
  ActivityLog,
  CaseState,
  ChangeType,
  UserRole,
} from '@/generated/prisma';

export function createActivityLog(overrides?: Partial<ActivityLog>): ActivityLog {
  return {
    id: faker.string.uuid(),
    caseId: overrides?.caseId || faker.string.uuid(),
    actorId: overrides?.actorId || null,
    action: overrides?.action || faker.lorem.word(),
    fromState: (overrides?.fromState || null) as CaseState | null,
    toState: (overrides?.toState || null) as CaseState | null,
    legalBasis: overrides?.legalBasis || null,
    payload: overrides?.payload || null,
    changeType: (overrides?.changeType || 'TRANSITION') as ChangeType,
    entity: overrides?.entity || null,
    entityId: overrides?.entityId || null,
    before: overrides?.before || null,
    after: overrides?.after || null,
    reason: overrides?.reason || null,
    performedByRole: (overrides?.performedByRole || null) as UserRole | null,
    isOverride: overrides?.isOverride ?? false,
    createdAt: overrides?.createdAt || faker.date.recent(),
    ...overrides,
  } as ActivityLog;
}

