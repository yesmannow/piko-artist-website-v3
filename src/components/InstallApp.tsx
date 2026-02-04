"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import { useHaptic } from "@/hooks/device/useHaptic";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (globalThis.window === undefined) return false;
    return globalThis.window.matchMedia("(display-mode: standalone)").matches;
  });
  const [showIOSPrompt, setShowIOSPrompt] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(globalThis.window as unknown as { MSStream?: unknown }).MSStream;
  });
  const { triggerHaptic } = useHaptic();

  useEffect(() => {
    // Skip if already determined to be installed
    if (isInstalled) return;

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    globalThis.window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      globalThis.window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    triggerHaptic();

    if (deferredPrompt) {
      // Android install
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else if (showIOSPrompt) {
      // iOS - show instructions
      setShowIOSPrompt(false);
      // Could show a modal with instructions here
    }
  };

  if (isInstalled || (!deferredPrompt && !showIOSPrompt)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed top-4 right-4 z-50 md:top-6 md:right-6"
      >
        <motion.button
          onClick={handleInstall}
          className="rounded-full border-2 border-white bg-toxic-lime text-black shadow-hard px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 font-tag text-sm md:text-base font-bold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
          }}
        >
          <Download className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}

