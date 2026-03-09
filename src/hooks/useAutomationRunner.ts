'use client';

import { useEffect, useRef } from 'react';
import { useDeckStore } from '@/store/deckStore';
import { AudioEngine } from '@/lib/audioEngine';

/**
 * useAutomationRunner
 *
 * Watches a deck's automation state in the Zustand store.  Whenever the
 * volume automation points change the hook posts a SAMPLE_CURVE message to
 * the AudioEngine's singleton Bézier worker, receives the resulting
 * Float32Array, and schedules it on the deck's GainNode via
 * `AudioEngine.applyVolumeAutomation`.
 *
 * This hook should be mounted once per deck (e.g. inside the deck component).
 */
export function useAutomationRunner(deckId: 'A' | 'B') {
  const automation = useDeckStore(
    (state) => (deckId === 'A' ? state.deckA : state.deckB).track?.automation,
  );
  const duration = useDeckStore(
    (state) => (deckId === 'A' ? state.deckA : state.deckB).duration,
  );

  // Keep a stable ref to the worker's onmessage handler so we can swap it
  // without creating duplicate workers.
  const onMessageRef = useRef<((e: MessageEvent) => void) | null>(null);

  // Wire up the response handler once
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    const worker = engine.getBezierWorker();
    if (!worker) return;

    const handler = (e: MessageEvent) => {
      if (e.data.type === 'CURVE_READY' && e.data.deckId === deckId) {
        const curve: Float32Array = e.data.curve;
        const curveDuration: number = e.data.duration;
        engine.applyVolumeAutomation(deckId, curve, curveDuration);
      } else if (e.data.type === 'CURVE_ERROR') {
        // Surface worker math errors to the Sentry SDK via a regular Error object.
        const workerError = new Error(
          `[bezier.worker] ${e.data.message ?? 'Unknown error'}`,
        );
        if (e.data.stack) workerError.stack = e.data.stack;
        console.error(workerError);
        // Forward to Sentry using its standard browser SDK interface.
        // Works whether Sentry was initialised via @sentry/nextjs or loaded
        // via CDN — both expose `window.Sentry.captureException`.
        if (typeof window !== 'undefined') {
          const Sentry = (window as any).Sentry;
          if (Sentry?.captureException) Sentry.captureException(workerError);
        }
      }
    };

    onMessageRef.current = handler;
    worker.addEventListener('message', handler);

    return () => {
      worker.removeEventListener('message', handler);
      onMessageRef.current = null;
    };
  }, [deckId]);

  // Re-sample whenever automation or track duration changes
  useEffect(() => {
    if (!automation || !duration || duration <= 0) return;

    const volumeLane = automation.find((a) => a.param === 'volume');
    if (!volumeLane || volumeLane.points.length === 0) return;

    const engine = AudioEngine.getInstance();
    const worker = engine.getBezierWorker();
    if (!worker) return;

    worker.postMessage({
      type: 'SAMPLE_CURVE',
      deckId,
      points: volumeLane.points,
      numSamples: 4096,
      duration,
      isVolume: true,
    });
  }, [automation, duration, deckId]);
}
