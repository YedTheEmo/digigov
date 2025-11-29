import { faker } from '@faker-js/faker';
import type { Check } from '@/generated/prisma';

export function createCheck(overrides?: Partial<Check>): Check {
  return {
    id: faker.string.uuid(),
    caseId: overrides?.caseId || faker.string.uuid(),
    checkNumber: overrides?.checkNumber || faker.string.alphanumeric(10),
    preparedAt: overrides?.preparedAt || faker.date.recent(),
    approvedAt: overrides?.approvedAt || null,
    approvedBy: overrides?.approvedBy || null,
    ...overrides,
  } as Check;
}

