"use client";

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MixerDrawer - Slide-up drawer for mixer controls (mobile)
 *
 * Uses Framer Motion for smooth slide-up animation.
 * Responsive: full-screen on mobile, side panel on tablet.
 */
export interface MixerDrawerProps {
  children: ReactNode;
  trigger?: ReactNode; // Custom trigger button (optional)
}

export function MixerDrawer({ children, trigger }: MixerDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-[#FFD700] text-black rounded-full flex items-center justify-center shadow-lg touch-manipulation"
      aria-label="Show mixer"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    </button>
  );

  return (
    <>
      {/* Trigger Button */}
      {trigger || defaultTrigger}

      {/* Drawer Overlay & Content */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[#050505] border-t-2 border-[#FFD700] rounded-t-2xl max-h-[85vh] flex flex-col"
            >
              {/* Handle */}
              <div className="w-12 h-1.5 bg-[#E0E0E0] rounded-full mx-auto mt-3 mb-4" />

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[#FFD700] uppercase">
                    Mixer
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white touch-manipulation"
                    aria-label="Close mixer"
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
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
