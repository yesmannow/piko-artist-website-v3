"use client";

/**
 * Deck3DToggle Component
 *
 * Toggle switch to enable/disable 3D Jog Wheel mode
 */

import { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';

export function Deck3DToggle() {
  const [is3DMode, setIs3DMode] = useState(false);

  const handleToggle = () => {
    setIs3DMode(!is3DMode);
    // Store in localStorage for persistence
    localStorage.setItem('jogWheel3DMode', (!is3DMode).toString());
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider
        transition-all duration-200
        ${is3DMode
          ? 'bg-studio-cyan text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]'
          : 'bg-white/5 text-white/60 hover:bg-white/10'
        }
      `}
      title="Toggle 3D Jog Wheel Mode"
    >
      {is3DMode ? '3D Mode' : '2D Mode'}
    </button>
  );
}

export function use3DMode(): boolean {
  const [is3D, setIs3D] = useState(false);

  useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jogWheel3DMode');
      setIs3D(stored === 'true');
    }
  });

  return is3D;
}
