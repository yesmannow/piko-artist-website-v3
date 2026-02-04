"use client";

/**
 * DeckDropZone - Desktop Drag & Drop Target for Track Loading
 *
 * Wraps deck controls and provides visual feedback when dragging tracks.
 * Desktop only - mobile continues using Load A/B buttons.
 *
 * Phase 3.2A: Frictionless Load → Cue → Play workflow
 */

import { useState, type ReactNode } from 'react';

interface DeckDropZoneProps {
  readonly deckId: 'A' | 'B';
  readonly onDropTrackId: (trackId: string) => void;
  readonly children: ReactNode;
}

export function DeckDropZone({ deckId, onDropTrackId, children }: DeckDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    // Check if this is a track being dragged
    const types = e.dataTransfer.types;
    if (!types.includes('application/x-piko-track-id') && !types.includes('text/plain')) {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the drop zone (not entering a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      // Try custom MIME type first, fallback to plain text
      const trackId = e.dataTransfer.getData('application/x-piko-track-id')
        || e.dataTransfer.getData('text/plain');

      if (trackId) {
        console.log(`[DeckDropZone] Dropped track ${trackId} on Deck ${deckId}`);
        onDropTrackId(trackId);
      }
    } catch (error) {
      console.error('[DeckDropZone] Failed to parse drop data:', error);
    }
  };

  // Deck-specific accent colors (match your design system)
  const accentClass = deckId === 'A'
    ? 'border-studio-cyan shadow-[0_0_24px_rgba(6,182,212,0.4)]'
    : 'border-studio-purple shadow-[0_0_24px_rgba(147,51,234,0.4)]';

  return (
    <div
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop zone overlay (only visible when dragging over) */}
      {isDragOver && (
        <div
          className={`absolute inset-0 z-50 rounded-lg border-4 border-dashed ${accentClass} bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none`}
        >
          <div className="text-center">
            <div className={`text-4xl font-black uppercase mb-2 ${
              deckId === 'A' ? 'text-studio-cyan' : 'text-studio-purple'
            }`}>
              DECK {deckId}
            </div>
            <div className="text-sm text-white/80 font-mono uppercase tracking-wider">
              Drop to Load
            </div>
          </div>
        </div>
      )}

      {/* Actual deck content */}
      {children}
    </div>
  );
}
