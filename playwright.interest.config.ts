import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/interest.spec.ts",
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000,
  expect: { timeout: 12000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "interest-chromium", use: devices["Desktop Chrome"] }],
  webServer: {
    command: "pnpm start",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_COMMERCE_PROVIDER: "mock",
      ALLOW_MOCK_COMMERCE: "true",
      CART_COOKIE_SECRET: "ci-preview-only-dummy-secret-never-use-in-production",
      DEPLOYMENT_ENV: "preview",
      NEXT_PUBLIC_PRODUCT_TEST_MODE: "true",
      PRODUCT_INTEREST_ENABLED: "false",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
      NODE_USE_SYSTEM_CA: "1",
    },
  },
});
