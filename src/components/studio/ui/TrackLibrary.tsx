"use client";

/**
 * TrackLibrary Component
 * 
 * Side/bottom drawer that displays all tracks from musician_tracks.json
 * Mobile: Bottom sheet
 * Desktop: Side panel
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';
import { TrackListing, Track } from './TrackListing';
import tracksData from '@/data/musician_tracks.json';

interface TrackLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackLoaded?: (deck: 'A' | 'B') => void;
  inline?: boolean; // If true, render inline instead of as drawer
}

export function TrackLibrary({ isOpen, onClose, onTrackLoaded, inline = false }: TrackLibraryProps) {
  const tracks = tracksData as Track[];

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Inline view (for persistent shell)
  if (inline) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="glass-panel p-4 border-b border-white/10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-studio-cyan" />
            <h2 className="text-xl font-black uppercase text-white">Track Library</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close library"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {tracks.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>No tracks available</p>
            </div>
          ) : (
            tracks.map((track) => (
              <TrackListing 
                key={track.trackId} 
                track={track} 
                onTrackLoaded={onTrackLoaded}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // Drawer view (fallback for mobile or modal usage)
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-obsidian-900 border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="glass-panel p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-studio-cyan" />
                <h2 className="text-xl font-black uppercase text-white">Track Library</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close library"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {tracks.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <p>No tracks available</p>
                </div>
              ) : (
                tracks.map((track) => (
                  <TrackListing 
                    key={track.trackId} 
                    track={track} 
                    onTrackLoaded={onTrackLoaded}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
