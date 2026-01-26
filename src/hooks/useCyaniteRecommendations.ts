"use client";

/**
 * useCyaniteRecommendations Hook
 * 
 * Provides function to fetch track recommendations from Cyanite.ai
 * Manages loading/error states and caches results
 */

import { useState, useCallback } from 'react';

export interface Recommendation {
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

interface UseCyaniteRecommendationsReturn {
  getRecommendations: (bpm: number, energy: number) => Promise<Recommendation[]>;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
}

// Cache to avoid duplicate API calls
const cache = new Map<string, { data: Recommendation[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCyaniteRecommendations(): UseCyaniteRecommendationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured] = useState(true); // Assume configured until proven otherwise

  const getRecommendations = useCallback(async (bpm: number, energy: number): Promise<Recommendation[]> => {
    // Create cache key
    const cacheKey = `${Math.round(bpm)}-${Math.round(energy * 10)}`;
    const cached = cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bpm, energy }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const recommendations = data.recommendations || [];

      // Cache results
      cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now(),
      });

      setLoading(false);
      return recommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(errorMessage);
      setLoading(false);
      console.error('[useCyaniteRecommendations] Error:', err);
      return [];
    }
  }, []);

  return {
    getRecommendations,
    loading,
    error,
    isConfigured,
  };
}
