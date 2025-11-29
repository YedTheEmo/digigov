import { vi } from 'vitest';
import type { Session, User } from 'next-auth';

/**
 * Creates a mock NextAuth session
 */
export function createMockSession(
  overrides?: Partial<Session>,
): Session {
  return {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock user for NextAuth
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
}

/**
 * Mocks the auth() function from @/lib/nextauth
 * Usage: mockAuth(session) in your test
 */
export function mockAuth(session: Session | null = null) {
  const mockAuthFn = vi.fn().mockResolvedValue(session);
  vi.mock('@/lib/nextauth', () => ({
    auth: mockAuthFn,
    authOptions: {},
  }));
  return mockAuthFn;
}

/**
 * Mocks getServerSession for API route testing
 */
export function mockGetServerSession(session: Session | null = null) {
  const mockGetServerSession = vi.fn().mockResolvedValue(session);
  vi.mock('next-auth', () => ({
    getServerSession: mockGetServerSession,
  }));
  return mockGetServerSession;
}

