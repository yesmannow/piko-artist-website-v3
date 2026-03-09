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
import { useLibrarySync } from '@/hooks/tracks/useLibrarySync';
import { useStudioStore } from '@/store/useStudioStore';
import { deriveTrackKey } from '@/lib/trackKey'; // Phase S11.2 - Canonical track identity
import { useSmartTrackAnalysis } from '@/hooks/tracks/useSmartTrackAnalysis';
import { useSmartMatch } from '@/hooks/tracks/useSmartMatch';

interface TrackLibraryProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onTrackLoaded?: (deck: 'A' | 'B') => void;
  readonly inline?: boolean; // If true, render inline instead of as drawer
  readonly panelId?: string;
}

export function TrackLibrary({ isOpen, onClose, onTrackLoaded, inline = false, panelId }: TrackLibraryProps) {
  const stemsCache = useStudioStore((state) => state.stemsCache);
  const sortBy = useStudioStore((state) => state.librarySortBy);
  const setSortBy = useStudioStore((state) => state.setLibrarySortBy);
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [bpmMin, setBpmMin] = useState<number>(0);
  const [bpmMax, setBpmMax] = useState<number>(220);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);

  // Phase VII: Sync tracks from R2 to IndexedDB
  const { isLoading: isSyncing, error: syncError, stats, refetch } = useLibrarySync();

  // Phase IX.5: AI Analysis Hook
  const { analyzeIfNeeded, isAnalyzing, currentTrack } = useSmartTrackAnalysis();

  // Live query from IndexedDB (reactive!)
  const dbTracks = useLiveQuery(
    () => db.tracks.orderBy('dateAdded').reverse().toArray(),
    []
  );

  // Convert DBTrack to TrackListing interface
  const tracks: TrackListingInterface[] = useMemo(() => {
    if (!dbTracks) return [];

    return dbTracks.map((dbTrack): TrackListingInterface => {
      // Parse energy from analysisData if available
      let energy = dbTrack.energy || 0.5;
      if (dbTrack.analysisData) {
        try {
          const parsed = JSON.parse(dbTrack.analysisData);
          energy = parsed.energy || energy;
        } catch {
          // Use default
        }
      }

      return {
        trackKey: deriveTrackKey(dbTrack), // Phase S11.2: Canonical track ID (URL-agnostic)
        url: dbTrack.url, // Keep URL separate for audio fetching
        trackId: dbTrack.url, // DEPRECATED - kept for backward compatibility during migration
        title: dbTrack.title,
        artist: dbTrack.artist,
        bpm: dbTrack.bpm || 0,
        energy,
        key: dbTrack.key,
        genre: dbTrack.genre,
        mood: dbTrack.mood,
        artUrl: dbTrack.artwork,
        cover: dbTrack.artwork,
        src: dbTrack.url,
        status: dbTrack.status,
        stems: dbTrack.stemUrls ? {
          full: dbTrack.url,
          vocals: dbTrack.stemUrls[0],
          drums: dbTrack.stemUrls[1],
          other: dbTrack.stemUrls[2],
        } : undefined,
      };
    });
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
    const result = tracks.filter((track) => {
      const matchesQuery =
        !normalizedQuery ||
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery);
      const matchesGenre = genreFilter === 'all' || track.genre === genreFilter;
      const matchesMood = moodFilter === 'all' || track.mood === moodFilter;
      const matchesBpm = (!bpmMin || track.bpm >= bpmMin) && (!bpmMax || track.bpm <= bpmMax);
      return matchesQuery && matchesGenre && matchesMood && matchesBpm;
    });

    // Sort by selected criteria
    if (sortBy === 'bpm') {
      result.sort((a, b) => (b.bpm || 0) - (a.bpm || 0));
    } else if (sortBy === 'energy') {
      result.sort((a, b) => (b.energy || 0) - (a.energy || 0));
    }
    // 'match' and 'dateAdded' sorting handled after smart match enrichment

    return result;
  }, [bpmMax, bpmMin, genreFilter, moodFilter, query, tracks, sortBy]);

  const handleAnalyzeTrack = async (track: TrackListingInterface) => {
    if (!dbTracks) return;

    const dbTrack = dbTracks.find(t => t.url === track.trackId);
    if (!dbTrack) return;

    try {
      console.log(`[TrackLibrary] Analyzing ${track.title}...`);
      await analyzeIfNeeded(dbTrack);
      console.log(`[TrackLibrary] Analysis complete for ${track.title}`);
    } catch (error) {
      console.error(`[TrackLibrary] Analysis failed for ${track.title}:`, error);
    }
  };

  const handleBatchAnalyze = async () => {
    if (!dbTracks || batchAnalyzing) return;

    const unanalyzedTracks = dbTracks.filter(
      track => track.status === 'unanalyzed' || track.status === 'error'
    );

    if (unanalyzedTracks.length === 0) {
      alert('All tracks are already analyzed!');
      return;
    }

    setBatchAnalyzing(true);
    console.log(`[TrackLibrary] Starting batch analysis of ${unanalyzedTracks.length} tracks...`);

    for (const track of unanalyzedTracks) {
      try {
        await analyzeIfNeeded(track);
        // Add small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[TrackLibrary] Failed to analyze ${track.title}:`, error);
      }
    }

    setBatchAnalyzing(false);
    console.log('[TrackLibrary] Batch analysis complete');
  };

  // Phase 2: Smart Match — compute real-time match scores against active deck
  const { tracksWithMatch, hasActiveDeck } = useSmartMatch(filteredTracks);

  // Sort by match if selected
  const tracksWithCompatibility = useMemo(() => {
    if (sortBy === 'match' && hasActiveDeck) {
      return [...tracksWithMatch].sort(
        (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)
      );
    }
    return tracksWithMatch;
  }, [tracksWithMatch, sortBy, hasActiveDeck]);

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
    const unanalyzedCount = dbTracks?.filter(t => t.status === 'unanalyzed' || t.status === 'error').length || 0;

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
            {/* Analysis Progress */}
            {(isAnalyzing || batchAnalyzing) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
                <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="text-xs text-cyan-400 font-mono">
                  {currentTrack ? `Analyzing: ${currentTrack}` : 'Batch analyzing...'}
                </span>
              </div>
            )}
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

        {/* Toolbar: Sort + Batch Analysis */}
        <div className="px-4 mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 font-mono uppercase">Sort:</span>
            <button
              onClick={() => setSortBy('dateAdded')}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                sortBy === 'dateAdded'
                  ? 'bg-lime-400/20 border border-lime-400 text-lime-400'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('bpm')}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                sortBy === 'bpm'
                  ? 'bg-lime-400/20 border border-lime-400 text-lime-400'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              BPM
            </button>
            <button
              onClick={() => setSortBy('energy')}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                sortBy === 'energy'
                  ? 'bg-lime-400/20 border border-lime-400 text-lime-400'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              Energy
            </button>
            <button
              onClick={() => setSortBy('match')}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                sortBy === 'match'
                  ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
              disabled={!hasActiveDeck}
              title={hasActiveDeck ? 'Sort by match score' : 'Load a track to enable match sorting'}
            >
              Match
            </button>
          </div>
          <button
            onClick={handleBatchAnalyze}
            disabled={batchAnalyzing || unanalyzedCount === 0}
            className="px-4 py-2 rounded-lg font-mono text-xs uppercase bg-indigo-500/20 border border-indigo-500 text-indigo-400 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {batchAnalyzing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Database className="w-3 h-3" />
                Analyze All ({unanalyzedCount})
              </>
            )}
          </button>
        </div>
        <div className="library-filters">
          <input
            id={`search-tracks-${panelId}`}
            name="search-tracks"
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
                  id={`bpm-min-${panelId}`}
                  name="bpm-min"
                  type="number"
                  min={0}
                  max={300}
                  value={bpmMin}
                  onChange={(event) => setBpmMin(Number(event.target.value))}
                  aria-label="Minimum BPM"
                />
                <span>-</span>
                <input
                  id={`bpm-max-${panelId}`}
                  name="bpm-max"
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
          {tracksWithCompatibility.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>No tracks available</p>
            </div>
          ) : (
            tracksWithCompatibility.map((track) => (
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
                  id={`search-tracks-${panelId}`}
                  name="search-tracks"
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
                        id={`bpm-min-${panelId}`}
                        name="bpm-min"
                        type="number"
                        min={0}
                        max={300}
                        value={bpmMin}
                        onChange={(event) => setBpmMin(Number(event.target.value))}
                        aria-label="Minimum BPM"
                      />
                      <span>-</span>
                      <input
                        id={`bpm-max-${panelId}`}
                        name="bpm-max"
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
              {tracksWithCompatibility.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <p>No tracks available</p>
                </div>
              ) : (
                tracksWithCompatibility.map((track) => (
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
