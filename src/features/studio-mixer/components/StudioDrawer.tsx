"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface StudioDrawerProps {
  title: string;
  children: ReactNode;
  trigger: ReactNode;
}

export function StudioDrawer({ title, children, trigger }: StudioDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        role="button"
        tabIndex={0}
        className="contents"
        aria-label={`Open ${title}`}
      >
        {trigger}
      </span>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[#050505] border-t-2 border-[#FFD700] rounded-t-2xl max-h-[85vh] flex flex-col pb-[env(safe-area-inset-bottom)]"
            >
              <div className="w-12 h-1.5 bg-[#E0E0E0] rounded-full mx-auto mt-3 mb-4" />

              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-xl font-black tracking-wider text-[#FFD700] uppercase">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white/70 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Close ${title}`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

