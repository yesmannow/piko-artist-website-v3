import { useEffect, useRef, useState } from "react";

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
  enabled: boolean = true
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

    // Initialize AudioContext
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    // Create analyser
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    // For HTML5 video elements
    if (videoElement instanceof HTMLVideoElement) {
      try {
        const source = audioContext.createMediaElementSource(videoElement);
        source.connect(analyser);
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
    const dataArray = new Uint8Array(new ArrayBuffer(bufferLength)) as Uint8Array<ArrayBuffer>;
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
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [videoElement, enabled]);

  return levels;
}

