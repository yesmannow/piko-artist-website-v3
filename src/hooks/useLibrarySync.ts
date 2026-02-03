/**
 * useLibrarySync Hook
 *
 * Phase VII: Intelligent Library Sync
 *
 * Syncs tracks from Cloudflare R2 to local IndexedDB on app mount.
 * Assigns local artwork using round-robin distribution.
 * Preserves existing analysis data (BPM/Key) for tracks already in DB.
 *
 * Usage:
 * ```tsx
 * const { isLoading, error, stats } = useLibrarySync();
 * ```
 */

import { useEffect, useState } from 'react';
import { db, bulkImportTracks, getDatabaseStats, type Track } from '@/lib/db';

// All local artwork images (round-robin assignment)
const ARTWORK_IMAGES = [
  '/images/tracks/abstract-1846847_1280.jpg',
  '/images/tracks/architecture-3189972_1280.jpg',
  '/images/tracks/aurora-borealis-9267515_1280.jpg',
  '/images/tracks/background-1833056_1280.jpg',
  '/images/tracks/bicycle-3045580_1280.jpg',
  '/images/tracks/dj-2581269_1280.jpg',
  '/images/tracks/gong-8255081_1280.jpg',
  '/images/tracks/graffiti-1476119_1280.jpg',
  '/images/tracks/graffiti-3750912_1280.jpg',
  '/images/tracks/hamburg-2718329_1280.jpg',
  '/images/tracks/skateboard-447147_1280.jpg',
  '/images/tracks/skull-and-crossbones-414207_1280.jpg',
  '/images/tracks/starry-sky-1655503_1280.jpg',
  '/images/tracks/street-art-1499524_1280.jpg',
  '/images/tracks/tube-7260586_1280.jpg',
  '/images/tracks/vinyl-1595847_1280.jpg',
  '/images/tracks/wall-2583885_1280.jpg',
  '/images/tracks/woman-3633737_1280.jpg',
];

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

      console.log('[LibrarySync] Starting sync...');

      // Step A: Fetch tracks from R2 API
      const response = await fetch('/api/tracks');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const r2Tracks = data.tracks || [];
      console.log(`[LibrarySync] Fetched ${r2Tracks.length} tracks from R2`);

      if (r2Tracks.length === 0) {
        const dbStats = await getDatabaseStats();
        setStats({ ...dbStats, newTracksAdded: 0 });
        setIsLoading(false);
        return;
      }

      // Step B: Get existing tracks from IndexedDB
      const existingTracks = await db.tracks.toArray();
      const existingUrls = new Set(existingTracks.map(t => t.url));

      console.log(`[LibrarySync] Found ${existingTracks.length} existing tracks in DB`);

      // Step C: Sync logic - Add new tracks with artwork
      const newTracks: Omit<Track, 'id'>[] = [];

      r2Tracks.forEach((r2Track: any, index: number) => {
        // Skip if already exists
        if (existingUrls.has(r2Track.url)) {
          return;
        }

        // Parse artist from title (R2 API should provide this)
        const parts = r2Track.title.split(' - ');
        const artist = parts.length >= 2 ? parts[0].trim() : 'Unknown Artist';
        const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : r2Track.title;

        // Round-robin artwork assignment
        const artworkIndex = (existingTracks.length + newTracks.length) % ARTWORK_IMAGES.length;
        const artwork = ARTWORK_IMAGES[artworkIndex];

        newTracks.push({
          url: r2Track.url,
          title,
          artist,
          artwork,
          dateAdded: new Date(),
          status: 'unanalyzed',
          fileSize: r2Track.size,
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoading,
    error,
    stats,
    refetch: syncLibrary,
  };
}
