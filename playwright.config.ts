import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/interest.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000,
  expect: { timeout: 12000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "firefox",
      testMatch: ["**/storefront-video.spec.ts", "**/storefront-icons.spec.ts"],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testMatch: ["**/storefront-video.spec.ts", "**/storefront-icons.spec.ts"],
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_COMMERCE_PROVIDER: "mock",
      NEXT_PUBLIC_PRODUCT_TEST_MODE: "false",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
      NODE_USE_SYSTEM_CA: "1",
      // Non-production fixture used only by this local/CI browser server.
      ADMIN_PREVIEW_PASSWORD: "test-only-generated-password-1234567890",
    },
  },
});
