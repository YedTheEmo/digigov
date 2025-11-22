import type { UserRole } from '@/generated/prisma';

export function logOverrideAlert(
  actionType: 'UPDATE' | 'DELETE',
  entity: string,
  caseId: string,
  user: { id: string; name?: string | null; role: UserRole },
  reason: string
) {
  // In a real system, this would send an email or Slack notification
  // For now, we log to console with a specific prefix that monitoring tools can pick up
  console.warn(
    `[ADMIN OVERRIDE ALERT] User ${user.name} (${user.role}) performed ${actionType} on ${entity} for Case ${caseId}. Reason: ${reason}`
  );
}


