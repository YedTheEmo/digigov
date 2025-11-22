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

  // Reporting Fixtures
  const admin = await prisma.user.findUnique({ where: { email: 'admin@local' } });
  if (admin) {
    // 1. Completed Case (Closed)
    const case1 = await prisma.procurementCase.create({
      data: {
        title: 'Supply of Office Laptops (Report Test)',
        method: 'SMALL_VALUE_RFQ',
        abc: 500000,
        currentState: 'CLOSED',
        createdById: admin.id,
        rfq: {
          create: { issuedAt: new Date('2025-01-15') }
        },
        quotations: {
          create: [
            { supplierName: 'Tech Corp', amount: 480000, isResponsive: true },
            { supplierName: 'Expensive IT', amount: 550000, isResponsive: false }
          ]
        },
        abstract: { create: {} },
        bacResolution: { create: {} },
        award: { create: { noticeDate: new Date('2025-02-01'), awardedTo: 'Tech Corp' } },
        purchaseOrder: { create: { approvedAt: new Date('2025-02-05') } },
        contract: { create: { signedAt: new Date('2025-02-10') } },
        ntp: { create: { issuedAt: new Date('2025-02-12') } },
        deliveries: { create: { deliveredAt: new Date('2025-02-20') } },
        inspection: { create: { inspectedAt: new Date('2025-02-21'), status: 'PASSED' } },
        acceptance: { create: { acceptedAt: new Date('2025-02-22') } },
        ors: { create: { orsNumber: 'ORS-2025-001', preparedAt: new Date('2025-02-25') } },
        dv: { create: { dvNumber: 'DV-2025-001', preparedAt: new Date('2025-02-28') } },
        check: { create: { checkNumber: 'CHK-001', approvedAt: new Date('2025-03-05') } }
      }
    });
    console.log('Seeded Completed Case:', case1.title);

    // 2. Pending Payment Case (Overdue DV)
    const case2 = await prisma.procurementCase.create({
      data: {
        title: 'Construction of Walkway (Report Test)',
        method: 'INFRASTRUCTURE',
        abc: 1500000,
        currentState: 'DV',
        createdById: admin.id,
        ors: { create: { orsNumber: 'ORS-2025-002', preparedAt: new Date(Date.now() - 1000 * 3600 * 24 * 15) } }, // 15 days ago
        dv: { create: { dvNumber: 'DV-2025-002', preparedAt: new Date(Date.now() - 1000 * 3600 * 24 * 10) } }, // 10 days ago (Overdue)
      }
    });
    console.log('Seeded Overdue DV Case:', case2.title);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
