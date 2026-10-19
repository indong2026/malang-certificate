import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests', fullyParallel: true, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:4173', channel: process.env.CI ? undefined : 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1100 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: process.env.CI ? undefined : 'chrome' } },
  ],
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
})
