/**
 * useLibrarySync Hook
 *
 * Phase VII: Intelligent Library Sync
 *
 * Syncs tracks from local /api/tracks (static manifest) to IndexedDB on app mount.
 * Uses deterministic artwork assignment based on track ID hash.
 * Preserves existing analysis data (BPM/Key) for tracks already in DB.
 *
 * Usage:
 * ```tsx
 * const { isLoading, error, stats } = useLibrarySync();
 * ```
 */

import { useEffect, useState } from 'react';
import { db, bulkImportTracks, getDatabaseStats, type Track } from '@/lib/db';

interface SyncStats {
  total: number;
  analyzed: number;
  unanalyzed: number;
  analyzing: number;
  percentAnalyzed: number;
  newTracksAdded: number;
}

interface UseLibrarySyncReturn {
  isLoading: boolean;
  error: string | null;
  stats: SyncStats | null;
  refetch: () => Promise<void>;
}

export function useLibrarySync(): UseLibrarySyncReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);

  const syncLibrary = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[LibrarySync] Starting sync from local manifest...');

      // Step A: Fetch tracks from local /api/tracks
      const response = await fetch('/api/tracks');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const localTracks = data.tracks || [];
      console.log(`[LibrarySync] Fetched ${localTracks.length} tracks from local manifest`);

      if (localTracks.length === 0) {
        const dbStats = await getDatabaseStats();
        setStats({ ...dbStats, newTracksAdded: 0 });
        setIsLoading(false);
        return;
      }

      // Step B: Get existing tracks from IndexedDB
      const existingTracks = await db.tracks.toArray();
      const existingUrls = new Set(
        existingTracks.map((t) => t.url).filter((u): u is string => !!u),
      );

      console.log(`[LibrarySync] Found ${existingTracks.length} existing tracks in DB`);

      // Step C: Sync logic – add new tracks with deterministic artwork
      const newTracks: Omit<Track, 'id'>[] = [];

      localTracks.forEach((track: { url: string; title: string; artworkUrl?: string }) => {
        // Skip if already exists
        if (existingUrls.has(track.url)) {
          return;
        }

        // Parse artist from title (e.g., "Artist - Title")
        const parts = track.title.split(' - ');
        const artist = parts.length >= 2 ? parts[0].trim() : 'Unknown Artist';
        const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : track.title;

        // Use deterministic artwork from manifest
        const artworkUrl = track.artworkUrl || '/images/tracks/vinyl-1595847_1280.jpg';

        newTracks.push({
          url: track.url,
          title,
          artist,
          artworkUrl,
          status: 'pending',
          createdAt: Date.now(),
          // Placeholders filled in once the track is analyzed
          bpm: '',
          key: '',
          duration: '',
          energy: '',
          hasVocal: false,
        });
      });

      // Bulk import new tracks
      if (newTracks.length > 0) {
        console.log(`[LibrarySync] Adding ${newTracks.length} new tracks to DB`);
        await bulkImportTracks(newTracks);
      } else {
        console.log('[LibrarySync] No new tracks to add');
      }

      // Get updated stats
      const dbStats = await getDatabaseStats();
      const finalStats = {
        ...dbStats,
        newTracksAdded: newTracks.length,
      };

      setStats(finalStats);
      console.log('[LibrarySync] Sync complete', finalStats);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
      console.error('[LibrarySync] Error:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync on mount
  useEffect(() => {
    syncLibrary();

    // Optional: Set up periodic sync (every 5 minutes)
    const interval = setInterval(() => {
      console.log('[LibrarySync] Running periodic sync...');
      syncLibrary();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isLoading,
    error,
    stats,
    refetch: syncLibrary,
  };
}
