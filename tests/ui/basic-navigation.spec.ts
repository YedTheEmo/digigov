import { test, expect } from '@playwright/test';

async function loginAsAdmin(baseURL: string, page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('admin@local');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/procurement');
  // Basic sanity check that dashboard loaded
  await expect(
    page.getByRole('heading', { level: 1, name: 'Procurement Cases' }),
  ).toBeVisible();
}

test.describe('Dashboard navigation', () => {
  test('main sections are reachable', async ({ page, baseURL }) => {
    await loginAsAdmin(baseURL!, page);

    const routes = [
      '/procurement',
      '/supply',
      '/budget',
      '/accounting',
      '/cashier',
      '/logs',
      '/search',
      '/admin',
    ];

    for (const route of routes) {
      await page.goto(route);
      // Ensure page rendered without obvious error banner
      await expect(page.getByRole('main')).toBeVisible();
    }
  });
});


