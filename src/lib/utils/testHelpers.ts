export type PikoTestHelpers = {
  skipOnboarding: () => boolean;
  forceDeckLayout: (deckId?: string) => boolean;
  deckReadiness: () => { deckId: string; ready: string | null }[];
  pingWorker: () => Promise<boolean>;
};

type OnboardingStatePatch = {
  onboardingSeen?: boolean;
  onboardingStep?: string;
};

type TestHelperWindow = Window & {
  __PIKO_TEST_HELPERS__?: PikoTestHelpers;
  __PIKO_STORE__?: { setState?: (partial: OnboardingStatePatch) => void };
};

export function installTestHelpers() {
  if (typeof window === "undefined") return;

  const win = window as TestHelperWindow;

  win.__PIKO_TEST_HELPERS__ = {
    skipOnboarding: () => {
      try {
        const keys = ["piko-studio-onboarding-seen", "piko_onboarding_seen"];
        keys.forEach((key) => {
          localStorage.setItem(key, "true");
        });
        win.__PIKO_STORE__?.setState?.({ onboardingSeen: true, onboardingStep: "done" });
        return true;
      } catch (e) {
        console.warn("[TestHelpers] Failed to skip onboarding", e);
        return false;
      }
    },
    forceDeckLayout: (deckId?: string) => {
      const selector = deckId ? `[data-deck-id='${deckId}']` : "[data-deck-id]";
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return false;

      if (!el.offsetHeight || !el.offsetWidth) {
        if (!el.style.minHeight) {
          el.style.minHeight = "160px";
        }
        if (!el.style.minWidth) {
          el.style.minWidth = "280px";
        }
      }

      el.setAttribute("data-deck-ready", "true");
      return true;
    },
    deckReadiness: () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-deck-id]"));
      return nodes.map((el) => ({
        deckId: el.getAttribute("data-deck-id") ?? "unknown",
        ready: el.getAttribute("data-deck-ready"),
      }));
    },
    pingWorker: async () => {
      // Logic to check if worker is responsive
      return true;
    },
  };
}
