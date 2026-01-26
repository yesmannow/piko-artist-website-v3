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

test("mobile deck artwork loading", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 390, height: 844 });

  await waitForStudioReady(page);
  await skipOnboarding(page);

  const deckA = await waitForDeckReady(page, "A");

  // Check that canvas is visible
  await expect(page.locator('[data-deck-id="A"] canvas')).toBeVisible();

  // Check that canvas has dimensions (image loaded)
  const hasImage = await page.evaluate(() => {
    const c = document.querySelector('[data-deck-id="A"] canvas') as HTMLCanvasElement | null;
    return !!(c && c.width > 0 && c.height > 0);
  });
  expect(hasImage).toBeTruthy();
});
