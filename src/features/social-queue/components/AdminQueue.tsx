"use client";

import { useJamQueue } from '../hooks/useJamQueue';
import { useCallback } from 'react';
import type { QueueTrack } from '../types';

/**
 * AdminQueue - Admin interface for drag-and-drop track loading
 *
 * Allows admin to drag top-voted tracks onto Deck A or Deck B
 */
export interface AdminQueueProps {
  onLoadToDeck: (track: QueueTrack, deckId: 'A' | 'B') => void;
}

export function AdminQueue({ onLoadToDeck }: AdminQueueProps) {
  const { tracks } = useJamQueue();

  const handleDragStart = useCallback((e: React.DragEvent, track: QueueTrack) => {
    e.dataTransfer.setData('application/json', JSON.stringify(track));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold text-white mb-4">Admin Queue</h3>

      <div className="space-y-2">
        {tracks.slice(0, 10).map((track) => (
          <div
            key={track.id}
            draggable
            onDragStart={(e) => handleDragStart(e, track)}
            className="bg-glass-surface border border-glass-border p-3 rounded-lg cursor-move touch-manipulation"
          >
            <div className="font-bold text-white text-sm truncate">
              {track.track_metadata.title}
            </div>
            <div className="text-xs text-white/60">
              {track.votes} votes • Drag to deck
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
