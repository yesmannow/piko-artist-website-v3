/**
 * useDeckWaveformSync Hook
 *
 * Synchronizes playback position and duration between audio engine and UI/store
 * Updates progress for waveform display
 */

import { useEffect, useRef, useState } from 'react';
import { useAudioEngine } from '@/hooks/audio/useAudioEngine';
import { useStore } from '@/store/useStore';
import { useStudioStore } from '@/store/useStudioStore';

interface UseDeckWaveformSyncProps {
  deckId: 'A' | 'B';
}

const UI_UPDATE_INTERVAL_MS = 50;
const STORE_UPDATE_INTERVAL_MS = 33;
const PROGRESS_EPSILON = 0.005;

export function useDeckWaveformSync({ deckId }: UseDeckWaveformSyncProps) {
  const { getPlaybackPosition, getDeckDuration } = useAudioEngine();
  const isAppActive = useStore((state) => state.isAppActive);
  const studioDeckKey = deckId === 'A' ? 'deckA' : 'deckB';
  const updateDeckTime = useStudioStore((state) => state.updateDeckTime);
  const setDeckDurationStore = useStudioStore((state) => state.setDeckDuration);

  const [progress, setProgress] = useState(0);
  const [deckDuration, setDeckDuration] = useState(0);

  const lastUiUpdateRef = useRef(0);
  const lastStoreUpdateRef = useRef(0);
  const progressRef = useRef(0);
  const durationRef = useRef(0);

  useEffect(() => {
    let frameId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Global = globalThis as any;

    const tick = (time: number) => {
      if (!isAppActive) {
        frameId = Global.requestAnimationFrame(tick);
        return;
      }

      const duration = getDeckDuration(deckId);
      const position = getPlaybackPosition(deckId);
      const nextProgress = duration > 0 ? Math.min(1, position / duration) : 0;

      // Update store at fixed intervals
      if (time - lastStoreUpdateRef.current >= STORE_UPDATE_INTERVAL_MS) {
        updateDeckTime(studioDeckKey, position);
        if (Math.abs(duration - durationRef.current) > 0.1) {
          setDeckDurationStore(studioDeckKey, duration);
        }
        lastStoreUpdateRef.current = time;
      }

      // Update UI when needed
      const progressDelta = Math.abs(nextProgress - progressRef.current);
      const durationDelta = Math.abs(duration - durationRef.current);
      if (
        time - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS ||
        progressDelta >= PROGRESS_EPSILON ||
        durationDelta >= 0.1
      ) {
        progressRef.current = nextProgress;
        durationRef.current = duration;
        setProgress(nextProgress);
        setDeckDuration(duration);
        lastUiUpdateRef.current = time;
      }

      frameId = Global.requestAnimationFrame(tick);
    };

    frameId = Global.requestAnimationFrame(tick);

    return () => {
      Global.cancelAnimationFrame(frameId);
    };
  }, [deckId, getDeckDuration, getPlaybackPosition, isAppActive, setDeckDurationStore, studioDeckKey, updateDeckTime]);

  return {
    progress,
    deckDuration,
  };
}
