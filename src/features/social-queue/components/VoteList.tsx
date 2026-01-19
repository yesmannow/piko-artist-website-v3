"use client";

import { useJamQueue } from '../hooks/useJamQueue';
import { useState, useCallback, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * VoteList - Component for displaying and voting on tracks
 *
 * Features:
 * - Mobile: Vote button on RIGHT side (thumb reach)
 * - Optimistic UI: Instant local update, background sync
 * - Error handling with rollback
 */
export function VoteList() {
  const { tracks, isLoading, error, voteForTrack } = useJamQueue();
  const [votedTracks, setVotedTracks] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile - must use useEffect, not conditional useState
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVote = useCallback(async (trackId: string) => {
    // Generate user ID (in production, use auth)
    const userId = `user_${Date.now()}_${Math.random()}`;

    // Check if already voted
    if (votedTracks.has(trackId)) {
      return;
    }

    try {
      await voteForTrack(trackId, userId);
      setVotedTracks((prev) => new Set(prev).add(trackId));
    } catch (error) {
      console.error('[VoteList] Vote failed:', error);
      // Optimistic update will be rolled back by the hook
    }
  }, [voteForTrack, votedTracks]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-white/60">
        Loading queue...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading queue: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-2xl font-bold text-white mb-4">Queue</h2>

      {tracks.length === 0 ? (
        <div className="text-center text-white/60 py-8">
          No tracks in queue
        </div>
      ) : (
        tracks.map((track) => {
          const hasVoted = votedTracks.has(track.id);

          return (
            <div
              key={track.id}
              className="bg-glass-surface border border-glass-border p-4 rounded-lg flex items-center justify-between gap-4"
            >
              {/* Track Info - Left */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">
                  {track.track_metadata.title}
                </div>
                <div className="text-sm text-white/60 truncate">
                  {track.track_metadata.artist}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {track.votes} votes • Score: {track.score.toFixed(2)}
                </div>
              </div>

              {/* Vote Button - Right (thumb-optimized on mobile) */}
              <button
                onClick={() => handleVote(track.id)}
                disabled={hasVoted}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center touch-manipulation transition-all ${
                  hasVoted
                    ? 'bg-[#FFD700] text-black'
                    : 'bg-[#00f0ff] text-black hover:bg-[#00d9ff]'
                } ${isMobile ? 'ml-auto' : ''}`}
                aria-label={hasVoted ? 'Voted' : 'Vote'}
              >
                <ArrowUp className="w-6 h-6" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
