import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ retries: 1 });

const dismissOnboarding = async (page: Page) => {
  await page.evaluate(() => {
    const helpers = (window as any).__PIKO_TEST_HELPERS__;
    if (helpers?.skipOnboarding) {
      helpers.skipOnboarding();
      return;
    }
    localStorage.setItem("piko-studio-onboarding-seen", "true");
    localStorage.setItem("piko_onboarding_seen", "true");
  });

  const overlay = page.locator("[data-testid='studio-onboarding']");
  if ((await overlay.count()) === 0) {
    await overlay.waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
  }
  if ((await overlay.count()) > 0 && (await overlay.isVisible())) {
    await page.getByTestId("onboarding-skip").click();
    await expect(overlay).toHaveCount(0);
  }
};

const dumpDeckDiagnostics = async (page: Page, selector = "[data-deck-id='B']") => {
  const diag = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      width: r.width,
      height: r.height,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      ready: el.getAttribute("data-deck-ready"),
    };
  }, selector);
  console.log("Deck diagnostics:", diag);
};

test.describe("Piko Studio UX", () => {
  test("loads studio and shows control bar", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /enter studio/i }).click();
    await dismissOnboarding(page);
    await expect(page.getByTestId("play-toggle")).toBeVisible();
  });

  test("stem mode toggle shows stem panel", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /enter studio/i }).click();
    await dismissOnboarding(page);
    const toggle = page.getByTestId("stem-mode-toggle");
    await toggle.click();
    await expect(page.getByTestId("stem-generator")).toBeVisible();
  });

  test("deck focus mode on mobile", async ({ page }) => {
    await page.goto("/studio");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: /enter studio/i }).click();
    await dismissOnboarding(page);

    const deckB = page.locator("[data-deck-id='B']");

    await deckB.waitFor({ state: "attached", timeout: 10000 });

    await page.waitForFunction(
      () => {
        const el = document.querySelector("[data-deck-id='B']");
        if (!el) return false;
        if (el.getAttribute("data-deck-ready") === "true") return true;
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8;
      },
      undefined,
      { timeout: 10000 }
    );
    await page.waitForTimeout(200);
    const box = await deckB.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(8);
    expect(box?.height ?? 0).toBeGreaterThan(8);

    try {
      await deckB.click({ force: true });
      await expect(deckB).toHaveClass(/deck-focused/);
      await expect(page).toHaveScreenshot('deck-focused.png');
    } catch (error) {
      await dumpDeckDiagnostics(page);
      throw error;
    }
  });

  test("library search filters results", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /enter studio/i }).click();
    await dismissOnboarding(page);
    await page.getByRole("button", { name: /library/i }).click();

    const search = page.getByPlaceholder("Search tracks...");
    await search.fill("amor");

    const results = page.locator("[data-track-id]");
    await expect(results.first()).toBeVisible();
  });

  test("settings toggle hides stem waveforms", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /enter studio/i }).click();
    await dismissOnboarding(page);

    await page.getByTestId("stem-mode-toggle").click();
    await page.getByRole("button", { name: /settings/i }).click();
    const checkbox = page.getByLabel("Per-stem waveforms");
    await checkbox.uncheck();

    await expect(page.locator(".stem-waveforms")).toHaveCount(0);
  });

  test("onboarding shows on first visit and can be skipped", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("piko-studio-onboarding-seen");
      window.localStorage.removeItem("piko_onboarding_seen");
    });
    await page.goto("/studio");
    await page.getByRole("button", { name: /enter studio/i }).click();
    await expect(page.getByTestId("studio-onboarding")).toBeVisible();
    await page.getByTestId("onboarding-skip").click();
    await expect(page.getByTestId("studio-onboarding")).toHaveCount(0);
  });

  test("onboarding progresses on next", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("piko-studio-onboarding-seen");
      window.localStorage.removeItem("piko_onboarding_seen");
    });
    await page.goto("/studio");
    await page.getByRole("button", { name: /enter studio/i }).click();
    const overlay = page.getByTestId("studio-onboarding");
    await expect(overlay).toBeVisible();
    await page.getByTestId("onboarding-next").click();
    await expect(overlay).toHaveAttribute("data-step", "playback");
  });
});
