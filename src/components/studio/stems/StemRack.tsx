'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAudioEngine } from '@/hooks/audio/useAudioEngine';
import { useStudioStore } from '@/store/useStudioStore';

interface StemRackProps {
  readonly deckId: 'A' | 'B';
  readonly compact?: boolean;
}

type StemKey = 'vocals' | 'drums' | 'bass' | 'other';

interface StemConfig {
  key: StemKey;
  label: string;
  shortLabel: string;
  color: string;
  colorActive: string;
  colorInactive: string;
}

const STEM_CONFIGS: StemConfig[] = [
  {
    key: 'vocals',
    label: 'Vocals',
    shortLabel: 'VOX',
    color: '#7FDBFF', // Teal/Cyan (highs in frequency spectrum)
    colorActive: 'bg-[#7FDBFF] text-black',
    colorInactive: 'bg-[var(--bg-tertiary)] text-white/40',
  },
  {
    key: 'drums',
    label: 'Drums',
    shortLabel: 'DRM',
    color: '#FF4136', // Red (bass/lows in frequency spectrum)
    colorActive: 'bg-[#FF4136] text-black',
    colorInactive: 'bg-[var(--bg-tertiary)] text-white/40',
  },
  {
    key: 'bass',
    label: 'Bass',
    shortLabel: 'BAS',
    color: '#FF4136', // Red (bass/lows)
    colorActive: 'bg-[#FF4136] text-black',
    colorInactive: 'bg-[var(--bg-tertiary)] text-white/40',
  },
  {
    key: 'other',
    label: 'Melody',
    shortLabel: 'MEL',
    color: '#F012BE', // Pink (mids in frequency spectrum)
    colorActive: 'bg-[#F012BE] text-black',
    colorInactive: 'bg-[var(--bg-tertiary)] text-white/40',
  },
];

/**
 * StemRack Component - Hardware-Emulated Stem Control Interface
 *
 * Features:
 * - Zero-latency stem toggling via direct audio engine calls
 * - Solo/Mute functionality with visual feedback
 * - Pro DJ dark-mode palette integration
 * - Hardware-style button layout
 * - React.memo for optimal performance
 */
export const StemRack = memo(function StemRack({ deckId, compact = false }: StemRackProps) {
  const { toggleStem, getStemMuteState } = useAudioEngine();
  const stemBuffers = useStudioStore((state) => state.stems[deckId]);
  const mutedStems = useStudioStore((state) => state.mutedStems[deckId]);
  const soloStem = useStudioStore((state) => state.soloStem[deckId]);
  const setMutedStem = useStudioStore((state) => state.setMutedStem);
  const setSoloStem = useStudioStore((state) => state.setSoloStem);

  const handleToggleStem = useCallback((stem: StemKey) => {
    const hasStem = Boolean(stemBuffers[stem]);
    if (!hasStem) return;

    const isMuted = mutedStems[stem];
    const isSolo = soloStem === stem;

    // If solo is active on this stem, unsolo it
    if (isSolo) {
      setSoloStem(deckId, null);
      return;
    }

    // If solo is active on another stem, toggle mute on this stem
    if (soloStem && soloStem !== stem) {
      // Update store state
      setMutedStem(deckId, stem, !isMuted);

      // Update audio engine instantly (zero-latency)
      toggleStem(deckId, stem);
      return;
    }

    // Normal mute/unmute toggle
    // Update store state
    setMutedStem(deckId, stem, !isMuted);

    // Update audio engine instantly (zero-latency)
    toggleStem(deckId, stem);
  }, [deckId, stemBuffers, mutedStems, soloStem, setMutedStem, setSoloStem, toggleStem, getStemMuteState]);

  const handleSolo = useCallback((stem: StemKey) => {
    const hasStem = Boolean(stemBuffers[stem]);
    if (!hasStem) return;

    const isSolo = soloStem === stem;

    if (isSolo) {
      // Unsolo - restore previous mute states
      setSoloStem(deckId, null);
    } else {
      // Solo this stem - mute all others
      setSoloStem(deckId, stem);

      // Update audio engine for all stems
      STEM_CONFIGS.forEach((config) => {
        toggleStem(deckId, config.key);
      });
    }
  }, [deckId, stemBuffers, soloStem, setSoloStem, toggleStem, getStemMuteState]);

  const anyStemsAvailable = Object.values(stemBuffers).some(Boolean);

  if (!anyStemsAvailable) {
    return (
      <div className="flex items-center justify-center p-4 rounded-lg border border-white/5 bg-(--bg-secondary)">
        <span className="text-xs text-white/40 font-mono uppercase tracking-wider">
          No Stems Available
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">
          Stem Rack {deckId}
        </span>
        {soloStem && (
          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-(--accent-color) text-black">
            SOLO
          </span>
        )}
      </div>

      {/* Stem Buttons */}
      <div className={compact ? 'flex gap-1' : 'grid grid-cols-2 gap-2'}>
        {STEM_CONFIGS.map((stem) => {
          const hasStem = Boolean(stemBuffers[stem.key]);
          const isMuted = mutedStems[stem.key];
          const isSolo = soloStem === stem.key;
          const isOtherSolo = soloStem && soloStem !== stem.key;
          const isActive = !isMuted && !isOtherSolo;

          // Status text logic
          let statusText = 'ON';
          if (isSolo) {
            statusText = 'SOLO';
          } else if (isMuted || isOtherSolo) {
            statusText = 'MUTE';
          }

          return (
            <motion.button
              key={stem.key}
              onClick={() => handleToggleStem(stem.key)}
              onDoubleClick={() => handleSolo(stem.key)}
              disabled={!hasStem}
              className={`
                relative flex flex-col items-center justify-center
                ${compact ? 'h-12 px-2' : 'h-16 px-3'}
                rounded-md border transition-all
                ${!hasStem && 'opacity-30 cursor-not-allowed'}
                ${isActive && hasStem ? stem.colorActive : stem.colorInactive}
                ${isActive && hasStem ? 'border-white/20 shadow-lg' : 'border-white/5'}
                ${isSolo && 'ring-2 ring-(--accent-color) ring-offset-2 ring-offset-(--bg-primary)'}
              `}
              whileHover={hasStem ? { scale: 1.02 } : {}}
              whileTap={hasStem ? { scale: 0.98 } : {}}
            >
              {/* LED Indicator */}
              <div
                className={`
                  absolute top-1 right-1 w-1.5 h-1.5 rounded-full
                  ${isActive && hasStem ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'bg-white/10'}
                `}
              />

              {/* Label */}
              <span
                className={`
                  text-xs font-mono font-bold uppercase tracking-[0.2em]
                  ${isActive && hasStem ? 'opacity-100' : 'opacity-40'}
                `}
              >
                {compact ? stem.shortLabel : stem.label}
              </span>

              {/* Status Indicator */}
              {!compact && (
                <span className="text-[8px] font-mono uppercase tracking-wider mt-0.5 opacity-60">
                  {statusText}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Instructions */}
      {!compact && (
        <div className="text-[9px] text-white/30 font-mono text-center mt-1">
          Click: Mute/Unmute • Double-Click: Solo
        </div>
      )}
    </div>
  );
});

export default StemRack;
