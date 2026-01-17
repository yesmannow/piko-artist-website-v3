"use client";

import { useEffect, useRef } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";

/**
 * Dev-only helper: logs RMS and deck gains periodically.
 * Mount this in dev builds to verify signal flow.
 */
export function DevAudioDebug({ intervalMs = 500 }: { intervalMs?: number }) {
  const bufferRef = useRef<Uint8Array | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      const engine = await ensureAudioEngineReady();
      const analyser = engine.debugDeckNode("deckA")
        ? engine.decks.get("deckA")?.analyser
        : null;
      if (!analyser) return;

      bufferRef.current = new Uint8Array(analyser.fftSize);

      timerRef.current = setInterval(() => {
        if (!mounted || !bufferRef.current) return;
        const rmsA = engine.getRMS("deckA").toFixed(3);
        const rmsB = engine.getRMS("deckB").toFixed(3);
        const debugA = engine.debugDeckNode("deckA");
        const debugB = engine.debugDeckNode("deckB");
        console.log("[DevAudioDebug] RMS A/B:", rmsA, rmsB, "DeckGains:", {
          A: debugA?.deckGain,
          B: debugB?.deckGain,
        });
      }, intervalMs);
    };

    start();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs]);

  return null;
}
