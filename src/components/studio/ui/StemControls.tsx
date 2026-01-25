"use client";

/**
 * StemControls Component
 * 
 * Toggle buttons for each stem (Vocals, Drums, Bass, Other)
 * Visual indicators for muted/solo states
 */

import { motion } from 'framer-motion';
import { Mic, Drum, Music2, Music } from 'lucide-react';
import { useAudioEngine } from '@/hooks/useAudioEngine';

interface StemControlsProps {
  deckId: 'A' | 'B';
}

export function StemControls({ deckId }: StemControlsProps) {
  const { toggleStem, getStemMuteState } = useAudioEngine();
  const stemMuteState = getStemMuteState(deckId);

  const stems = [
    { key: 'vocals' as const, label: 'Vocals', icon: Mic, color: 'bg-studio-cyan' },
    { key: 'drums' as const, label: 'Drums', icon: Drum, color: 'bg-studio-purple' },
    { key: 'bass' as const, label: 'Bass', icon: Music2, color: 'bg-studio-crimson' },
    { key: 'other' as const, label: 'Other', icon: Music, color: 'bg-studio-gold' },
  ];

  const handleToggle = (stem: 'vocals' | 'drums' | 'bass' | 'other') => {
    toggleStem(deckId, stem);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-mono uppercase text-white/60 mb-1">Stems</div>
      <div className="grid grid-cols-2 gap-2">
        {stems.map((stem) => {
          const Icon = stem.icon;
          const isMuted = stemMuteState[stem.key];

          return (
            <motion.button
              key={stem.key}
              onClick={() => handleToggle(stem.key)}
              className={`p-3 rounded-lg border-2 font-mono text-xs uppercase transition-colors flex items-center justify-center gap-2 ${
                !isMuted
                  ? `${stem.color} border-transparent text-black`
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              <span>{stem.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
