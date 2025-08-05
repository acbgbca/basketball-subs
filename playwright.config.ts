import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ] : [
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure', // Save trace on test failure
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'android-phone',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minute timeout for server startup
  },
});