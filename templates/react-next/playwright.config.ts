import { defineConfig, devices } from '@playwright/test';

// Playwright configuration for React/Next.js projects.
// Covers two layers:
//   1. Component testing — @playwright/experimental-ct-react
//   2. End-to-end — full pages in real browsers
//
// Same tests can be reused as synthetic monitoring in production
// (Checkly, Datadog Synthetics) — see shift-left-shift-right.md in references.

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.e2e.ts', '**/*.e2e.tsx'],

  fullyParallel: true,
  forbidOnly: !!process.env['CI'],

  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,

  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never' }]]
    : 'html',

  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env['CI'] ? 'retain-on-failure' : 'off',

    // Freeze animations for deterministic visual regression
    launchOptions: {
      args: ['--force-prefers-reduced-motion'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // SANITY tests must fail — they prove the test infrastructure detects regressions.
  // Run with: `npx playwright test --grep "SANITY"` — every test must FAIL.
  // See references/self-testing-docs.md for the negative test pattern.

  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },

  // Local dev server (skipped in CI — assume separate build job)
  webServer: process.env['CI']
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
