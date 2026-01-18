"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Minimize2 } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export function LayoutToggle() {
  const { layoutMode, toggleLayoutMode } = useUIStore((state) => ({
    layoutMode: state.layoutMode,
    toggleLayoutMode: state.toggleLayoutMode,
  }));

  // Keyboard shortcut: Shift + L
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "l" && event.shiftKey) {
        event.preventDefault();
        toggleLayoutMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleLayoutMode]);

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
        <span className="hidden sm:inline">Layout</span>
        <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] text-white/50">
          Shift + L
        </span>
      </div>
      <button
        type="button"
        onClick={toggleLayoutMode}
        className="relative flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:border-white/40"
        aria-label="Toggle layout mode"
      >
        <AnimatePresence mode="wait" initial={false}>
          {layoutMode === "studio" ? (
            <motion.span
              key="studio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1"
            >
              <LayoutDashboard className="h-4 w-4 text-[#FFD700]" />
              Studio
            </motion.span>
          ) : (
            <motion.span
              key="minimal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1"
            >
              <Minimize2 className="h-4 w-4 text-[#93C5FD]" />
              Minimal
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
