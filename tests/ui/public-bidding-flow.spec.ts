import { test, expect } from '@playwright/test';
import { login, createCaseAndOpenDetail, waitForCaseState } from './helpers';

test.describe('Public Bidding full UI workflow', () => {
  // Run this test suite sequentially to avoid database contention
  test.describe.configure({ mode: 'serial' });
  
  test('end-to-end across all roles', async ({ page }) => {
    test.setTimeout(180_000);
    // 1) PROCUREMENT: create case and start posting
    await login(page, 'procurement@local');
    const { caseUrl, caseId } = await createCaseAndOpenDetail(page, {
      titlePrefix: 'PB UI',
      methodValue: 'PUBLIC_BIDDING',
    });

    // Start Posting
    const nowLocal = new Date().toISOString().slice(0, 16);

    // Quick Actions card should render on case detail
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();

    await page.locator('input[name="postingStartAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Start Posting' }).click();
    // Wait for state to change to POSTING
    await expect(page.getByTestId('case-current-state')).toContainText('POSTING');

    // 2) BAC: Bid bulletin, pre-bid, bids
    await login(page, 'bac@local');
    await page.goto(caseUrl);

    // Ensure Public Bidding / Infrastructure actions section is visible
    await expect(
      page.getByRole('heading', { name: /Public Bidding Actions|Infrastructure Actions/ }),
    ).toBeVisible();
    // Ensure the button is available before interacting
    await expect(page.getByRole('button', { name: 'Record Bid Bulletin' })).toBeVisible();

    // Bid Bulletin
    await page.locator('input[name="number"]').fill('1');
    await page.locator('input[name="publishedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Record Bid Bulletin' }).click();
    await expect(page.getByRole('button', { name: 'Record Pre-Bid Conf' })).toBeVisible();

    // Pre-Bid Conference
    await page.locator('input[name="scheduledAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Record Pre-Bid Conf' }).click();
    await expect(page.getByRole('button', { name: 'Record Bid', exact: true })).toBeVisible();

    // Record Bid
    await page.locator('input[name="bidderName"]').fill('Acme Corp');
    await page.locator('input[name="amount"]').fill('1000000');
    await page.locator('input[name="openedAt"]').fill(nowLocal);
    
    // Submit bid form and wait for page update
    await page.getByRole('button', { name: 'Record Bid', exact: true }).click();
    await waitForCaseState(page, caseId, 'BID_SUBMISSION_OPENING');

    // 3) TWG: Evaluation
    await login(page, 'twg@local');
    await page.goto(caseUrl);
    await page.getByRole('button', { name: 'Record TWG Evaluation' }).click();
    // Wait for state to change to TWG_EVALUATION
    await waitForCaseState(page, caseId, 'TWG_EVALUATION');

    // 4) BAC: Post-Qualification & BAC Resolution
    await login(page, 'bac@local');
    await page.goto(caseUrl);
    // Ensure the Post-Qualification button is visible before interacting
    await expect(page.getByRole('button', { name: 'Record Post-Qualification' })).toBeVisible();

    // Post-Qualification
    await page.locator('input[name="lowestResponsiveBidder"]').fill('Acme Corp');
    await page.locator('select[name="passed"]').selectOption('true');
    await page.locator('input[name="completedAt"]').fill(nowLocal);
    
    // Submit post-qualification form and wait for page update
    await page.getByRole('button', { name: 'Record Post-Qualification' }).click();
    await waitForCaseState(page, caseId, 'POST_QUALIFICATION');
    
    // Now check for BAC Resolution button
    await expect(page.getByRole('button', { name: 'Record BAC Resolution' })).toBeVisible();

    // BAC Resolution
    await page.locator('input[name="notes"]').fill('Recommend award');
    await page.getByRole('button', { name: 'Record BAC Resolution' }).click();
    await expect(page.getByRole('button', { name: 'Award' })).toBeVisible();

    // 5) APPROVER: Award and PO
    await login(page, 'approver@local');
    await page.goto(caseUrl);

    // Award
    await page.locator('input[name="awardedTo"]').fill('Acme Corp');
    await page.locator('input[name="noticeDate"]').fill(nowLocal);
    
    // Submit award form and wait for page update
    await page.getByRole('button', { name: 'Award' }).click();
    await waitForCaseState(page, caseId, 'AWARDED');
    
    // Now check for Approve PO button
    await expect(page.getByRole('button', { name: 'Approve PO' })).toBeVisible();

    // PO Approval
    await page.locator('input[name="poNo"]').fill(`PO-${Date.now()}`);
    await page.getByRole('button', { name: 'Approve PO' }).click();
    await waitForCaseState(page, caseId, 'PO_APPROVED');

    // 6) PROCUREMENT: Contract & NTP
    await login(page, 'procurement@local');
    await page.goto(caseUrl);

    await expect(page.getByRole('button', { name: 'Sign Contract' })).toBeVisible();
    await page.locator('input[name="contractNo"]').fill(`CT-${Date.now()}`);
    await page.locator('input[name="signedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Sign Contract' }).click();
    await waitForCaseState(page, caseId, 'CONTRACT_SIGNED');
    await expect(page.getByRole('button', { name: 'Issue NTP' })).toBeVisible();

    await page.locator('input[name="issuedAt"]').fill(nowLocal);
    await page.locator('input[name="daysToComply"]').fill('30');
    await page.getByRole('button', { name: 'Issue NTP' }).click();
    await waitForCaseState(page, caseId, 'NTP_ISSUED');

    // 7) SUPPLY: Delivery, Inspection, Acceptance
    await login(page, 'supply@local');
    await page.goto(caseUrl);
    await expect(page.getByRole('button', { name: 'Record Delivery' })).toBeVisible();

    await page.locator('input[name="deliveredAt"]').fill(nowLocal);
    await page.locator('input[name="notes"]').fill('Delivered via UI flow');
    await page.getByRole('button', { name: 'Record Delivery' }).click();
    await expect(page.getByRole('button', { name: 'Record Inspection' })).toBeVisible();

    await page.locator('select[name="status"]').selectOption('PASSED');
    await page.locator('input[name="inspector"]').fill('COA/End-User');
    await page.locator('input[name="inspectedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Record Inspection' }).click();
    await expect(page.getByRole('button', { name: 'Record Acceptance' })).toBeVisible();

    await page.locator('input[name="acceptedAt"]').fill(nowLocal);
    await page.locator('input[name="officer"]').fill('Supply Officer');
    await page.getByRole('button', { name: 'Record Acceptance' }).click();
    // After acceptance, verify timeline is accessible
    await expect(page.getByRole('tab', { name: 'Timeline' })).toBeVisible();
    await page.getByRole('tab', { name: 'Timeline' }).click();
    await expect(page.locator('[class*="Activity Timeline"]')).toBeTruthy();
  });
});


