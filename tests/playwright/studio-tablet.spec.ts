import { test, expect } from "@playwright/test";
import { waitForStudioReady, skipOnboarding, waitForDeckReady } from "./helpers";

test("tablet dual deck layout", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 820, height: 1180 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  // Wait for both decks to be ready
  const deckA = await waitForDeckReady(page, "A");
  const deckB = await waitForDeckReady(page, "B");

  // Verify both decks are visible
  await expect(deckA).toBeVisible();
  await expect(deckB).toBeVisible();

  // Check layout - on tablet, decks should be stacked vertically or side by side
  const deckABox = await deckA.boundingBox();
  const deckBBox = await deckB.boundingBox();

  expect(deckABox).not.toBeNull();
  expect(deckBBox).not.toBeNull();
});

test("tablet mixer controls visibility", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 820, height: 1180 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  // Crossfader should be visible on tablet
  const crossfader = page.locator('[role="group"][aria-label="Crossfader"]');
  await crossfader.waitFor({ state: "attached", timeout: 5000 });
  await expect(crossfader).toBeVisible();

  // Control bar should be visible
  const controlBar = page.locator('[role="toolbar"][aria-label="Studio controls"]');
  await expect(controlBar).toBeVisible();
});

test("tablet deck focus switching", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 820, height: 1180 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  const deckA = await waitForDeckReady(page, "A");
  const deckB = await waitForDeckReady(page, "B");

  // Focus deck B
  await deckB.click({ force: true });
  const bFocused = await page.evaluate(
    () => document.querySelector('[data-deck-id="B"]')?.classList.contains("deck-focused")
  );
  expect(bFocused).toBeTruthy();

  // Focus deck A
  await deckA.click({ force: true });
  const aFocused = await page.evaluate(
    () => document.querySelector('[data-deck-id="A"]')?.classList.contains("deck-focused")
  );
  expect(aFocused).toBeTruthy();
});
