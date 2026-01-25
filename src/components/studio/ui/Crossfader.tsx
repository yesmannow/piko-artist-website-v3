"use client";

/**
 * Crossfader Component
 * 
 * Precision crossfader with touch-action: none to prevent mobile scrolling
 * Uses Framer Motion for smooth drag interactions
 */

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useAudioEngine } from '@/hooks/useAudioEngine';

export function Crossfader() {
  const { crossfadeValue, setCrossfade } = useStore();
  const { setCrossfade: setAudioCrossfade } = useAudioEngine();
  
  // Map crossfade value (-1 to 1) to pixel position
  const x = useMotionValue((crossfadeValue + 1) * 100); // -1 -> 0px, 0 -> 100px, 1 -> 200px
  const balance = useTransform(x, [0, 200], [-1, 1]);

  useEffect(() => {
    x.set((crossfadeValue + 1) * 100);
  }, [crossfadeValue, x]);

  const handleDrag = () => {
    const value = balance.get();
    setCrossfade(value);
    setAudioCrossfade(value);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="text-xs font-mono uppercase text-white/60 tracking-wider">Crossfader</div>
      <div 
        className="relative w-64 h-12 bg-obsidian-800 rounded-full border border-white/10 flex items-center px-1 shadow-inner"
        style={{ touchAction: 'none' }} // Prevent mobile scrolling
      >
        {/* Center Notch */}
        <div className="absolute left-1/2 -translate-x-1/2 h-4 w-0.5 bg-white/20" />

        {/* Deck A Label */}
        <div className="absolute left-2 text-[10px] font-mono text-studio-cyan">A</div>
        
        {/* Deck B Label */}
        <div className="absolute right-2 text-[10px] font-mono text-studio-purple">B</div>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 200 }}
          dragElastic={0.1}
          dragMomentum={false}
          style={{ x }}
          onDrag={handleDrag}
          className="absolute w-8 h-8 bg-gradient-to-br from-studio-cyan to-studio-purple rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
