"use client";

/**
 * Crossfader Component
 *
 * Precision crossfader with touch-action: none to prevent mobile scrolling
 * Uses Framer Motion for smooth drag interactions
 */

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useStudioStore } from '@/store/useStudioStore';

export function Crossfader() {
  const setCrossfader = useStudioStore((state) => state.setCrossfader);

  // Map crossfader position (0 to 1) to pixel position
  const initialPos = useStudioStore.getState().crossfaderPos;
  const x = useMotionValue(initialPos * 200); // 0 -> 0px, 0.5 -> 100px, 1 -> 200px
  const balance = useTransform(x, [0, 200], [-1, 1]);

  // Track previous position for haptic detent detection
  let previousBalance = balance.get();

  useEffect(() => {
    return useStudioStore.subscribe(
      (state) => state.crossfaderPos,
      (pos) => {
        x.set(pos * 200);
      }
    );
  }, [x]);

  const handleDrag = () => {
    const rawValue = balance.get();
    const clamped = Math.max(-1, Math.min(1, rawValue));
    const position = (clamped + 1) / 2;
    setCrossfader(position);

    // Phase X: Haptic feedback at center detent (0 balance)
    const wasNearCenter = Math.abs(previousBalance) < 0.05;
    const isNearCenter = Math.abs(clamped) < 0.05;

    if (!wasNearCenter && isNearCenter) {
      // Stronger haptic when crossing center
      if ('vibrate' in navigator) {
        navigator.vibrate(15); // Phase X: Center detent haptic
      }
    } else if ('vibrate' in navigator) {
      // Subtle haptic during normal drag
      navigator.vibrate(5);
    }

    previousBalance = clamped;
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
          style={{ x, touchAction: 'none' }} // Phase X: Prevent scrolling
          onDrag={handleDrag}
          onPointerDown={(e) => e.stopPropagation()} // Phase X: Multi-touch isolation
          className="absolute w-8 h-8 bg-linear-to-br from-studio-cyan to-studio-purple rounded-full shadow-lg cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
