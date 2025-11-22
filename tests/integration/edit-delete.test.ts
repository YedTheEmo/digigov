import { prisma } from '@/lib/prisma';
import { validateEdit, validateDelete } from '@/lib/workflows/workflowMutations';

// Integration Test Suite for Edit/Delete
// Run with: npx tsx tests/integration/edit-delete.test.ts

async function runTests() {
  console.log('Starting Edit/Delete Integration Tests...');
  
  // Setup: Create a test case
  const testCase = await prisma.procurementCase.create({
    data: {
      title: 'Integration Test Case',
      method: 'SMALL_VALUE_RFQ',
      currentState: 'ORS',
    }
  });
  
  console.log(`Created test case: ${testCase.id}`);

  try {
    // 1. Create Downstream Data (DV) to lock ORS
    await prisma.oRS.create({
      data: { caseId: testCase.id, orsNumber: 'ORS-TEST-001' }
    });
    
    await prisma.dV.create({
      data: { caseId: testCase.id, dvNumber: 'DV-TEST-001' }
    });
    
    await prisma.procurementCase.update({
      where: { id: testCase.id },
      data: { currentState: 'DV' }
    });
    
    console.log('Setup complete: ORS and DV created. State is DV.');

    // 2. Test Blocked Edit (Budget Manager tries to edit ORS when DV exists)
    console.log('Test 1: Blocked Edit...');
    const validation1 = await validateEdit(testCase.id, 'ors', 'BUDGET_MANAGER');
    if (!validation1.allowed && validation1.reason?.includes('downstream data exists')) {
      console.log('✅ Blocked edit correctly');
    } else {
      console.error('❌ Failed to block edit:', validation1);
    }

    // 3. Test Allowed Edit with Override (Admin)
    console.log('Test 2: Admin Override Edit...');
    const validation2 = await validateEdit(testCase.id, 'ors', 'ADMIN');
    if (validation2.allowed && validation2.requiresOverride) {
      console.log('✅ Admin override allowed');
    } else {
      console.error('❌ Failed to detect override need:', validation2);
    }

    // 4. Test Blocked Delete
    console.log('Test 3: Blocked Delete...');
    const validation3 = await validateDelete(testCase.id, 'ors', 'BUDGET_MANAGER');
    if (!validation3.allowed) {
      console.log('✅ Blocked delete correctly');
    } else {
      console.error('❌ Failed to block delete');
    }

    // 5. Cleanup
    await prisma.dV.deleteMany({ where: { caseId: testCase.id } });
    await prisma.oRS.deleteMany({ where: { caseId: testCase.id } });
    await prisma.procurementCase.delete({ where: { id: testCase.id } });
    console.log('Cleanup complete.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (require.main === module) {
  runTests()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { runTests };


