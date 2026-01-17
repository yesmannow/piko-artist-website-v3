"use client";

import { useEffect, useState } from "react";

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-white/10 bg-black/80 px-4 py-3 text-white shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Install Piko DJ</p>
          <p className="text-xs text-white/60">
            Add to home for offline access
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVisible(false)}
            className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.16em]"
          >
            Later
          </button>
          <button
            onClick={install}
            className="rounded-full bg-safety-yellow px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-black"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
