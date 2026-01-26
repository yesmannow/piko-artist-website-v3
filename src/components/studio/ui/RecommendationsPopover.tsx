"use client";

/**
 * RecommendationsPopover Component
 * 
 * Displays list of recommended tracks from Cyanite.ai
 * Shows track title, artist, BPM, mood indicators
 * "Load A" / "Load B" buttons for each recommendation
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';
import { freqToMidi } from '@/lib/utils/audioMath';

const SEMITONE_FROM_A: Record<string, number> = {
  C: -9,
  'C#': -8,
  Db: -8,
  D: -7,
  'D#': -6,
  Eb: -6,
  E: -5,
  F: -4,
  'F#': -3,
  Gb: -3,
  G: -2,
  'G#': -1,
  Ab: -1,
  A: 0,
  'A#': 1,
  Bb: 1,
  B: 2,
};

const keyToMidiNote = (key: string) => {
  const match = key.trim().match(/^([A-G])([#b]?)/i);
  if (!match) return null;
  const note = `${match[1].toUpperCase()}${match[2] || ''}`;
  const semitone = SEMITONE_FROM_A[note];
  if (semitone === undefined) return null;
  const frequency = 440 * Math.pow(2, semitone / 12);
  return Math.round(freqToMidi(frequency));
};

interface Recommendation {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  mood: {
    aggressive: number;
    chill: number;
  };
}

interface RecommendationsPopoverProps {
  recommendations: Recommendation[];
  isOpen: boolean;
  onClose: () => void;
  onLoadTrack: (deck: 'A' | 'B', rec: Recommendation) => void;
}

export function RecommendationsPopover({
  recommendations,
  isOpen,
  onClose,
  onLoadTrack,
}: RecommendationsPopoverProps) {
  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180]"
          />

          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-obsidian-900 border border-white/10 rounded-lg shadow-2xl z-[181] max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="glass-panel p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-studio-cyan" />
                <h3 className="text-lg font-black uppercase text-white">Recommended Tracks</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close recommendations"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* Recommendations List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {recommendations.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <p>No recommendations found</p>
                </div>
              ) : (
                recommendations.map((rec) => {
                  const keyMidi = rec.key ? keyToMidiNote(rec.key) : null;
                  return (
                    <div
                      key={rec.id}
                      className="glass-panel p-4 rounded-lg border border-white/10"
                    >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-white truncate">{rec.title}</h4>
                        <p className="text-sm text-white/60">{rec.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">BPM:</span>
                        <span className="font-mono font-bold text-white">{rec.bpm}</span>
                      </div>
                      {rec.key && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/60">Key:</span>
                          <span className="font-mono text-white">
                            {rec.key}
                            {keyMidi !== null && (
                              <span className="text-white/40"> (MIDI {keyMidi})</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Load Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => {
                          onLoadTrack('A', rec);
                          onClose();
                        }}
                        className="flex-1 px-4 py-2 rounded-lg font-mono text-sm font-bold uppercase bg-studio-cyan/20 border-2 border-studio-cyan text-studio-cyan hover:bg-studio-cyan/30 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Load A
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          onLoadTrack('B', rec);
                          onClose();
                        }}
                        className="flex-1 px-4 py-2 rounded-lg font-mono text-sm font-bold uppercase bg-studio-purple/20 border-2 border-studio-purple text-studio-purple hover:bg-studio-purple/30 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Load B
                      </motion.button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
