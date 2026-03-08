"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface XYPadProps {
  deckId: 'A' | 'B';
  onChange: (x: number, y: number) => void;
  label?: string;
}

export function XYPad({ deckId, onChange, label = 'FX PAD' }: XYPadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 200, height: 200 });

  const x = useMotionValue(bounds.width / 2);
  const y = useMotionValue(bounds.height / 2);

  // Normalize to 0-1 range based on container size
  const normalizedX = useTransform(x, [0, bounds.width], [0, 1]);
  // Y is inverted (bottom is 0, top is 1 usually for FX, let's say top is 1)
  const normalizedY = useTransform(y, [bounds.height, 0], [0, 1]);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setBounds({ width: rect.width, height: rect.height });
      // Reset to center
      x.set(rect.width / 2);
      y.set(rect.height / 2);
    }
  }, [x, y]);

  const handleDrag = () => {
    // Clamp values before sending
    const nX = Math.max(0, Math.min(1, normalizedX.get()));
    const nY = Math.max(0, Math.min(1, normalizedY.get()));
    onChange(nX, nY);
  };

  const handleDragEnd = () => {
    // Optional: snap back to center for standard filter, or leave where it is.
    // Let's leave it where it is for XY pads usually unless it's a momentary switch.
    // For now we'll spring back to center for filter.
    x.set(bounds.width / 2);
    y.set(bounds.height / 2);
    onChange(0.5, 0); // Assuming 0.5 is neutral X (filter center), 0 is neutral Y (fx wet 0)
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-mono uppercase text-white/60 tracking-wider">
        {label}
      </div>
      <div
        ref={containerRef}
        className="relative bg-obsidian-800 rounded-xl border border-white/10 shadow-inner overflow-hidden"
        style={{ width: '200px', height: '200px', touchAction: 'none' }}
      >
        {/* XY Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-full h-px bg-white/50" />
          <div className="absolute h-full w-px bg-white/50" />
        </div>

        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x, y }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="absolute w-8 h-8 -ml-4 -mt-4 bg-linear-to-br from-studio-cyan to-studio-purple rounded-full shadow-[0_0_15px_rgba(0,255,255,0.5)] cursor-grab active:cursor-grabbing border-2 border-white flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
