import type { PlaywrightTestConfig } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const config: PlaywrightTestConfig = {
  testDir: "tests",
  use: {
    baseURL: BASE_URL,
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
};

export default config;
