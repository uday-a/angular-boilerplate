import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env['BASE_URL'] || 'http://localhost:4201',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env['BASE_URL']
    ? undefined
    : [
        {
          command: 'npm run dev:api',
          url: 'http://localhost:4202/api/ping',
          reuseExistingServer: true,
          timeout: 60 * 1000,
        },
        {
          command: 'npm run dev:web',
          url: 'http://localhost:4201',
          reuseExistingServer: true,
          timeout: 180 * 1000,
        },
      ],
})
