import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 60_000,
  testDir: "tests/playwright",
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    launchOptions: {
      env: {
        NEXT_PUBLIC_ENABLE_TEST_HELPERS: "true",
      },
    },
  },
  webServer: {
    command: "npm run start",
    port: 3000,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_ENABLE_TEST_HELPERS: "true",
    },
  },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        userAgent: "mobile",
      },
    },
    {
      name: "tablet",
      use: {
        viewport: { width: 820, height: 1180 },
      },
    },
    {
      name: "desktop",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "low-end-device",
      use: {
        viewport: { width: 390, height: 844 },
        userAgent: "mobile",
      },
    },
  ],
});
