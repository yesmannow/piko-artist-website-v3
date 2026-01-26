import { test, expect, type Page } from "@playwright/test";

const stemModelUrl = process.env.NEXT_PUBLIC_STEM_MODEL_URL || process.env.STEM_MODEL_URL;

const dismissOnboarding = async (page: Page) => {
  const overlay = page.locator("[data-testid='studio-onboarding']");
  if ((await overlay.count()) > 0 && (await overlay.isVisible())) {
    await page.getByTestId("onboarding-skip").click();
    await expect(overlay).toHaveCount(0);
  }
};

test("Stem separation worker initializes and returns stems", async ({ page }) => {
  test.skip(!stemModelUrl, "Stem model URL not configured");

  const logs: string[] = [];
  page.on("console", (msg) => logs.push(msg.text()));

  await page.goto("/studio");

  await page.getByRole("button", { name: /enter studio/i }).click();
  await dismissOnboarding(page);
  await page.getByRole("button", { name: /library/i }).click();
  await page.waitForSelector("[data-track-id]");
  const firstTrack = page.locator("[data-track-id]").first();
  await firstTrack.getByRole("button", { name: /load a/i }).click();

  const toggle = page.getByTestId("stem-mode-toggle");
  await toggle.click();

  const generateButton = page.getByTestId("generate-stems");
  await generateButton.waitFor();
  await generateButton.click();

  await page.waitForSelector("[data-stems-ready='true']", { timeout: 120000 });

  expect(logs.some((log) => log.toLowerCase().includes("stem worker error"))).toBeFalsy();
});
