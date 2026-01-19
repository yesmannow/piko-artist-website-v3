"use client";

import { useCallback, useRef, useState } from "react";
import { StudioEngine } from "../lib/StudioEngine";

interface UseTrackLoaderState {
  audioBuffer: AudioBuffer | null;
  isLoading: boolean;
  error: string | null;
  loadTrack: (url: string) => Promise<AudioBuffer | null>;
}

/**
 * useTrackLoader
 *
 * Safe, non-crashy fetch/decode loader.
 * - Uses `fetch(..., { cache: "default" })` (avoids cache mode issues seen in some browsers).
 * - Initializes/resumes AudioContext only when `loadTrack` is called (call from user gesture).
 */
export function useTrackLoader(): UseTrackLoaderState {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadTrack = useCallback(async (url: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Ensure context exists + is running (must be triggered from user gesture).
      const engine = StudioEngine.getInstance();
      const ctx = await engine.initFromUserGesture();

      const res = await fetch(url, { cache: "default", signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch audio (${res.status}): ${url}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);

      if (controller.signal.aborted) {
        return null;
      }

      setAudioBuffer(decoded);
      return decoded;
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return null;
      }
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  return { audioBuffer, isLoading, error, loadTrack };
}

