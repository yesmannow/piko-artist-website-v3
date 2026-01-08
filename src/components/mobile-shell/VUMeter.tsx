"use client";

import { useEffect, useRef } from 'react';
import { getAudioEngine } from '@/engine/AudioEngine';

interface VUMeterProps {
  deckId: string;
}

export const VUMeter = ({ deckId }: VUMeterProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    // requestAnimationFrame loop (runs outside React)
    const updateMeter = () => {
      if (barRef.current) {
        try {
          const engine = getAudioEngine();
          const rms = engine.getRMS(deckId);
          // Direct DOM manipulation (no React re-render)
          barRef.current.style.height = `${rms * 100}%`;
        } catch (error) {
          // Engine might not be initialized yet
          barRef.current.style.height = '0%';
        }
      }
      rafRef.current = requestAnimationFrame(updateMeter);
    };

    // Start the loop
    rafRef.current = requestAnimationFrame(updateMeter);

    // Cleanup on unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [deckId]);

  return (
    <div className="w-3 h-full bg-gray-800 rounded-sm overflow-hidden relative border border-gray-700">
      {/* VU Bar (grows from bottom) */}
      <div
        ref={barRef}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-300 transition-none"
        style={{ height: '0%' }}
      />
    </div>
  );
};
