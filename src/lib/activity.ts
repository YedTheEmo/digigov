import { prisma } from '@/lib/prisma';
import type { CaseState, Prisma } from '@/generated/prisma';

export async function logActivity(params: {
  caseId: string;
  action: string;
  fromState?: CaseState | null;
  toState?: CaseState | null;
  legalBasis?: string | null;
  payload?: unknown;
  actorId?: string | null;
}) {
  const { caseId, action, fromState = null, toState = null, legalBasis = null, payload = null, actorId = null } = params;
  await prisma.activityLog.create({
    data: {
      caseId,
      action,
      fromState,
      toState,
      legalBasis,
      payload: payload ? (payload as Prisma.InputJsonValue) : undefined,
      actorId: actorId ?? undefined,
    },
  });
}


