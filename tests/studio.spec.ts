import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

const dismissOnboarding = async (page: Page) => {
  const overlay = page.locator("[data-testid='studio-onboarding']");
  if ((await overlay.count()) === 0) {
    await overlay.waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
  }
  if ((await overlay.count()) > 0 && (await overlay.isVisible())) {
    await page.getByTestId("onboarding-skip").click();
    await expect(overlay).toHaveCount(0);
  }
};

test("Studio loads and plays tracks without worker errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(`${BASE_URL}/studio`);

  // Wait for studio to initialize (audio engine auto-starts)
  await page.locator(".studio-main").waitFor({ state: "attached", timeout: 15000 });
  await page.waitForTimeout(1000); // Give audio time to initialize
  
  await dismissOnboarding(page);
  await page.getByRole("button", { name: /library/i }).click();
  const firstTrack = page.locator("[data-track-id]").first();
  await firstTrack.getByRole("button", { name: /load a/i }).click();

  await page.waitForSelector("canvas");
  await page.waitForFunction(() => Boolean((window as { studio?: { seek: (value: number) => void } }).studio));
  await page.waitForTimeout(2000);

  await page.evaluate(() => (window as { studio?: { seek: (value: number) => void } }).studio?.seek(0));
  await page.evaluate(() => (window as { studio?: { seek: (value: number) => void } }).studio?.seek(0.5));
  await page.evaluate(() => (window as { studio?: { seek: (value: number) => void } }).studio?.seek(1));

  const waveformError = consoleErrors.find((msg) =>
    msg.includes("InvalidStateError") || msg.includes("transferControlToOffscreen")
  );
  expect(waveformError, `Console error: ${waveformError}`).toBeFalsy();
});
