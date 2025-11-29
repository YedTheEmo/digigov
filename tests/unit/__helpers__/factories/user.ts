import { faker } from '@faker-js/faker';
import type { User, UserRole, Section } from '@/generated/prisma';

export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    emailVerified: overrides?.emailVerified || null,
    image: overrides?.image || null,
    hashedPassword: overrides?.hashedPassword || faker.string.alphanumeric(60),
    role: (overrides?.role || 'PROCUREMENT_MANAGER') as UserRole,
    section: (overrides?.section || null) as Section | null,
    createdAt: overrides?.createdAt || faker.date.past(),
    updatedAt: overrides?.updatedAt || faker.date.recent(),
    ...overrides,
  } as User;
}

