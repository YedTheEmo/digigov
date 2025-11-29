import { faker } from '@faker-js/faker';
import type { RFQ } from '@/generated/prisma';

export function createRFQ(overrides?: Partial<RFQ>): RFQ {
  return {
    id: faker.string.uuid(),
    caseId: overrides?.caseId || faker.string.uuid(),
    rfqNumber: overrides?.rfqNumber || faker.string.alphanumeric(10),
    issuedAt: overrides?.issuedAt || faker.date.recent(),
    ...overrides,
  } as RFQ;
}

