import { test, expect } from '@playwright/test';
import { login, createCaseAndOpenDetail, waitForCaseState } from './helpers';

test.describe('Infrastructure full UI workflow', () => {
  // Run this test suite sequentially to avoid database contention
  test.describe.configure({ mode: 'serial' });
  
  test('end-to-end across roles', async ({ page }) => {
    test.setTimeout(180_000);
    // 1) PROCUREMENT: create Infra case and posting
    await login(page, 'procurement@local');
    const { caseUrl, caseId } = await createCaseAndOpenDetail(page, {
      titlePrefix: 'INFRA UI',
      methodValue: 'INFRASTRUCTURE',
    });

    const nowLocal = new Date().toISOString().slice(0, 16);

    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();

    await page.locator('input[name="postingStartAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Start Posting' }).click();
    // Wait for state to change to POSTING
    await expect(page.getByTestId('case-current-state')).toContainText('POSTING');

    // 2) BAC/TWG: bidding pieces (reuse public bidding style path)
    await login(page, 'bac@local');
    await page.goto(caseUrl);
    // Ensure the actions section is visible and button is available
    await expect(page.getByRole('heading', { name: 'Infrastructure Actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record Bid Bulletin' })).toBeVisible();

    await page.locator('input[name="number"]').fill('1');
    await page.locator('input[name="publishedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Record Bid Bulletin' }).click();
    await expect(page.getByRole('button', { name: 'Record Pre-Bid Conf' })).toBeVisible();

    await page.locator('input[name="scheduledAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Record Pre-Bid Conf' }).click();
    await expect(page.getByRole('button', { name: 'Record Bid', exact: true })).toBeVisible();

    await page.locator('input[name="bidderName"]').fill('Infra Corp');
    await page.locator('input[name="amount"]').fill('2000000');
    await page.locator('input[name="openedAt"]').fill(nowLocal);
    
    // Submit bid form and wait for page update
    await page.getByRole('button', { name: 'Record Bid', exact: true }).click();
    await waitForCaseState(page, caseId, 'BID_SUBMISSION_OPENING');

    await login(page, 'twg@local');
    await page.goto(caseUrl);
    await page.getByRole('button', { name: 'Record TWG Evaluation' }).click();
    // Wait for state to change to TWG_EVALUATION
    await waitForCaseState(page, caseId, 'TWG_EVALUATION');

    await login(page, 'bac@local');
    await page.goto(caseUrl);
    // Ensure the Post-Qualification button is visible before interacting
    await expect(page.getByRole('button', { name: 'Record Post-Qualification' })).toBeVisible();
    await page.locator('input[name="lowestResponsiveBidder"]').fill('Infra Corp');
    await page.locator('select[name="passed"]').selectOption('true');
    await page.locator('input[name="completedAt"]').fill(nowLocal);
    
    // Submit post-qualification form and wait for page update
    await page.getByRole('button', { name: 'Record Post-Qualification' }).click();
    await waitForCaseState(page, caseId, 'POST_QUALIFICATION');
    
    // Now check for BAC Resolution button
    await expect(page.getByRole('button', { name: 'Record BAC Resolution' })).toBeVisible();

    await page.locator('input[name="notes"]').fill('Recommend award');
    await page.getByRole('button', { name: 'Record BAC Resolution' }).click();
    await expect(page.getByRole('button', { name: 'Award' })).toBeVisible();

    // 3) APPROVER + PROCUREMENT: award/PO/contract/NTP
    await login(page, 'approver@local');
    await page.goto(caseUrl);
    await page.locator('input[name="awardedTo"]').fill('Infra Supplier');
    await page.locator('input[name="noticeDate"]').fill(nowLocal);
    
    // Submit award form and wait for page update
    await page.getByRole('button', { name: 'Award' }).click();
    await waitForCaseState(page, caseId, 'AWARDED');
    
    // Now check for Approve PO button
    await expect(page.getByRole('button', { name: 'Approve PO' })).toBeVisible();

    await page.locator('input[name="poNo"]').fill(`PO-INFRA-${Date.now()}`);
    await page.getByRole('button', { name: 'Approve PO' }).click();
    await waitForCaseState(page, caseId, 'PO_APPROVED');

    await login(page, 'procurement@local');
    await page.goto(caseUrl);
    await expect(page.getByRole('button', { name: 'Sign Contract' })).toBeVisible();
    await page.locator('input[name="contractNo"]').fill(`CT-INFRA-${Date.now()}`);
    await page.locator('input[name="signedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Sign Contract' }).click();
    await waitForCaseState(page, caseId, 'CONTRACT_SIGNED');
    await expect(page.getByRole('button', { name: 'Issue NTP' })).toBeVisible();

    await page.locator('input[name="issuedAt"]').fill(nowLocal);
    await page.locator('input[name="daysToComply"]').fill('30');
    await page.getByRole('button', { name: 'Issue NTP' }).click();
    await waitForCaseState(page, caseId, 'NTP_ISSUED');
    await expect(page.getByRole('button', { name: 'Record Progress Billing' })).toBeVisible();

    // 4) PROCUREMENT: Progress Billing & PMT inspection (in infra card)
    await page.locator('input[name="billingNo"]').fill(`PB-${Date.now()}`);
    await page.locator('input[name="amount"]').fill('500000');
    await page.locator('input[name="billedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Record Progress Billing' }).click();
    await waitForCaseState(page, caseId, 'PROGRESS_BILLING');
    await expect(page.getByRole('button', { name: 'Record PMT Inspection' })).toBeVisible();

    await page.locator('select[name="status"]').selectOption('PASSED');
    await page.locator('input[name="inspector"]').fill('PMT');
    await page.locator('input[name="inspectedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Record PMT Inspection' }).click();
    await waitForCaseState(page, caseId, 'PMT_INSPECTION');
    
    // Login as supply user to access supply workflow actions
    await login(page, 'supply@local');
    await page.goto('/supply');
    await expect(page.getByRole('heading', { name: 'Supply Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();

    // Final sanity: timeline tab visible & case detail reachable from procurement view
    await page.goto(caseUrl);
    await expect(page.getByRole('tab', { name: 'Timeline' })).toBeVisible();
  });
});


