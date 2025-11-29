import { faker } from '@faker-js/faker';
import type { Quotation } from '@/generated/prisma';

export function createQuotation(overrides?: Partial<Quotation>): Quotation {
  return {
    id: faker.string.uuid(),
    caseId: overrides?.caseId || faker.string.uuid(),
    supplierName: overrides?.supplierName || faker.company.name(),
    amount: overrides?.amount || faker.number.float({ min: 100, max: 100000, fractionDigits: 2 }),
    isResponsive: overrides?.isResponsive ?? true,
    submittedAt: overrides?.submittedAt || faker.date.recent(),
    ...overrides,
  } as Quotation;
}

