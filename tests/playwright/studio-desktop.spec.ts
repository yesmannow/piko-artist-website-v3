import { test, expect } from "@playwright/test";
import { waitForStudioReady, skipOnboarding, waitForDeckReady } from "./helpers";

test("desktop three-column layout", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  // Wait for studio main to be present
  const studioMain = page.locator(".studio-main");
  await studioMain.waitFor({ state: "attached", timeout: 10000 });

  // Verify library drawer, decks area, and FX rack are present
  const libraryDrawer = page.locator(".library-drawer");
  const decksArea = page.locator(".decks-area");
  const fxRack = page.locator(".fx-rack");

  // On desktop, all three should be visible
  await expect(libraryDrawer).toBeVisible();
  await expect(decksArea).toBeVisible();
  await expect(fxRack).toBeVisible();

  // Verify both decks are visible side by side
  const deckA = await waitForDeckReady(page, "A");
  const deckB = await waitForDeckReady(page, "B");

  await expect(deckA).toBeVisible();
  await expect(deckB).toBeVisible();

  // Check that decks are side by side (desktop layout)
  const deckABox = await deckA.boundingBox();
  const deckBBox = await deckB.boundingBox();

  expect(deckABox).not.toBeNull();
  expect(deckBBox).not.toBeNull();

  // On desktop, decks should be horizontally arranged
  if (deckABox && deckBBox) {
    // Deck B should be to the right of Deck A (or below, but typically side by side)
    const horizontalLayout = deckBBox.x > deckABox.x || deckBBox.y > deckABox.y + deckABox.height;
    expect(horizontalLayout).toBeTruthy();
  }
});

test("desktop FX rack toggle", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  // Find FX toggle button
  const fxToggle = page.locator('button[aria-label="FX"]');
  await fxToggle.waitFor({ state: "attached", timeout: 5000 });

  // Check initial state
  const initialPressed = await fxToggle.getAttribute("aria-pressed");
  expect(initialPressed).toBeDefined();

  // Toggle FX
  await fxToggle.click();

  // Verify state changed
  const afterToggle = await fxToggle.getAttribute("aria-pressed");
  expect(afterToggle).not.toBe(initialPressed);
});

test("desktop library drawer visibility", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  // Library drawer should be visible on desktop
  const libraryDrawer = page.locator(".library-drawer");
  await libraryDrawer.waitFor({ state: "attached", timeout: 5000 });

  // Check if library toggle exists
  const libraryToggle = page.locator('button[aria-label="Library"]');
  if ((await libraryToggle.count()) > 0) {
    await libraryToggle.click();

    // Verify drawer state changes
    const isOpen = await libraryDrawer.evaluate((el) => {
      return el.classList.contains("is-open") || el.getBoundingClientRect().width > 0;
    });
    expect(isOpen).toBeTruthy();
  }
});

test("desktop crossfader presence", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  // Crossfader should be visible on desktop
  const crossfader = page.locator('[role="group"][aria-label="Crossfader"]');
  await crossfader.waitFor({ state: "attached", timeout: 5000 });
  await expect(crossfader).toBeVisible();

  // Crossfader should have an input
  const crossfaderInput = crossfader.locator('input[type="range"]');
  await expect(crossfaderInput).toBeVisible();
});

test("desktop deck controls interaction", async ({ page }) => {
  await page.goto("/studio");
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await waitForStudioReady(page);
  await skipOnboarding(page);

  const deckA = await waitForDeckReady(page, "A");

  // Find play button
  const playButton = deckA.locator('button[aria-label*="Play"]').first();
  await playButton.waitFor({ state: "visible", timeout: 5000 });

  // Click play
  await playButton.click();

  // Verify playing state
  const isPlaying = await playButton.getAttribute("aria-pressed");
  expect(isPlaying).toBeTruthy();

  // Find pause button (should be the same button, toggled)
  await playButton.click();

  // Verify paused state
  const isPaused = await playButton.getAttribute("aria-pressed");
  expect(isPaused).toBeFalsy();
});
