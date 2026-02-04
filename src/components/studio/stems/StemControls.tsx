"use client";

/**
 * StemControls Component
 * 
 * Toggle buttons for each stem (Vocals, Drums, Bass, Other)
 * Visual indicators for muted/solo states
 */

import { motion } from 'framer-motion';
import { Mic, Drum, Music2, Music } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';

interface StemControlsProps {
  deckId: 'A' | 'B';
}

export function StemControls({ deckId }: StemControlsProps) {
  const stemBuffers = useStudioStore((state) => state.stems[deckId]);
  const mutedStems = useStudioStore((state) => state.mutedStems[deckId]);
  const soloStem = useStudioStore((state) => state.soloStem[deckId]);
  const setMutedStem = useStudioStore((state) => state.setMutedStem);
  const setSoloStem = useStudioStore((state) => state.setSoloStem);

  const stemList = [
    { key: 'vocals' as const, label: 'Vocals', icon: Mic, color: 'bg-studio-cyan' },
    { key: 'drums' as const, label: 'Drums', icon: Drum, color: 'bg-studio-purple' },
    { key: 'bass' as const, label: 'Bass', icon: Music2, color: 'bg-studio-crimson' },
    { key: 'other' as const, label: 'Other', icon: Music, color: 'bg-studio-gold' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-mono uppercase text-white/60 mb-1">Stems</div>
      <div className="grid gap-2">
        {stemList.map((stem) => {
          const Icon = stem.icon;
          const hasStem = Boolean(stemBuffers[stem.key]);
          const isMuted = mutedStems[stem.key];
          const isSolo = soloStem === stem.key;

          return (
            <div key={stem.key} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${stem.color} text-black`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-mono uppercase text-white/80">{stem.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  disabled={!hasStem}
                  onClick={() => setMutedStem(deckId, stem.key, !isMuted)}
                  className={`rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors ${
                    isMuted ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  whileHover={hasStem ? { scale: 1.05 } : {}}
                  whileTap={hasStem ? { scale: 0.95 } : {}}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </motion.button>
                <motion.button
                  type="button"
                  disabled={!hasStem}
                  onClick={() => setSoloStem(deckId, isSolo ? null : stem.key)}
                  className={`rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors ${
                    isSolo ? 'bg-studio-gold text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  whileHover={hasStem ? { scale: 1.05 } : {}}
                  whileTap={hasStem ? { scale: 0.95 } : {}}
                >
                  {isSolo ? 'Unsolo' : 'Solo'}
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
