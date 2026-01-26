"use client";

/**
 * TrackListing Component
 * 
 * Displays track metadata (Title, BPM, Energy) with "Load A" and "Load B" buttons
 * Shows visual loader (pulsing waveform) during R2 fetch
 */

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';

export interface Track {
  trackId: string;
  title: string;
  artist: string;
  bpm: number;
  energy: number;
  key?: string;
  artUrl?: string;
  src?: string;
  stems?: {
    full?: string;
    vocals?: string;
    drums?: string;
    other?: string;
  };
}

interface TrackListingProps {
  track: Track;
  onTrackLoaded?: (deck: 'A' | 'B') => void;
}

export function TrackListing({ track, onTrackLoaded }: TrackListingProps) {
  const [loadingDeck, setLoadingDeck] = useState<'A' | 'B' | null>(null);
  const { loadTrack } = useAudioEngine();
  const { setDeckTrack, deckA, deckB } = useStore();

  const normalizeFileName = (value: string) => {
    const trimmed = value.replace(/\\/g, '/').split('/').pop() || '';
    const noPrefix = trimmed.replace(/^audio\/tracks\//i, '');
    return noPrefix.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  };

  const getLocalUrl = () => {
    const candidate = track.src || track.stems?.full || track.trackId;
    const safeFile = normalizeFileName(candidate || '');
    if (!safeFile) {
      throw new Error('Missing track filename');
    }
    return `/audio/tracks/${safeFile}`;
  };

  const handleLoadTrack = async (deck: 'A' | 'B') => {
    setLoadingDeck(deck);
    
    try {
      const url = getLocalUrl();

      // Load track into audio engine
      await loadTrack(deck, url, track.bpm);

      // Update store with track data
      setDeckTrack(deck, {
        url,
        bpm: track.bpm,
        title: track.title,
        artist: track.artist,
        artUrl: track.artUrl,
        key: track.key,
        energy: track.energy,
        stems: track.stems,
        colorTheme: {
          primary: '#9333ea',
          secondary: '#06b6d4',
        },
      });

      console.log(`[TrackListing] Loaded ${track.title} on Deck ${deck}`);
      
      // Trigger callback to switch view back to decks
      if (onTrackLoaded) {
        onTrackLoaded(deck);
      }
    } catch (error) {
      console.error(`[TrackListing] Failed to load track on Deck ${deck}:`, error);
      alert(`Failed to load track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingDeck(null);
    }
  };

  const isLoadedA = deckA.trackData?.title === track.title;
  const isLoadedB = deckB.trackData?.title === track.title;

  return (
    <div className="glass-panel p-4 rounded-lg border border-white/10">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{track.title}</h3>
          <p className="text-sm text-white/60">{track.artist}</p>
        </div>
        {track.artUrl && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
            <Image
              src={track.artUrl}
              alt={track.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-white/60">BPM:</span>
          <span className="font-mono font-bold text-white">{track.bpm}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60">Energy:</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < track.energy * 5 ? 'bg-studio-cyan' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
        {track.key && (
          <div className="flex items-center gap-2">
            <span className="text-white/60">Key:</span>
            <span className="font-mono text-white">{track.key}</span>
          </div>
        )}
      </div>

      {/* Visual Loader - Pulsing Waveform */}
      {loadingDeck && (
        <div className="mb-3 flex items-center justify-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-studio-cyan" />
          <span className="text-xs text-white/60">Loading to Deck {loadingDeck}...</span>
          <div className="flex items-end gap-1 h-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-studio-cyan rounded-full"
                animate={{
                  height: [4, 12, 4],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Load Buttons */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => handleLoadTrack('A')}
          disabled={loadingDeck !== null}
          className={`flex-1 px-4 py-2 rounded-lg font-mono text-sm font-bold uppercase transition-colors ${
            isLoadedA
              ? 'bg-studio-cyan/20 border-2 border-studio-cyan text-studio-cyan'
              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={loadingDeck === null ? { scale: 1.02 } : {}}
          whileTap={loadingDeck === null ? { scale: 0.98 } : {}}
        >
          {loadingDeck === 'A' ? 'Loading...' : isLoadedA ? 'Loaded A' : 'Load A'}
        </motion.button>
        <motion.button
          onClick={() => handleLoadTrack('B')}
          disabled={loadingDeck !== null}
          className={`flex-1 px-4 py-2 rounded-lg font-mono text-sm font-bold uppercase transition-colors ${
            isLoadedB
              ? 'bg-studio-purple/20 border-2 border-studio-purple text-studio-purple'
              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={loadingDeck === null ? { scale: 1.02 } : {}}
          whileTap={loadingDeck === null ? { scale: 0.98 } : {}}
        >
          {loadingDeck === 'B' ? 'Loading...' : isLoadedB ? 'Loaded B' : 'Load B'}
        </motion.button>
      </div>
    </div>
  );
}
