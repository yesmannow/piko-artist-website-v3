/**
 * useSmartTrackAnalysis.ts - AI-Driven "Smart" Metadata Hook
 *
 * Phase IX: AI Insights & Masterpiece Layout
 *
 * This hook intelligently analyzes tracks from the R2-synced library using Essentia.js
 * and persists results to IndexedDB (Dexie.js) for instant loading on subsequent plays.
 *
 * Key Features:
 * - BPM Detection (Rhythm Extraction)
 * - Key Detection (mapped to Camelot Wheel for harmonic mixing)
 * - Energy Level (0.0-1.0 scale for dynamic mixing)
 * - One-time analysis with persistent caching
 * - UI feedback during analysis
 *
 * Architecture:
 * - Runs in Web Worker (zero UI blocking)
 * - Uses IndexedDB for persistence (no Supabase)
 * - Integrates with existing useTrackAnalysis hook
 */

import { useState, useCallback, useRef } from 'react';
import { db, updateTrackAnalysis, type Track } from '@/lib/db';
import { useTrackAnalysis } from './useTrackAnalysis';

// Camelot Wheel mapping for harmonic mixing
const KEY_TO_CAMELOT: Record<string, string> = {
  // Major keys
  'C major': '8B',
  'G major': '9B',
  'D major': '10B',
  'A major': '11B',
  'E major': '12B',
  'B major': '1B',
  'F# major': '2B',
  'Gb major': '2B',
  'Db major': '3B',
  'C# major': '3B',
  'Ab major': '4B',
  'Eb major': '5B',
  'Bb major': '6B',
  'F major': '7B',

  // Minor keys
  'A minor': '8A',
  'E minor': '9A',
  'B minor': '10A',
  'F# minor': '11A',
  'C# minor': '12A',
  'G# minor': '1A',
  'Ab minor': '1A',
  'Eb minor': '2A',
  'D# minor': '2A',
  'Bb minor': '3A',
  'A# minor': '3A',
  'F minor': '4A',
  'C minor': '5A',
  'G minor': '6A',
  'D minor': '7A',
};

export interface SmartAnalysisResult {
  bpm: number;
  key: string; // Musical key (e.g., "C major")
  camelotKey: string; // Camelot notation (e.g., "8B")
  energy: number; // 0.0-1.0
  confidence: number; // Analysis confidence score
}

export interface UseSmartTrackAnalysisReturn {
  analyzeTrack: (track: Track) => Promise<SmartAnalysisResult>;
  analyzeIfNeeded: (track: Track) => Promise<SmartAnalysisResult | null>;
  isAnalyzing: boolean;
  currentTrack: string | null;
  progress: number; // 0-100
  error: string | null;
}

/**
 * Hook for intelligently analyzing tracks with caching
 */
export function useSmartTrackAnalysis(): UseSmartTrackAnalysisReturn {
  const { analyze, isAnalyzing: baseIsAnalyzing, error: baseError } = useTrackAnalysis();
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const analysisCache = useRef<Map<string, SmartAnalysisResult>>(new Map());

  /**
   * Map musical key to Camelot notation
   */
  const toCamelotKey = useCallback((key: string): string => {
    const normalized = key.trim();
    return KEY_TO_CAMELOT[normalized] || '??';
  }, []);

  /**
   * Analyze a track and persist results to IndexedDB
   *
   * @param track - Track object from Dexie
   * @returns Analysis results with Camelot mapping
   */
  const analyzeTrack = useCallback(async (track: Track): Promise<SmartAnalysisResult> => {
    // Check cache first
    const cached = analysisCache.current.get(track.url);
    if (cached) {
      console.log('[SmartAnalysis] Using cached result for:', track.title);
      return cached;
    }

    setCurrentTrack(track.title);
    setProgress(10);

    try {
      console.log('[SmartAnalysis] Starting analysis for:', track.title);

      // Update track status to 'analyzing'
      await db.tracks.where('url').equals(track.url).modify({ status: 'analyzing' });
      setProgress(20);

      // Perform analysis using Essentia.js worker
      const rawResult = await analyze(track.url);
      setProgress(80);

      // Map to Camelot notation
      const camelotKey = toCamelotKey(rawResult.key || '');

      const result: SmartAnalysisResult = {
        bpm: Math.round(rawResult.bpm || 0),
        key: rawResult.key || 'Unknown',
        camelotKey,
        energy: rawResult.energy || 0,
        confidence: rawResult.danceability || 0, // Use danceability as confidence proxy
      };

      console.log('[SmartAnalysis] Analysis complete:', result);
      setProgress(90);

      // Persist to IndexedDB
      await updateTrackAnalysis(track.url, {
        bpm: result.bpm,
        key: `${result.key} (${result.camelotKey})`,
        analysisData: JSON.stringify({
          bpm: result.bpm,
          key: result.key,
          camelotKey: result.camelotKey,
          energy: result.energy,
          confidence: result.confidence,
          analyzedAt: new Date().toISOString(),
        }),
      });

      console.log('[SmartAnalysis] Persisted to IndexedDB:', track.url);
      setProgress(100);

      // Cache result
      analysisCache.current.set(track.url, result);

      setCurrentTrack(null);
      setProgress(0);

      return result;
    } catch (error) {
      console.error('[SmartAnalysis] Error analyzing track:', error);

      // Mark as error in DB
      await db.tracks.where('url').equals(track.url).modify({
        status: 'error'
      });

      setCurrentTrack(null);
      setProgress(0);

      throw error;
    }
  }, [analyze, toCamelotKey]);

  /**
   * Analyze track only if not already analyzed
   * This is the "smart" part - avoids redundant analysis
   *
   * @param track - Track object from Dexie
   * @returns Analysis results or null if already analyzed
   */
  const analyzeIfNeeded = useCallback(async (track: Track): Promise<SmartAnalysisResult | null> => {
    // Check if already analyzed
    if (track.status === 'analyzed' && track.bpm && track.key) {
      console.log('[SmartAnalysis] Track already analyzed:', track.title);

      // Parse existing analysis data
      try {
        const analysisData = track.analysisData ? JSON.parse(track.analysisData) : null;

        if (analysisData) {
          const result: SmartAnalysisResult = {
            bpm: analysisData.bpm || track.bpm || 0,
            key: analysisData.key || track.key || 'Unknown',
            camelotKey: analysisData.camelotKey || toCamelotKey(track.key || ''),
            energy: analysisData.energy || 0,
            confidence: analysisData.confidence || 0,
          };

          // Cache it
          analysisCache.current.set(track.url, result);

          return result;
        }
      } catch (error) {
        console.warn('[SmartAnalysis] Failed to parse existing analysis data:', error);
      }
    }

    // Track needs analysis
    if (track.status === 'unanalyzed' || track.status === 'error') {
      console.log('[SmartAnalysis] Track needs analysis:', track.title);
      return await analyzeTrack(track);
    }

    // Track is currently being analyzed
    if (track.status === 'analyzing') {
      console.log('[SmartAnalysis] Track is currently being analyzed:', track.title);
      return null;
    }

    return null;
  }, [analyzeTrack, toCamelotKey]);

  return {
    analyzeTrack,
    analyzeIfNeeded,
    isAnalyzing: baseIsAnalyzing,
    currentTrack,
    progress,
    error: baseError,
  };
}

/**
 * Helper: Get compatible tracks for harmonic mixing
 *
 * Compatible keys are:
 * - Same key
 * - +/- 1 on Camelot wheel (adjacent keys)
 * - Relative major/minor (e.g., 8A ↔ 8B)
 *
 * @param currentCamelot - Current track's Camelot key
 * @param tracks - Array of tracks to filter
 * @returns Compatible tracks for smooth mixing
 */
export function getCompatibleTracks(currentCamelot: string, tracks: Track[]): Track[] {
  if (!currentCamelot || currentCamelot === '??') {
    return tracks;
  }

  const match = currentCamelot.match(/^(\d+)([AB])$/);
  if (!match) {
    return tracks;
  }

  const [, numStr, letter] = match;
  const num = parseInt(numStr, 10);
  const oppositeLetter = letter === 'A' ? 'B' : 'A';

  // Calculate compatible keys
  const prevNum = num === 1 ? 12 : num - 1;
  const nextNum = num === 12 ? 1 : num + 1;

  const compatibleKeys = new Set([
    currentCamelot,                    // Same key
    `${num}${oppositeLetter}`,        // Relative major/minor
    `${prevNum}${letter}`,            // -1 on wheel
    `${nextNum}${letter}`,            // +1 on wheel
  ]);

  return tracks.filter(track => {
    if (!track.key) return false;

    // Extract Camelot notation from key string
    const camelotMatch = track.key.match(/\(([0-9]{1,2}[AB])\)/);
    if (!camelotMatch) return false;

    return compatibleKeys.has(camelotMatch[1]);
  });
}

/**
 * Helper: Get energy-matched tracks
 *
 * @param targetEnergy - Target energy level (0.0-1.0)
 * @param tracks - Array of tracks to filter
 * @param tolerance - Acceptable energy difference (default: 0.15)
 * @returns Tracks within energy range
 */
export function getEnergyMatchedTracks(
  targetEnergy: number,
  tracks: Track[],
  tolerance: number = 0.15
): Track[] {
  return tracks.filter(track => {
    if (!track.analysisData) return false;

    try {
      const data = JSON.parse(track.analysisData);
      const energy = data.energy || 0;

      return Math.abs(energy - targetEnergy) <= tolerance;
    } catch {
      return false;
    }
  });
}
