import { defineConfig, devices } from '@playwright/test';

/**
 * Environment-aware Playwright config.
 *
 * Usage:
 *   TEST_ENV=local      npm run test:e2e          (default — auto-starts dev server)
 *   TEST_ENV=staging    npm run test:e2e:staging
 *   TEST_ENV=production npm run test:e2e:prod
 *
 * Env URLs are resolved from env vars so they work on CI too:
 *   STAGING_URL   override staging base URL
 *   PROD_URL      override production base URL
 */

const ENV = process.env.TEST_ENV || 'local';

const BASE_URLS: Record<string, string> = {
  local:      'http://localhost:8082',
  staging:    process.env.STAGING_URL    || 'https://dashboard-staging.kstorybridge.com',
  production: process.env.PROD_URL       || 'https://dashboard.kstorybridge.com',
};

const BASE_URL = BASE_URLS[ENV] ?? BASE_URLS.local;
const IS_LOCAL = ENV === 'local';

console.log(`\n🧪 Playwright running against: ${ENV.toUpperCase()} → ${BASE_URL}\n`);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /*
   * webServer only applies for local env.
   * For staging/production, the server is already running — no auto-start needed.
   */
  ...(IS_LOCAL && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:8082',
      reuseExistingServer: true,   // reuse if already running (speeds up dev loop)
      timeout: 120 * 1000,
      env: {
        // ensure dev server binds to all interfaces for Tailscale access
        VITE_HOST: '0.0.0.0',
      },
    },
  }),
});
