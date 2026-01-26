import { test, expect } from "@playwright/test";
import { waitForStudioReady, skipOnboarding, waitForDeckReady } from "./helpers";

test("mobile deck focus", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 390, height: 844 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  const deckB = await waitForDeckReady(page, "B");

  await deckB.click({ force: true });
  const focused = await page.evaluate(
    () => document.querySelector('[data-deck-id="B"]')?.classList.contains("deck-focused")
  );
  expect(focused).toBeTruthy();
});

test("mobile deck swipe gesture", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 390, height: 844 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  const deckA = await waitForDeckReady(page, "A");

  // Simulate swipe gesture
  const deckABox = await deckA.boundingBox();
  if (deckABox) {
    await page.touchscreen.tap(deckABox.x + deckABox.width / 2, deckABox.y + deckABox.height / 2);
    await page.mouse.move(deckABox.x + deckABox.width / 2, deckABox.y + deckABox.height / 2);
    await page.mouse.down();
    await page.mouse.move(deckABox.x + deckABox.width / 2 - 100, deckABox.y + deckABox.height / 2);
    await page.mouse.up();
  }

  // Check if swipe event was dispatched
  const swipeEventDispatched = await page.evaluate(() => {
    return new Promise<boolean>((resolve) => {
      const handler = (e: Event) => {
        if ((e as CustomEvent).detail?.dir) {
          resolve(true);
          window.removeEventListener("piko:deck-swipe", handler);
        }
      };
      window.addEventListener("piko:deck-swipe", handler);
      setTimeout(() => resolve(false), 1000);
    });
  });

  expect(swipeEventDispatched).toBeTruthy();
});

test("mobile deck play/pause", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 390, height: 844 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  const deckA = await waitForDeckReady(page, "A");

  // Find and click play button
  const playButton = deckA.locator('button[aria-label*="Play"]').first();
  await playButton.waitFor({ state: "visible", timeout: 5000 });
  await playButton.click();

  // Check if playing state is set
  const isPlaying = await playButton.getAttribute("aria-pressed");
  expect(isPlaying).toBeTruthy();
});
