"use client";

import { useEffect, useState } from "react";

type InstallOutcome = "accepted" | "dismissed" | "unavailable";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Consolidated PWA install helper used by install CTAs across the app.
 * Captures the `beforeinstallprompt` event and exposes a trigger that
 * falls back to "unavailable" when the browser cannot prompt.
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const triggerInstall = async (): Promise<InstallOutcome> => {
    if (!deferred) return "unavailable";
    try {
      await deferred.prompt();
      const result = await deferred.userChoice;
      setDeferred(null);
      if (result.outcome === "accepted") {
        setIsInstalled(true);
      }
      return result.outcome;
    } catch {
      return "unavailable";
    }
  };

  return {
    installAvailable: Boolean(deferred) && !isInstalled,
    isInstalled,
    triggerInstall,
  };
}
