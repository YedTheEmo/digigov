import { faker } from '@faker-js/faker';
import type {
  ProcurementCase,
  ProcurementMethod,
  CaseState,
  Regime,
} from '@/generated/prisma';

export function createProcurementCase(
  overrides?: Partial<ProcurementCase>,
): ProcurementCase {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    method: (overrides?.method || 'SMALL_VALUE_RFQ') as ProcurementMethod,
    regime: (overrides?.regime || 'RA9184') as Regime,
    abc: overrides?.abc || faker.number.float({ min: 1000, max: 1000000, fractionDigits: 2 }),
    currentState: (overrides?.currentState || 'DRAFT') as CaseState,
    endUserUnit: overrides?.endUserUnit || faker.company.name(),
    postingStartAt: overrides?.postingStartAt || null,
    postingEndAt: overrides?.postingEndAt || null,
    deliveryDueAt: overrides?.deliveryDueAt || null,
    createdById: overrides?.createdById || null,
    createdAt: overrides?.createdAt || faker.date.past(),
    updatedAt: overrides?.updatedAt || faker.date.recent(),
    ...overrides,
  } as ProcurementCase;
}

