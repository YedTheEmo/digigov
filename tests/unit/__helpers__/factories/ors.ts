import { faker } from '@faker-js/faker';
import type { ORS } from '@/generated/prisma';

export function createORS(overrides?: Partial<ORS>): ORS {
  return {
    id: faker.string.uuid(),
    caseId: overrides?.caseId || faker.string.uuid(),
    orsNumber: overrides?.orsNumber || faker.string.alphanumeric(10),
    preparedAt: overrides?.preparedAt || faker.date.recent(),
    approvedAt: overrides?.approvedAt || null,
    approvedBy: overrides?.approvedBy || null,
    ...overrides,
  } as ORS;
}

