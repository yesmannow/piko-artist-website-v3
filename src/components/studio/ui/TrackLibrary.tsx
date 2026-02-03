"use client";

/**
 * TrackLibrary Component
 *
 * Phase VII: Cloud-Synced Library with Local Persistence
 *
 * Displays tracks from IndexedDB (synced from Cloudflare R2)
 * - Live reactive queries via Dexie.js
 * - Local artwork mapping
 * - Analysis status tracking (BPM/Key)
 * - Instant performance after initial sync
 *
 * Mobile: Bottom sheet
 * Desktop: Side panel
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Cloud, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrackListing, Track as TrackListingInterface } from './TrackListing';
import { db } from '@/lib/db';
import { useLibrarySync } from '@/hooks/useLibrarySync';
import { useStudioStore } from '@/store/useStudioStore';

interface TrackLibraryProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onTrackLoaded?: (deck: 'A' | 'B') => void;
  readonly inline?: boolean; // If true, render inline instead of as drawer
  readonly panelId?: string;
}

export function TrackLibrary({ isOpen, onClose, onTrackLoaded, inline = false, panelId }: TrackLibraryProps) {
  const stemsCache = useStudioStore((state) => state.stemsCache);
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [bpmMin, setBpmMin] = useState<number>(0);
  const [bpmMax, setBpmMax] = useState<number>(220);

  // Phase VII: Sync tracks from R2 to IndexedDB
  const { isLoading: isSyncing, error: syncError, stats, refetch } = useLibrarySync();

  // Live query from IndexedDB (reactive!)
  const dbTracks = useLiveQuery(
    () => db.tracks.orderBy('dateAdded').reverse().toArray(),
    []
  );

  // Convert DBTrack to TrackListing interface
  const tracks: TrackListingInterface[] = useMemo(() => {
    if (!dbTracks) return [];

    return dbTracks.map((dbTrack): TrackListingInterface => ({
      trackId: dbTrack.url, // Use URL as unique ID
      title: dbTrack.title,
      artist: dbTrack.artist,
      bpm: dbTrack.bpm || 120, // Default BPM if not analyzed
      energy: 0.7, // Placeholder - can be analyzed later
      key: dbTrack.key,
      genre: dbTrack.genre,
      mood: dbTrack.mood,
      artUrl: dbTrack.artwork,
      cover: dbTrack.artwork,
      src: dbTrack.url,
      stems: dbTrack.stemUrls ? {
        full: dbTrack.url,
        vocals: dbTrack.stemUrls[0],
        drums: dbTrack.stemUrls[1],
        other: dbTrack.stemUrls[2],
      } : undefined,
    }));
  }, [dbTracks]);

  const genres = useMemo(() => {
    const set = new Set(tracks.map((track) => track.genre).filter(Boolean));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tracks]);

  const moods = useMemo(() => {
    const set = new Set(tracks.map((track) => track.mood).filter(Boolean));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tracks.filter((track) => {
      const matchesQuery =
        !normalizedQuery ||
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery);
      const matchesGenre = genreFilter === 'all' || track.genre === genreFilter;
      const matchesMood = moodFilter === 'all' || track.mood === moodFilter;
      const matchesBpm = (!bpmMin || track.bpm >= bpmMin) && (!bpmMax || track.bpm <= bpmMax);
      return matchesQuery && matchesGenre && matchesMood && matchesBpm;
    });
  }, [bpmMax, bpmMin, genreFilter, moodFilter, query, tracks]);

  const handleAnalyzeTrack = (track: TrackListingInterface) => {
    console.log(`[TrackLibrary] Analyze requested for ${track.trackId}`);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    globalThis.addEventListener('keydown', handleEscape);
    return () => globalThis.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Inline view (for persistent shell)
  if (inline) {
    return (
      <div className="h-full flex flex-col" id={panelId} aria-hidden={!isOpen}>
        {/* Header */}
        <div className="glass-panel p-4 border-b border-white/10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Music className="w-5 h-5 text-studio-cyan" />
              <Cloud className="w-3 h-3 text-studio-cyan absolute -top-1 -right-1" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase text-white">Cloud Library</h2>
              {stats && (
                <p className="text-xs text-white/60 font-normal">
                  {stats.total} tracks · {stats.percentAnalyzed}% analyzed
                  {stats.newTracksAdded > 0 && (
                    <span className="text-studio-cyan ml-2">+{stats.newTracksAdded} new</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync Status */}
            {isSyncing && (
              <RefreshCw className="w-4 h-4 text-studio-cyan animate-spin" />
            )}
            {syncError && (
              <div title={syncError}>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
            )}
            <button
              onClick={() => refetch()}
              disabled={isSyncing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Refresh library"
              title="Sync from R2"
            >
              <Database className="w-4 h-4 text-white/80" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Close library"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>
        <div className="library-filters">
          <input
            type="search"
            placeholder="Search tracks..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search tracks"
          />
          <div className="library-filter-row">
            <label>
              <span>Genre</span>
              <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Mood</span>
              <select value={moodFilter} onChange={(event) => setMoodFilter(event.target.value)}>
                {moods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>BPM</span>
              <div className="library-bpm">
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={bpmMin}
                  onChange={(event) => setBpmMin(Number(event.target.value))}
                  aria-label="Minimum BPM"
                />
                <span>-</span>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={bpmMax}
                  onChange={(event) => setBpmMax(Number(event.target.value))}
                  aria-label="Maximum BPM"
                />
              </div>
            </label>
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>No tracks available</p>
            </div>
          ) : (
            filteredTracks.map((track) => (
              <TrackListing
                key={track.trackId}
                track={track}
                onTrackLoaded={onTrackLoaded}
                stemsReady={Boolean(stemsCache[track.trackId])}
                onAnalyze={handleAnalyzeTrack}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-obsidian-900 border-l border-white/10 z-101 flex flex-col shadow-2xl"
            id={panelId}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="glass-panel p-4 border-b border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Music className="w-5 h-5 text-studio-cyan" />
                    <Cloud className="w-3 h-3 text-studio-cyan absolute -top-1 -right-1" />
                  </div>
                  <h2 className="text-xl font-black uppercase text-white">Cloud Library</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isSyncing && (
                    <RefreshCw className="w-4 h-4 text-studio-cyan animate-spin" />
                  )}
                  {syncError && (
                    <div title={syncError}>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="Close library"
                  >
                    <X className="w-5 h-5 text-white/80" />
                  </button>
                </div>
              </div>
              {stats && (
                <p className="text-xs text-white/60">
                  {stats.total} tracks · {stats.percentAnalyzed}% analyzed
                  {stats.newTracksAdded > 0 && (
                    <span className="text-studio-cyan ml-2">+{stats.newTracksAdded} new</span>
                  )}
                </p>
              )}
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div className="library-filters mb-4">
                <input
                  type="search"
                  placeholder="Search tracks..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search tracks"
                />
                <div className="library-filter-row">
                  <label>
                    <span>Genre</span>
                    <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
                      {genres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Mood</span>
                    <select value={moodFilter} onChange={(event) => setMoodFilter(event.target.value)}>
                      {moods.map((mood) => (
                        <option key={mood} value={mood}>
                          {mood}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>BPM</span>
                    <div className="library-bpm">
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={bpmMin}
                        onChange={(event) => setBpmMin(Number(event.target.value))}
                        aria-label="Minimum BPM"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={bpmMax}
                        onChange={(event) => setBpmMax(Number(event.target.value))}
                        aria-label="Maximum BPM"
                      />
                    </div>
                  </label>
                </div>
              </div>
              {filteredTracks.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <p>No tracks available</p>
                </div>
              ) : (
                filteredTracks.map((track) => (
                  <TrackListing
                    key={track.trackId}
                    track={track}
                    onTrackLoaded={onTrackLoaded}
                    stemsReady={Boolean(stemsCache[track.trackId])}
                    onAnalyze={handleAnalyzeTrack}
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
