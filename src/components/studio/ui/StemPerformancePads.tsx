"use client";

/**
 * StemPerformancePads - Phase 3.3 Signature Feature (Enhanced 3.3B)
 *
 * Professional stem control pads for live performance
 * - Tap: Toggle stem on/off
 * - Long press (mobile) / Shift+Click (desktop): Solo stem
 * - Visual feedback with deck-specific accent colors
 * - Tactile, hardware-inspired design
 * - Phase 3.3B: Improved disabled state, tooltips, larger touch targets
 *
 * Used in Pro complexity mode when stems are available
 */

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';

type StemKey = 'vocals' | 'drums' | 'bass' | 'other';

interface StemPerformancePadsProps {
  readonly deckId: 'A' | 'B';
  readonly disabled?: boolean;
  readonly mutedStems: Record<StemKey, boolean>;
  readonly soloStem: StemKey | null;
  readonly onToggle: (stem: StemKey) => void;
  readonly onSolo: (stem: StemKey) => void;
  readonly onClearSolo: () => void;
}

const STEM_LABELS: Record<StemKey, string> = {
  vocals: 'VOX',
  drums: 'DRM',
  bass: 'BAS',
  other: 'OTH',
};

const STEM_FULL_NAMES: Record<StemKey, string> = {
  vocals: 'Vocals',
  drums: 'Drums',
  bass: 'Bass',
  other: 'Other',
};

const STEM_COLORS: Record<StemKey, { active: string; muted: string; border: string }> = {
  vocals: {
    active: 'bg-gradient-to-br from-cyan-400/90 to-cyan-500/90',
    muted: 'bg-cyan-950/20',
    border: 'border-cyan-400/50',
  },
  drums: {
    active: 'bg-gradient-to-br from-purple-400/90 to-purple-500/90',
    muted: 'bg-purple-950/20',
    border: 'border-purple-400/50',
  },
  bass: {
    active: 'bg-gradient-to-br from-lime-400/90 to-lime-500/90',
    muted: 'bg-lime-950/20',
    border: 'border-lime-400/50',
  },
  other: {
    active: 'bg-gradient-to-br from-indigo-400/90 to-indigo-500/90',
    muted: 'bg-indigo-950/20',
    border: 'border-indigo-400/50',
  },
};

const LONG_PRESS_DURATION = 500; // ms

export function StemPerformancePads({
  deckId,
  disabled = false,
  mutedStems,
  soloStem,
  onToggle,
  onSolo,
  onClearSolo,
}: StemPerformancePadsProps) {
  const [pressedStem, setPressedStem] = useState<StemKey | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  const startPress = useCallback((stem: StemKey) => {
    if (disabled) return;

    setPressedStem(stem);
    longPressTriggeredRef.current = false;

    // Start long press timer for mobile solo
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (soloStem === stem) {
        onClearSolo();
      } else {
        onSolo(stem);
      }
      setPressedStem(null);
    }, LONG_PRESS_DURATION);
  }, [disabled, soloStem, onSolo, onClearSolo]);

  const endPress = useCallback((stem: StemKey) => {
    if (disabled) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    setPressedStem(null);

    // If long press was triggered, don't toggle
    if (longPressTriggeredRef.current) {
      return;
    }

    // Normal tap: toggle mute
    onToggle(stem);
  }, [disabled, onToggle]);

  const cancelPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setPressedStem(null);
    longPressTriggeredRef.current = false;
  }, []);

  const handleClick = useCallback((stem: StemKey, e: React.MouseEvent) => {
    if (disabled) return;

    // Desktop: Shift+Click = Solo
    if (e.shiftKey) {
      e.preventDefault();
      if (soloStem === stem) {
        onClearSolo();
      } else {
        onSolo(stem);
      }
      return;
    }

    // Normal click: toggle
    onToggle(stem);
  }, [disabled, soloStem, onToggle, onSolo, onClearSolo]);

  const stems: StemKey[] = ['vocals', 'drums', 'bass', 'other'];

  const accentColor = deckId === 'A' ? 'text-studio-cyan' : 'text-studio-purple';

  // Phase 3.3B: Show disabled CTA when pads are disabled
  if (disabled) {
    return (
      <div className="stem-performance-pads">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className={`text-xs font-mono uppercase tracking-wider ${accentColor} opacity-80`}>
            Stem Control
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-2">
          {stems.map((stem) => {
            const colors = STEM_COLORS[stem];
            return (
              <button
                key={stem}
                onClick={() => onToggle(stem)} // When disabled, clicking any pad triggers stem generation
                className={`
                  relative h-24 min-h-24 rounded-lg border-2 transition-all cursor-pointer
                  ${colors.muted} ${colors.border} opacity-50 hover:opacity-70
                `}
                title={`Generate stems to enable ${STEM_FULL_NAMES[stem]} control`}
                aria-label={`${STEM_FULL_NAMES[stem]} (disabled)`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-black uppercase tracking-wider text-white/30">
                    {STEM_LABELS[stem]}
                  </div>
                </div>
              </button>
            );
          })}

          {/* CTA Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 flex flex-col items-center gap-2">
              <Scissors className="w-6 h-6 text-studio-purple animate-pulse" />
              <div className="text-sm font-mono text-white">
                Generate Stems
              </div>
              <div className="text-[10px] text-white/60 text-center max-w-50">
                Click anywhere to separate vocals, drums, bass, and other
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 text-[10px] font-mono text-white/40 text-center">
          Stems required for performance pad control
        </div>
      </div>
    );
  }

  return (
    <div className="stem-performance-pads">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className={`text-xs font-mono uppercase tracking-wider ${accentColor} opacity-80`}>
          Stem Control
        </div>
        {soloStem && (
          <button
            onClick={onClearSolo}
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors text-white/80"
            disabled={disabled}
          >
            Clear Solo
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stems.map((stem) => {
          const isMuted = mutedStems[stem];
          const isSolo = soloStem === stem;
          const isActive = !isMuted;
          const isPressed = pressedStem === stem;
          const colors = STEM_COLORS[stem];

          // Phase 3.3B: Enhanced tooltip based on state
          const getTooltip = () => {
            if (isSolo) return `${STEM_FULL_NAMES[stem]} (SOLO) - Click to exit solo`;
            if (isActive) return `${STEM_FULL_NAMES[stem]} (ON) - Click to mute`;
            return `${STEM_FULL_NAMES[stem]} (MUTED) - Click to unmute`;
          };

          return (
            <motion.button
              key={stem}
              onClick={(e) => handleClick(stem, e)}
              onPointerDown={() => startPress(stem)}
              onPointerUp={() => endPress(stem)}
              onPointerCancel={cancelPress}
              onPointerLeave={cancelPress}
              disabled={disabled}
              title={getTooltip()}
              className={`
                relative h-24 min-h-24 rounded-lg border-2 transition-all
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive ? colors.active : colors.muted}
                ${colors.border}
                ${isPressed ? 'scale-95' : 'scale-100'}
                ${isSolo ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-black' : ''}
                hover:brightness-110 active:brightness-90 touch-manipulation
              `}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.95 }}
              aria-label={`${STEM_FULL_NAMES[stem]} stem ${isActive ? 'on' : 'muted'}${isSolo ? ' (solo)' : ''}`}
              aria-pressed={isActive}
            >
              {/* Pad Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className={`text-xl font-black uppercase tracking-wider ${
                  isActive ? 'text-white drop-shadow-lg' : 'text-white/40'
                }`}>
                  {STEM_LABELS[stem]}
                </div>
                <div className={`text-[9px] font-mono uppercase tracking-wider mt-0.5 ${
                  isActive ? 'text-white/70' : 'text-white/30'
                }`}>
                  {STEM_FULL_NAMES[stem]}
                </div>
                {isSolo && (
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/90 mt-1 bg-white/20 px-2 py-0.5 rounded">
                    SOLO
                  </div>
                )}
              </div>

              {/* Muted Indicator with Slash Icon */}
              {isMuted && !isSolo && (
                <div className="absolute top-2 right-2 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                    <div className="w-4 h-0.5 bg-red-500 rotate-45" />
                  </div>
                </div>
              )}

              {/* Active Glow */}
              {isActive && (
                <div className={`absolute inset-0 rounded-lg ${colors.active} opacity-20 blur-sm pointer-events-none`} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Instructions (Desktop) */}
      <div className="hidden md:block mt-2 text-[10px] font-mono text-white/40 text-center">
        Click: Toggle · Shift+Click: Solo
      </div>

      {/* Instructions (Mobile) */}
      <div className="md:hidden mt-2 text-[10px] font-mono text-white/40 text-center">
        Tap: Toggle · Long Press: Solo
      </div>
    </div>
  );
}
