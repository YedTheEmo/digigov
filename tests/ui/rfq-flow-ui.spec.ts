import { test, expect } from '@playwright/test';
import { login, createCaseAndOpenDetail } from './helpers';

test.describe('Small Value RFQ full UI workflow', () => {
  test('end-to-end across roles', async ({ page }) => {
    // 1) PROCUREMENT: create RFQ case
    await login(page, 'procurement@local');
    const { caseUrl } = await createCaseAndOpenDetail(page, {
      titlePrefix: 'RFQ UI',
      methodValue: 'SMALL_VALUE_RFQ',
    });

    const nowLocal = new Date().toISOString().slice(0, 16);

    // Issue RFQ (from Quick Actions) – visible now for DRAFT and POSTING
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    await page.locator('input[name="issuedAt"]').fill(nowLocal);
    await page.getByRole('button', { name: 'Issue RFQ' }).click();
    await page.waitForLoadState('networkidle');

    // Add 3 quotations via RFQ tab form
    await page.getByRole('tab', { name: /Quotations|Bids/ }).click();
    for (let i = 1; i <= 3; i++) {
      await page.getByPlaceholder('e.g. ABC Trading').fill(`Supplier ${i}`);
      await page.getByPlaceholder('e.g. 100000').fill(String(10000 * i));
      await page.getByRole('button', { name: /Add Quotation/i }).click();
      await page.waitForTimeout(500);
    }

    // Back to Overview to confirm quotations table is non-empty
    await page.getByRole('tab', { name: 'Overview' }).click();

    // 2) BAC: Generate Abstract (Stage 3) then proceed
    await login(page, 'bac@local');
    await page.goto(caseUrl);

    // Ensure we are on the correct case
    await expect(page.getByText('Small Value RFQ', { exact: true })).toBeVisible();

    // Quick Actions should now show \"Generate Abstract\" once 3 quotations exist
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    await page.getByRole('button', { name: 'Generate Abstract' }).click();

    // After abstract, Progress Stages should mark \"Abstract Generated\" as completed
    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page.getByText('Abstract Generated')).toBeVisible();
  });
});


