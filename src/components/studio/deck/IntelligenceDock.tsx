"use client";

/**
 * IntelligenceDock - 2026 Studio Evolution Phase 1
 *
 * A dedicated sidebar dock with a "Liquid Glass" aesthetic.
 * Features deep inset shadows, neon-blue (#00f2ff) active glows,
 * and a rekordbox-inspired industrial hardware feel.
 *
 * Houses the XYPad, StemOverlay, DeckFXRack, and Build-up Macro.
 * No floating overlays — all controls are physically bolted.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface IntelligenceDockProps {
  readonly deckId: 'A' | 'B';
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}

export function IntelligenceDock({ deckId, isOpen, onToggle, children }: IntelligenceDockProps) {
  const neonBlue = '#00f2ff';

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Toggle Rail */}
      <button
        onClick={onToggle}
        className="group relative flex items-center justify-center w-5 h-16 rounded-l-md transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, #0a0c14 0%, #060810 100%)',
          borderTop: `1px solid ${isOpen ? neonBlue + '40' : 'rgba(255,255,255,0.08)'}`,
          borderBottom: `1px solid ${isOpen ? neonBlue + '40' : 'rgba(255,255,255,0.08)'}`,
          borderLeft: `1px solid ${isOpen ? neonBlue + '40' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isOpen
            ? `inset 0 0 12px ${neonBlue}20, 0 0 8px ${neonBlue}15`
            : 'inset 0 0 8px rgba(0,0,0,0.4)',
        }}
        aria-label={`${isOpen ? 'Close' : 'Open'} Intelligence Dock for Deck ${deckId}`}
      >
        <div
          className="w-0.5 h-6 rounded-full transition-all duration-300"
          style={{
            backgroundColor: isOpen ? neonBlue : 'rgba(255,255,255,0.2)',
            boxShadow: isOpen ? `0 0 8px ${neonBlue}` : 'none',
          }}
        />
      </button>

      {/* Dock Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="relative overflow-hidden flex flex-col"
            style={{
              minHeight: '100%',
            }}
          >
            {/* Liquid Glass Card */}
            <div
              className="h-full flex flex-col gap-4 p-3 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(10,14,26,0.95) 0%, rgba(4,5,10,0.98) 50%, rgba(10,14,26,0.95) 100%)',
                border: `1px solid ${neonBlue}20`,
                boxShadow: `
                  inset 0 2px 0 rgba(255,255,255,0.04),
                  inset 0 -2px 0 rgba(0,0,0,0.5),
                  inset 4px 0 20px rgba(0,0,0,0.6),
                  inset -4px 0 20px rgba(0,0,0,0.6),
                  inset 0 4px 16px rgba(0,0,0,0.4),
                  0 0 24px ${neonBlue}06,
                  0 16px 48px rgba(0,0,0,0.6)
                `,
                backdropFilter: 'blur(20px) saturate(1.6)',
              }}
            >
              {/* Dock Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{
                    backgroundColor: neonBlue,
                    boxShadow: `0 0 6px ${neonBlue}, 0 0 12px ${neonBlue}60`,
                  }}
                />
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.3em]"
                  style={{ color: `${neonBlue}cc` }}
                >
                  Intelligence
                </span>
              </div>

              {/* Dock Body - scrollable container for children */}
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                {children}
              </div>

              {/* Bottom Glow Line */}
              <div
                className="h-px w-full mt-auto"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${neonBlue}40 50%, transparent 100%)`,
                }}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
