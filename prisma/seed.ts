import { PrismaClient, UserRole } from '../src/generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('Password123!', 10);

  // Prebuilt accounts per section manager and approver
  const users = [
    { email: 'admin@local', name: 'Admin', role: 'ADMIN' },
    { email: 'procurement@local', name: 'Procurement Manager', role: 'PROCUREMENT_MANAGER' },
    { email: 'supply@local', name: 'Supply Manager', role: 'SUPPLY_MANAGER' },
    { email: 'budget@local', name: 'Budget Manager', role: 'BUDGET_MANAGER' },
    { email: 'accounting@local', name: 'Accounting Manager', role: 'ACCOUNTING_MANAGER' },
    { email: 'cashier@local', name: 'Cashier Manager', role: 'CASHIER_MANAGER' },
    { email: 'bac@local', name: 'BAC Secretariat', role: 'BAC_SECRETARIAT' },
    { email: 'twg@local', name: 'TWG Member', role: 'TWG_MEMBER' },
    { email: 'approver@local', name: 'Approver', role: 'APPROVER' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, role: u.role as UserRole, hashedPassword: password },
    });
  }

  console.log('Seeded users with default password: Password123!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


