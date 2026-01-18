"use client";

import { TimelinePlayer } from './TimelinePlayer';
import { useFXEngine } from '@/hooks/useFXEngine';
import { useUIStore } from '@/store/useUIStore';

/**
 * TimelineOverlay - Floating timeline player overlay
 * 
 * Decoupled from FXPresetEditor, visible across entire /studio/fx session.
 * Positioned at bottom center of viewport with backdrop blur.
 */
export default function TimelineOverlay() {
  const fx = useFXEngine();
  const labsEnabled = useUIStore((state) => state.labsEnabled);

  // Only show if Labs is enabled
  if (!labsEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[90%] max-w-4xl -translate-x-1/2 rounded-xl border border-white/10 bg-black/80 p-4 shadow-xl backdrop-blur-md">
      <TimelinePlayer engine={fx} />
    </div>
  );
}
