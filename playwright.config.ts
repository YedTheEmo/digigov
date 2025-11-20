import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/ui',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  // Run tests sequentially by default to avoid database contention
  // Set PLAYWRIGHT_WORKERS env var to override (e.g., PLAYWRIGHT_WORKERS=2 npm run test:ui)
  fullyParallel: false,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Run sequentially by default (1 worker) to prevent database contention
  // Can be overridden with PLAYWRIGHT_WORKERS env var for faster execution when needed
  workers: process.env.PLAYWRIGHT_WORKERS ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10) : 1,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});


