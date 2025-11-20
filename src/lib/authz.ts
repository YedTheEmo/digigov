import { auth } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';
import type { User, UserRole } from '@/generated/prisma';

export async function ensureRole(allowed: UserRole[]) {
  const session = await auth();
  if (!session?.user?.email) return { ok: false as const, status: 401 as const };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { ok: false as const, status: 401 as const };
  if (!allowed.includes(user.role)) return { ok: false as const, status: 403 as const };
  return { ok: true as const, user } as { ok: true; user: User };
}



