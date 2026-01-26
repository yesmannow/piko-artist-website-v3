import type { Page } from "@playwright/test";

/**
 * Helper to wait for studio to initialize (audio engine)
 * No longer needed to click "Enter Studio" - it auto-initializes
 */
export async function waitForStudioReady(page: Page, timeout = 15000) {
  // Wait for studio-main to appear (indicates studio is loaded)
  await page.locator(".studio-main").waitFor({ state: "attached", timeout });
  
  // Wait a bit for audio initialization
  await page.waitForTimeout(1000);
}

/**
 * Helper to skip onboarding
 */
export async function skipOnboarding(page: Page) {
  await page.evaluate(() => {
    if ((window as any).__PIKO_TEST_HELPERS__?.skipOnboarding) {
      (window as any).__PIKO_TEST_HELPERS__.skipOnboarding();
    } else {
      localStorage.setItem("piko_onboarding_seen", "true");
    }
  });
  
  // Also try to dismiss onboarding overlay if present
  const overlay = page.locator("[data-testid='studio-onboarding']");
  if ((await overlay.count()) > 0 && (await overlay.isVisible())) {
    const skipButton = page.getByTestId("onboarding-skip");
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
  }
}

/**
 * Helper to wait for deck to be ready
 */
export async function waitForDeckReady(page: Page, deckId: "A" | "B", timeout = 10000) {
  const deck = page.locator(`[data-deck-id="${deckId}"]`);
  await deck.waitFor({ state: "attached", timeout });
  
  await page.waitForFunction(
    (id) => {
      const el = document.querySelector(`[data-deck-id="${id}"]`);
      if (!el) return false;
      if (el.getAttribute("data-deck-ready") === "true") return true;
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.height > 8;
    },
    deckId,
    { timeout }
  );
  
  return deck;
}
