import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureRole } from '@/lib/authz';
import { auth } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';
import { createUser } from '../__helpers__/factories';
import type { UserRole } from '@/generated/prisma';

vi.mock('@/lib/nextauth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('authz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access when user has required role', async () => {
    const user = createUser({ role: 'ADMIN' });
    vi.mocked(auth).mockResolvedValue({
      user: { email: user.email },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const result = await ensureRole(['ADMIN', 'PROCUREMENT_MANAGER'] as UserRole[]);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toEqual(user);
    }
  });

  it('blocks access when user lacks required role', async () => {
    const user = createUser({ role: 'BUDGET_MANAGER' });
    vi.mocked(auth).mockResolvedValue({
      user: { email: user.email },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const result = await ensureRole(['ADMIN', 'PROCUREMENT_MANAGER'] as UserRole[]);
    
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  it('returns 401 when no session', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const result = await ensureRole(['ADMIN'] as UserRole[]);
    
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 when session has no email', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {},
    } as any);

    const result = await ensureRole(['ADMIN'] as UserRole[]);
    
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 when user not found in database', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await ensureRole(['ADMIN'] as UserRole[]);
    
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('allows access when user has one of multiple allowed roles', async () => {
    const user = createUser({ role: 'PROCUREMENT_MANAGER' });
    vi.mocked(auth).mockResolvedValue({
      user: { email: user.email },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const result = await ensureRole(['ADMIN', 'PROCUREMENT_MANAGER', 'BAC_SECRETARIAT'] as UserRole[]);
    
    expect(result.ok).toBe(true);
  });
});

