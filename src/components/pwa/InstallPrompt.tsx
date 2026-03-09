"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * InstallPrompt - PWA installation prompt with "Hacker Terminal" aesthetic
 *
 * Detects if the app can be installed and shows a terminal-styled banner
 * after 10 seconds of use. Uses the beforeinstallprompt event to trigger
 * the native browser install prompt.
 *
 * Features:
 * - Detects installability via beforeinstallprompt event
 * - Shows terminal-styled banner after 10 seconds
 * - "Y/N" prompt matching the hacker terminal theme
 * - Dismisses for current session if user clicks "N"
 */
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const dismissedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;

      // Show prompt after 10 seconds of use
      timerRef.current = setTimeout(() => {
        if (!dismissedRef.current && !isInstalled) {
          setShowPrompt(true);
        }
      }, 10000); // 10 seconds
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if iOS (different install flow)
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    if (isIOS) {
      // iOS doesn't support beforeinstallprompt, but we can still show instructions
      timerRef.current = setTimeout(() => {
        if (!dismissedRef.current && !isInstalled) {
          setShowPrompt(true);
        }
      }, 10000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      // Android/Chrome install
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowPrompt(false);
      }

      deferredPromptRef.current = null;
    } else {
      // iOS - show instructions (could open a modal)
      setShowPrompt(false);
      dismissedRef.current = true;
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    dismissedRef.current = true;
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-50 pointer-events-auto max-w-md mx-auto"
        >
          <div className="bg-black/95 backdrop-blur-sm border-2 border-toxic-lime/50 p-4 font-mono text-xs shadow-2xl">
            {/* Terminal Header */}
            <div className="text-toxic-lime mb-2">
              <span className="text-red-600">&gt;</span> SYSTEM: OPTIMIZED_VERSION_AVAILABLE. INSTALL? [Y/N]
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-toxic-lime text-black font-bold hover:bg-toxic-lime/80 transition-colors min-h-[44px] flex-1"
              >
                [Y] INSTALL
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-transparent border border-foreground/30 text-foreground hover:border-foreground hover:bg-foreground/10 transition-colors min-h-[44px] flex-1"
              >
                [N] LATER
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

