import { PrismaClient } from '@/generated/prisma';

// Ensure a single PrismaClient instance across hot reloads in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({});

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}


