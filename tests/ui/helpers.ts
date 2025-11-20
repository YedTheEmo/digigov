import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string) {
  // Clear all cookies to ensure clean authentication state
  // This prevents session conflicts when switching between users during tests
  await page.context().clearCookies();
  
  // Always start from login page to ensure clean state
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('Password123!');
  
  // Click sign in button and wait for it to complete (button should stop loading)
  // The login page uses signIn with redirect: false, which is async
  const signInButton = page.getByRole('button', { name: 'Sign in' });
  await signInButton.click();
  
  // Wait for the signIn to complete by checking:
  // 1. Navigation happens (signIn succeeded and navigation started) - most common success case
  // 2. Error message appears (signIn failed)
  // 3. Button stops being disabled/loading (signIn completed, but navigation might be delayed)
  const navigationPromise = page.waitForURL(/\/procurement/, { timeout: 20000 }).catch(() => null);
  // Check for error messages - look for red error divs or error text
  const errorPromise = Promise.race([
    page.waitForSelector('[class*="border-red"]', { timeout: 15000 }).catch(() => null),
    page.getByText(/Invalid credentials|An error occurred/i).waitFor({ timeout: 15000 }).catch(() => null),
  ]).then(() => 'error').catch(() => null);
  
  // Wait for button to stop loading (signIn completed)
  // The button will be disabled while loading, so wait for it to be enabled again
  const buttonEnabledPromise = page.waitForFunction(
    () => {
      const btn = document.querySelector('button[type="submit"]');
      return btn && !btn.hasAttribute('disabled');
    },
    { timeout: 20000 }
  ).catch(() => null);
  
  // Race between navigation, error, or button enabled
  const result = await Promise.race([
    navigationPromise.then(() => 'navigation'),
    errorPromise.then(() => 'error'),
    buttonEnabledPromise.then(() => 'completed'),
  ]).catch(() => 'timeout');
  
  // Check if we navigated successfully
  const currentUrl = page.url();
  if (currentUrl.includes('/procurement') || result === 'navigation') {
    // Navigation succeeded, verify we're on the dashboard
    await expect(page.getByRole('link', { name: 'Procurement' })).toBeVisible({ timeout: 15000 });
    return;
  }
  
  // Check if there's an error message
  if (result === 'error') {
    const errorText = await page.locator('[class*="border-red"]').first().textContent().catch(() => 'Unknown error');
    throw new Error(`Login failed with error: ${errorText}`);
  }
  
  // Also check for error elements even if result wasn't 'error'
  const errorElement = await page.locator('[class*="border-red"]').first().isVisible().catch(() => false);
  if (errorElement) {
    const errorText = await page.locator('[class*="border-red"]').first().textContent().catch(() => 'Unknown error');
    throw new Error(`Login failed with error: ${errorText}`);
  }
  
  // If still on login page, wait a bit more for navigation
  if (currentUrl.includes('/login')) {
    try {
      await page.waitForURL(/\/procurement/, { timeout: 10000 });
      await expect(page.getByRole('link', { name: 'Procurement' })).toBeVisible({ timeout: 10000 });
      return;
    } catch {
      throw new Error('Login failed - still on login page after waiting for signIn to complete');
    }
  }
  
  // If we're somewhere else, navigate to procurement
  await page.goto('/procurement', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: 'Procurement' })).toBeVisible({ timeout: 15000 });
}

export async function createCaseAndOpenDetail(
  page: Page,
  {
    titlePrefix,
    methodValue,
  }: { titlePrefix: string; methodValue: 'SMALL_VALUE_RFQ' | 'PUBLIC_BIDDING' | 'INFRASTRUCTURE' },
) {
  // Use high-resolution timestamp + random component for better uniqueness in parallel tests
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const title = `${titlePrefix} ${uniqueId}`;
  await page.getByLabel('Case Title').fill(title);
  await page.getByLabel('Procurement Method').selectOption(methodValue);
  await page.getByRole('button', { name: 'Create Case' }).click();

  // Click the case row that matches our title (robust against other tests creating cases)
  await page.getByRole('link', { name: new RegExp(title) }).first().click();
  await expect(page).toHaveURL(/\/procurement\/.+/);

  const caseUrl = page.url();
  const caseId = caseUrl.split('/').pop() as string;

  return { title, caseUrl, caseId };
}

async function fetchCaseState(page: Page, caseId: string) {
  const response = await page.request.get(`/api/cases?query=${caseId}`);
  if (!response.ok()) {
    throw new Error(`Failed to fetch case state (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as Array<{ id: string; currentState: string }>;
  const match = data.find((c) => c.id === caseId);
  if (!match) {
    throw new Error(`Case ${caseId} not found in cases API response.`);
  }

  return match.currentState;
}

type WaitForCaseStateOptions = {
  timeout?: number;
  pollInterval?: number;
  reload?: boolean;
};

export async function waitForCaseState(
  page: Page,
  caseId: string,
  state: string,
  { timeout = 45_000, pollInterval = 1_500, reload = true }: WaitForCaseStateOptions = {},
) {
  const start = Date.now();
  let lastBackendState = '';
  let lastError: unknown;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  while (Date.now() - start < timeout) {
    try {
      lastBackendState = await fetchCaseState(page, caseId);
      consecutiveErrors = 0; // Reset error counter on success
      
      if (lastBackendState === state) {
        // Backend state matches, verify UI matches
        await expect(page.getByTestId('case-current-state')).toContainText(state, {
          timeout: Math.min(pollInterval, 5_000),
        });
        return;
      }
    } catch (error) {
      consecutiveErrors++;
      lastError = error;
      
      // If we get too many consecutive errors, wait a bit longer before retrying
      if (consecutiveErrors >= maxConsecutiveErrors) {
        await page.waitForTimeout(pollInterval * 2);
        consecutiveErrors = 0;
      }
    }

    // Also check UI directly in case backend is slow to update
    try {
      await expect(page.getByTestId('case-current-state')).toContainText(state, {
        timeout: Math.min(pollInterval, 2_000),
      });
      return;
    } catch (error) {
      // UI doesn't match yet, continue polling
      lastError = error;
    }

    if (reload) {
      await page.reload({ waitUntil: 'domcontentloaded' });
    }

    await page.waitForTimeout(pollInterval);
  }

  throw new Error(
    `Timed out after ${timeout}ms waiting for case state "${state}". Backend="${lastBackendState}". Last error: ${lastError}`,
  );
}

