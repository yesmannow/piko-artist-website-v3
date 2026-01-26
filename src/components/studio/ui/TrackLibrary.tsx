"use client";

/**
 * TrackLibrary Component
 * 
 * Side/bottom drawer that displays all tracks from musician_tracks.json
 * Mobile: Bottom sheet
 * Desktop: Side panel
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';
import { TrackListing, Track } from './TrackListing';
import tracksData from '@/data/musician_tracks.json';
import { useStudioStore } from '@/store/useStudioStore';

interface TrackLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackLoaded?: (deck: 'A' | 'B') => void;
  inline?: boolean; // If true, render inline instead of as drawer
  panelId?: string;
}

export function TrackLibrary({ isOpen, onClose, onTrackLoaded, inline = false, panelId }: TrackLibraryProps) {
  const tracks = tracksData as Track[];
  const stemsCache = useStudioStore((state) => state.stemsCache);
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [bpmMin, setBpmMin] = useState<number>(0);
  const [bpmMax, setBpmMax] = useState<number>(220);

  const genres = useMemo(() => {
    const set = new Set(tracks.map((track) => track.genre).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [tracks]);

  const moods = useMemo(() => {
    const set = new Set(tracks.map((track) => track.mood).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
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

  const handleAnalyzeTrack = (track: Track) => {
    console.log(`[TrackLibrary] Analyze requested for ${track.trackId}`);
  };

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
      <div className="h-full flex flex-col" id={panelId} aria-hidden={!isOpen}>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-obsidian-900 border-l border-white/10 z-[101] flex flex-col shadow-2xl"
            id={panelId}
            role="dialog"
            aria-modal="true"
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
