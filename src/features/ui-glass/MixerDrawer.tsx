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
      {trigger ? (
        <span
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsOpen(true);
          }}
          role="button"
          tabIndex={0}
          className="contents"
          aria-label="Open mixer"
        >
          {trigger}
        </span>
      ) : (
        defaultTrigger
      )}

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
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[#050505] border-t-2 border-[#FFD700] rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle - draggable indicator */}
              <div className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none" onPointerDown={(e) => {
                const startY = e.clientY;
                const startHeight = window.innerHeight * 0.9;
                const handleMove = (moveEvent: PointerEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  // Could implement dynamic height here if needed
                  // const newHeight = Math.max(200, Math.min(window.innerHeight * 0.9, startHeight - deltaY));
                };
                const handleUp = () => {
                  document.removeEventListener('pointermove', handleMove);
                  document.removeEventListener('pointerup', handleUp);
                };
                document.addEventListener('pointermove', handleMove);
                document.addEventListener('pointerup', handleUp);
              }}>
                <div className="w-12 h-1.5 bg-[#E0E0E0] rounded-full" />
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-1">Drag to resize</p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-[#FFD700]/30 scrollbar-track-transparent">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#050505] z-10 pb-2 border-b border-white/10">
                  <h2 className="text-xl md:text-2xl font-bold text-[#FFD700] uppercase tracking-wider">
                    Mixer Controls
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
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
                <div className="space-y-4">
                  {children}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
