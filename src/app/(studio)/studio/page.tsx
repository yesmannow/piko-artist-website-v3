"use client";

/**
 * Studio Page - Main entry point for DJ Studio
 *
 * Simplified to use StudioLayout which handles all audio persistence and view management
 */

import { StudioGrid } from '@/components/studio/StudioGrid';

export default function Studio() {
  return (
    <StudioGrid>
      {/* Top Row: Waveforms */}
      <div className="row-span-1 flex items-center justify-center bg-gray-800">
        {/* Placeholder for Waveforms */}
      </div>

      {/* Middle Row: Performance Zone */}
      <div className="row-span-1 grid grid-cols-3 gap-4">
        <div className="bg-gray-700">Deck A HUD</div>
        <div className="bg-gray-600">Central Mixer</div>
        <div className="bg-gray-700">Deck B HUD</div>
      </div>

      {/* Bottom Row: Track Library */}
      <div className="row-span-1 bg-gray-900 overflow-x-scroll">
        {/* Placeholder for Track Library */}
      </div>
    </StudioGrid>
  );
}
