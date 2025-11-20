import { test, expect } from '@playwright/test';

async function loginAsProcurement(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('procurement@local');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/procurement');
}

test.describe('Procurement case detail', () => {
  test('can create case and open detail view', async ({ page }) => {
    await loginAsProcurement(page);

    // Create a new case
    const title = `Playwright Case ${Date.now()}`;
    await page.getByLabel('Case Title').fill(title);
    await page.getByLabel('Procurement Method').selectOption('SMALL_VALUE_RFQ');
    await page.getByRole('button', { name: 'Create Case' }).click();

    // Click the case row that matches our newly created title
    await page.getByRole('link', { name: new RegExp(title) }).first().click();

    await expect(page).toHaveURL(/\/procurement\/.+/);
    await expect(
      page.getByRole('heading', { level: 1, name: title }),
    ).toBeVisible();

    // Switch between tabs to ensure they render without client errors
    await page.getByRole('tab', { name: 'Overview' }).click();
    await page.getByRole('tab', { name: 'Timeline' }).click();
    await page.getByRole('tab', { name: /Quotations|Bids/ }).click();
    await page.getByRole('tab', { name: 'Attachments' }).click();
  });
});


