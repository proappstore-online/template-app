import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/marketing-browser',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  globalSetup: './tests/marketing-browser/build.mjs',
  use: { javaScriptEnabled: false, serviceWorkers: 'block', screenshot: 'only-on-failure', ignoreHTTPSErrors: true, proxy: { server: 'http://127.0.0.1:4197' } },
  projects: ['chromium', 'webkit'].flatMap((browserName) => [320, 390].map((width) => ({
    name: `${browserName}-${width}`,
    use: { browserName: browserName as 'chromium' | 'webkit', viewport: { width, height: 844 } },
  }))),
})
