"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useHaptic } from "@/hooks/useHaptic";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { triggerHaptic } = useHaptic();
  const router = useRouter();
  const { installAvailable, triggerInstall } = usePwaInstall();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isIOS) {
      setShowIOSPrompt(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstall = async () => {
    triggerHaptic();

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
        return;
      }
    }

    if (installAvailable) {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        setIsInstalled(true);
        return;
      }
    }

    if (showIOSPrompt) {
      setShowIOSPrompt(false);
      router.push("/install#manual");
      return;
    }

    router.push("/install");
  };

  if (isInstalled || (!deferredPrompt && !showIOSPrompt && !installAvailable)) {
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
