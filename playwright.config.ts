import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  expect: { timeout: 10000 },
  workers: 2,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4196', serviceWorkers: 'block', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } } },
  ],
  webServer: {
    command: 'pnpm --filter @APPNAME/web build && pnpm --filter @APPNAME/web preview --host 127.0.0.1 --port 4196 --strictPort',
    url: 'http://127.0.0.1:4196',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
