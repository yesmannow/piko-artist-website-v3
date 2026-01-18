import { useEffect, useRef, useState } from "react";

// Shared Web Audio singletons to prevent InvalidStateError
let __sharedAudioContext: AudioContext | null = null;
const __mediaSourceMap = new WeakMap<
  HTMLMediaElement,
  MediaElementAudioSourceNode
>();

export function getSharedAudioContext(): AudioContext {
  if (!__sharedAudioContext) {
    const AC = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext) as unknown as typeof AudioContext;
    __sharedAudioContext = new AC();
  }
  return __sharedAudioContext;
}

export function getOrCreateMediaSourceFor(
  el: HTMLMediaElement,
): MediaElementAudioSourceNode {
  const existing = __mediaSourceMap.get(el);
  if (existing) return existing;
  const ac = getSharedAudioContext();
  const src = ac.createMediaElementSource(el);
  __mediaSourceMap.set(el, src);
  return src;
}

interface AudioAnalyserResult {
  bass: number; // 0-1, low frequencies (0-200Hz)
  mid: number; // 0-1, mid frequencies (200Hz-2kHz)
  high: number; // 0-1, high frequencies (2kHz+)
  overall: number; // 0-1, overall level
  dataArray: Uint8Array | null;
}

/**
 * Hook for audio analysis using Web Audio API
 * Analyzes audio from video element (YouTube iframe or HTML5 video)
 */
export function useAudioAnalyser(
  videoElement: HTMLVideoElement | HTMLIFrameElement | null,
  enabled = true,
): AudioAnalyserResult {
  const [levels, setLevels] = useState<AudioAnalyserResult>({
    bass: 0,
    mid: 0,
    high: 0,
    overall: 0,
    dataArray: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!enabled || !videoElement) {
      setLevels({ bass: 0, mid: 0, high: 0, overall: 0, dataArray: null });
      return;
    }

    // Initialize shared AudioContext
    const audioContext = getSharedAudioContext();
    audioContextRef.current = audioContext;

    // Create analyser
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    // For HTML5 video elements
    if (videoElement instanceof HTMLVideoElement) {
      try {
        const source = getOrCreateMediaSourceFor(videoElement);
        source.connect(analyser);
        // CRITICAL: Connect analyser to destination so audio is actually heard
        analyser.connect(audioContext.destination);
        sourceRef.current = source;
      } catch (error) {
        console.warn("Audio source already connected or unavailable:", error);
      }
    }
    // For YouTube iframes, we can't directly access audio
    // This would require YouTube IFrame API or a workaround
    // For now, we'll return zero levels for iframes

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(
      new ArrayBuffer(bufferLength),
    );
    dataArrayRef.current = dataArray;

    const updateLevels = () => {
      if (!analyser || !dataArrayRef.current) return;

      analyser.getByteFrequencyData(dataArrayRef.current);
      const data = dataArrayRef.current;

      // Frequency bands (assuming 44.1kHz sample rate, 256 FFT)
      const lowEnd = Math.floor((200 / 22050) * bufferLength);
      const midEnd = Math.floor((2000 / 22050) * bufferLength);

      let lowSum = 0;
      let midSum = 0;
      let highSum = 0;
      let overallSum = 0;

      for (let i = 0; i < bufferLength; i++) {
        const value = data[i] / 255; // Normalize to 0-1
        overallSum += value;

        if (i < lowEnd) {
          lowSum += value;
        } else if (i < midEnd) {
          midSum += value;
        } else {
          highSum += value;
        }
      }

      const bass = Math.min(1, (lowSum / lowEnd) * 2) || 0;
      const mid = Math.min(1, (midSum / (midEnd - lowEnd)) * 2) || 0;
      const high = Math.min(1, (highSum / (bufferLength - midEnd)) * 2) || 0;
      const overall = Math.min(1, (overallSum / bufferLength) * 2) || 0;

      setLevels({
        bass,
        mid,
        high,
        overall,
        dataArray: dataArrayRef.current,
      });

      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current && analyserRef.current) {
        try {
          sourceRef.current.disconnect(analyserRef.current);
        } catch {}
      }
      // Do not close shared audio context here
    };
  }, [videoElement, enabled]);

  return levels;
}
