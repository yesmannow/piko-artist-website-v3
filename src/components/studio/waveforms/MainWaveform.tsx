"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { WaveformMini } from "./WaveformMini";
import { useStore } from "@/store/useStore";
import { db } from "@/lib/db";
import type { WaveformPeaks } from "@/lib/db";

type MainWaveformProps = {
  deckId: "A" | "B";
  title?: string;
  url?: string;
  beatGrid?: number[];
};

export function MainWaveform({ deckId, title, url, beatGrid }: MainWaveformProps) {
  const { getPlaybackPosition, getDeckDuration, seekTo } = useAudioEngine();
  const deck = useStore((state) => state[deckId === "A" ? "deckA" : "deckB"]);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cachedPeaks, setCachedPeaks] = useState<WaveformPeaks | null>(null);
  const [peaksCacheStatus, setPeaksCacheStatus] = useState<'checking' | 'cached' | 'building' | 'none'>('none');
  const frameRef = useRef<number | null>(null);

  // Phase S11.3: Load precomputed peaks from Dexie
  const loadPeaks = useCallback(async (trackKey: string) => {
    setPeaksCacheStatus('checking');
    try {
      const cached = await db.waveformPeaks.get(trackKey);
      if (cached) {
        setCachedPeaks(cached);
        setPeaksCacheStatus('cached');
        return cached;
      }
      setPeaksCacheStatus('none');
      return null;
    } catch (err) {
      console.error(`[MainWaveform Deck ${deckId}] Failed to load peaks from Dexie:`, err);
      setPeaksCacheStatus('none');
      return null;
    }
  }, [deckId]);

  // Phase S11.3: Callback for WaveformMini to update peaks status
  const onPeaksComputed = useCallback((peaks: number[][], durationSec: number) => {
    const trackKey = deck.trackKey;
    if (!trackKey) return;

    setPeaksCacheStatus('building');
    const peaksEntry: WaveformPeaks = {
      trackKey,
      durationSec,
      peaks,
      channels: peaks.length,
      algoVersion: 1,
      updatedAt: new Date()
    };
    db.waveformPeaks.put(peaksEntry).then(() => {
      setCachedPeaks(peaksEntry);
      setPeaksCacheStatus('cached');
    }).catch(err => {
      console.error(`[MainWaveform Deck ${deckId}] Failed to cache peaks:`, err);
      setPeaksCacheStatus('none');
    });
  }, [deck.trackKey, deckId]);

  // Phase S11.3: Load peaks on track change
  useEffect(() => {
    const loadPeaksAsync = async () => {
      const trackKey = deck.trackKey;
      if (!trackKey) {
        setCachedPeaks(null);
        setPeaksCacheStatus('none');
        return;
      }

      await loadPeaks(trackKey);
    };

    void loadPeaksAsync();
  }, [deck.trackKey, loadPeaks]);

  useEffect(() => {
    const tick = () => {
      setPosition(getPlaybackPosition(deckId));
      setDuration(getDeckDuration(deckId));
      frameRef.current = globalThis.requestAnimationFrame(tick);
    };
    frameRef.current = globalThis.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
        globalThis.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [deckId, getDeckDuration, getPlaybackPosition]);

  if (!url) {
    return (
    <div className="main-waveform" data-testid="main-waveform">
      <div className="main-waveform-header">
        <span>{title ?? `Deck ${deckId}`}</span>
        <span className="main-waveform-status">No track loaded</span>
      </div>
      <div className="main-waveform-empty" />
      </div>
    );
  }

  // Phase S11.3: Build status message
  const statusText = duration > 0 ? "Waveform" : "Analyzing";

  let statusBadge = "";
  if (peaksCacheStatus === 'cached') {
    statusBadge = " • WAVE: CACHED";
  } else if (peaksCacheStatus === 'building') {
    statusBadge = " • WAVE: BUILDING";
  } else if (peaksCacheStatus === 'checking') {
    statusBadge = " • WAVE: CHECKING";
  }

  return (
    <div className="main-waveform" data-testid="main-waveform">
      <div className="main-waveform-header">
        <span>{title ?? `Deck ${deckId}`}</span>
        <span className="main-waveform-status">{statusText}{statusBadge}</span>
      </div>
      <WaveformMini
        url={url}
        color={deckId === "A" ? "#4af2c5" : "#7c8dff"}
        beatGrid={beatGrid}
        playhead={position}
        durationSeconds={duration > 0 ? duration : cachedPeaks?.durationSec}
        precomputedPeaks={cachedPeaks?.peaks}
        onPeaksComputed={onPeaksComputed}
        onSeek={(seconds) => seekTo(deckId, seconds)}
      />
    </div>
  );
}
