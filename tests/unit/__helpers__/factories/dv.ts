import { faker } from '@faker-js/faker';
import type { DV } from '@/generated/prisma';

export function createDV(overrides?: Partial<DV>): DV {
  return {
    id: faker.string.uuid(),
    caseId: overrides?.caseId || faker.string.uuid(),
    dvNumber: overrides?.dvNumber || faker.string.alphanumeric(10),
    preparedAt: overrides?.preparedAt || faker.date.recent(),
    approvedAt: overrides?.approvedAt || null,
    approvedBy: overrides?.approvedBy || null,
    ...overrides,
  } as DV;
}

