/**
 * useDeckTransport Hook
 *
 * Handles all transport controls for a deck:
 * - Play/pause/stop
 * - Seeking (skip forward/back)
 * - Scratching (jog wheel interaction)
 */

import { useCallback, useRef } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useStore } from '@/store/useStore';

interface UseDeckTransportProps {
  deckId: 'A' | 'B';
}

export function useDeckTransport({ deckId }: UseDeckTransportProps) {
  const { play, pause, stop, seekTo, getPlaybackPosition, getDeckDuration } = useAudioEngine();
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const setDeckPlaying = useStore((state) => state.setDeckPlaying);

  const scratchState = useRef<{
    centerX: number;
    centerY: number;
    lastAngle: number;
    wasPlaying: boolean;
    position: number;
  } | null>(null);

  const handlePlay = useCallback(() => {
    play(deckId);
    setDeckPlaying(deckId, true);
  }, [deckId, play, setDeckPlaying]);

  const handlePause = useCallback(() => {
    pause(deckId);
    setDeckPlaying(deckId, false);
  }, [deckId, pause, setDeckPlaying]);

  const handleStop = useCallback(() => {
    stop(deckId);
    setDeckPlaying(deckId, false);
  }, [deckId, setDeckPlaying, stop]);

  const handleSeek = useCallback((seconds: number) => {
    const currentPos = getPlaybackPosition(deckId);
    seekTo(deckId, Math.max(0, currentPos + seconds));
  }, [deckId, getPlaybackPosition, seekTo]);

  const handleScratchStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

    scratchState.current = {
      centerX,
      centerY,
      lastAngle: angle,
      wasPlaying: deck.isPlaying,
      position: getPlaybackPosition(deckId),
    };

    if (deck.isPlaying) {
      pause(deckId);
      setDeckPlaying(deckId, false);
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  }, [deck.isPlaying, deckId, getPlaybackPosition, pause, setDeckPlaying]);

  const handleScratchMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!scratchState.current) return;
    const { centerX, centerY } = scratchState.current;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    let delta = angle - scratchState.current.lastAngle;

    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    scratchState.current.lastAngle = angle;

    const duration = getDeckDuration(deckId);
    const scratchScale = 0.6; // seconds per radian of platter travel
    const nextPosition = Math.max(
      0,
      Math.min(duration, scratchState.current.position + delta * scratchScale)
    );

    scratchState.current.position = nextPosition;
    seekTo(deckId, nextPosition);
  }, [deckId, getDeckDuration, seekTo]);

  const handleScratchEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = scratchState.current;
    if (!state) return;
    scratchState.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (state.wasPlaying) {
      play(deckId);
      setDeckPlaying(deckId, true);
    }
  }, [deckId, play, setDeckPlaying]);

  return {
    handlePlay,
    handlePause,
    handleStop,
    handleSeek,
    handleScratchStart,
    handleScratchMove,
    handleScratchEnd,
  };
}
