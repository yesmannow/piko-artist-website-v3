"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { QueueTrack } from '../types';

/**
 * useJamQueue - Hook for real-time voting queue
 *
 * Features:
 * - Supabase real-time subscription
 * - Optimistic UI updates
 * - Automatic score recalculation (server-side)
 */
export function useJamQueue(roomId?: string) {
  const [tracks, setTracks] = useState<QueueTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial queue
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const { data, error } = await supabase
          .from('voting_queue')
          .select('*')
          .eq('status', 'queued')
          .order('score', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        setTracks(data || []);
        setIsLoading(false);
      } catch (err) {
        console.error('[useJamQueue] Failed to fetch queue:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('voting_queue_changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'voting_queue',
        },
        (payload: any) => {
          // Handle real-time updates
          const eventType = payload.eventType || (payload as any).type;
          if (eventType === 'INSERT' || eventType === 'INSERT') {
            const newTrack = (payload.new || payload) as QueueTrack;
            if (newTrack) {
              setTracks((prev) => {
                return [...prev, newTrack].sort((a, b) => {
                  if (b.score !== a.score) return b.score - a.score;
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });
              });
            }
          } else if (eventType === 'UPDATE' && payload.new) {
            setTracks((prev) =>
              prev.map((track) =>
                track.id === (payload.new as QueueTrack).id ? (payload.new as QueueTrack) : track
              ).sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              })
            );
          } else if (eventType === 'DELETE' && payload.old) {
            setTracks((prev) => prev.filter((track) => track.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Vote for a track (with optimistic update)
   */
  const voteForTrack = useCallback(async (trackId: string, userId: string) => {
    // Optimistic update: increment vote count immediately
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? { ...track, votes: track.votes + 1 }
          : track
      ).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
    );

    try {
      // Insert vote
      const { error } = await supabase.from('votes').insert({
        queue_id: trackId,
        user_id: userId,
      });

      if (error) {
        // Rollback optimistic update
        setTracks((prev) =>
          prev.map((track) =>
            track.id === trackId
              ? { ...track, votes: Math.max(0, track.votes - 1) }
              : track
          )
        );
        throw error;
      }

      // Server will trigger score recalculation via trigger
      // Real-time subscription will update the score automatically
    } catch (err) {
      console.error('[useJamQueue] Failed to vote:', err);
      throw err;
    }
  }, []);

  /**
   * Propose a new track to the queue
   */
  const proposeTrack = useCallback(async (trackMetadata: QueueTrack['track_metadata']) => {
    const { data, error } = await supabase
      .from('voting_queue')
      .insert({
        track_metadata: trackMetadata,
        votes: 0,
        status: 'queued',
      })
      .select()
      .single();

    if (error) throw error;

    return data as QueueTrack;
  }, []);

  return {
    tracks,
    isLoading,
    error,
    voteForTrack,
    proposeTrack,
  };
}
