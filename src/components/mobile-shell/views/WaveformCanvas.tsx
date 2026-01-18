"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioStore } from "@/store/useAudioStore";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";

interface WaveformCanvasProps {
  deckId: string;
  color: string;
}

/**
 * PHASE 5: High-Fidelity Waveform Canvas
 *
 * Renders audio waveform using Web Worker for processing and RAF for rendering.
 * Features:
 * - Off-thread waveform analysis via Web Worker
 * - Mirrored waveform display (top/bottom like Serato)
 * - Playhead indicator
 * - Optimized RAF rendering (only redraws on changes)
 */
export const WaveformCanvas = ({ deckId, color }: WaveformCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<Float32Array | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const bpmWorkerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPlayheadRef = useRef<number>(0);
  const enginePromiseRef = useRef<Promise<
    Awaited<ReturnType<typeof ensureAudioEngineReady>>
  > | null>(null);
  const engineRef = useRef<Awaited<
    ReturnType<typeof ensureAudioEngineReady>
  > | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to deck state
  const deckState = useAudioStore((state) => state.decks[deckId]);

  const getEngine = () => {
    if (engineRef.current) return Promise.resolve(engineRef.current);
    if (!enginePromiseRef.current) {
      enginePromiseRef.current = ensureAudioEngineReady().then((engine) => {
        engineRef.current = engine;
        return engine;
      });
    }
    return enginePromiseRef.current;
  };

  // Initialize Web Worker
  useEffect(() => {
    try {
      // Create worker from inline code (Next.js compatible)
      const workerCode = `
        function calculateRMS(samples, start, end) {
          let sum = 0;
          let count = 0;
          for (let i = start; i < end && i < samples.length; i++) {
            sum += samples[i] * samples[i];
            count++;
          }
          return count === 0 ? 0 : Math.sqrt(sum / count);
        }

        function generateWaveformPeaks(channelData, samplesPerPixel) {
          const channel = channelData[0];
          const totalSamples = channel.length;
          const numPeaks = Math.ceil(totalSamples / samplesPerPixel);
          const peaks = new Float32Array(numPeaks);

          let mixedChannel;
          if (channelData.length === 2) {
            mixedChannel = new Float32Array(totalSamples);
            for (let i = 0; i < totalSamples; i++) {
              mixedChannel[i] = (channelData[0][i] + channelData[1][i]) / 2;
            }
          } else {
            mixedChannel = channel;
          }

          for (let i = 0; i < numPeaks; i++) {
            const start = i * samplesPerPixel;
            const end = start + samplesPerPixel;
            peaks[i] = calculateRMS(mixedChannel, start, end);
          }

          let maxPeak = 0;
          for (let i = 0; i < peaks.length; i++) {
            if (peaks[i] > maxPeak) maxPeak = peaks[i];
          }

          if (maxPeak > 0) {
            for (let i = 0; i < peaks.length; i++) {
              peaks[i] = peaks[i] / maxPeak;
            }
          }

          return peaks;
        }

        self.onmessage = (event) => {
          const { channelData, samplesPerPixel } = event.data;
          try {
            const peaks = generateWaveformPeaks(channelData, samplesPerPixel);
            self.postMessage({ peaks });
          } catch (error) {
            self.postMessage({ error: error.message || 'Unknown error' });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl);

      workerRef.current.onmessage = (event) => {
        if (event.data.error) {
          setError(event.data.error);
          setIsProcessing(false);
        } else if (event.data.peaks) {
          peaksRef.current = event.data.peaks;
          setIsProcessing(false);
        }
      };

      // PHASE 8: Initialize BPM Worker
      const bpmWorkerCode = `
        function downsample(data, factor) {
          const length = Math.floor(data.length / factor);
          const result = new Float32Array(length);
          for (let i = 0; i < length; i++) {
            let sum = 0;
            for (let j = 0; j < factor; j++) {
              sum += Math.abs(data[i * factor + j]);
            }
            result[i] = sum / factor;
          }
          return result;
        }

        function lowPassFilter(data, alpha = 0.15) {
          const result = new Float32Array(data.length);
          result[0] = data[0];
          for (let i = 1; i < data.length; i++) {
            result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
          }
          return result;
        }

        function detectPeaks(data, threshold = 0.8) {
          const peaks = [];
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const mean = sum / data.length;
          const adaptiveThreshold = mean * (1 + threshold);
          
          for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > adaptiveThreshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
              peaks.push(i);
            }
          }
          return peaks;
        }

        function detectBPM(channelData, sampleRate) {
          let monoData;
          if (channelData.length === 2) {
            monoData = new Float32Array(channelData[0].length);
            for (let i = 0; i < monoData.length; i++) {
              monoData[i] = (channelData[0][i] + channelData[1][i]) / 2;
            }
          } else {
            monoData = channelData[0];
          }
          
          const downsampleFactor = Math.floor(sampleRate / 10);
          const downsampled = downsample(monoData, downsampleFactor);
          const filtered = lowPassFilter(downsampled, 0.15);
          const peaks = detectPeaks(filtered, 0.8);
          
          if (peaks.length < 2) {
            return { bpm: 120, offset: 0, confidence: 0 };
          }
          
          const intervals = [];
          for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i - 1]);
          }
          
          const buckets = new Map();
          const tolerance = 5;
          for (const interval of intervals) {
            let found = false;
            for (const [key, count] of buckets.entries()) {
              if (Math.abs(interval - key) / key < tolerance / 100) {
                buckets.set(key, count + 1);
                found = true;
                break;
              }
            }
            if (!found) buckets.set(interval, 1);
          }
          
          let maxCount = 0;
          let bestInterval = 0;
          for (const [interval, count] of buckets.entries()) {
            if (count > maxCount) {
              maxCount = count;
              bestInterval = interval;
            }
          }
          
          const samplesPerBeat = bestInterval * downsampleFactor;
          const secondsPerBeat = samplesPerBeat / sampleRate;
          let bpm = 60 / secondsPerBeat;
          
          while (bpm < 60) bpm *= 2;
          while (bpm > 180) bpm /= 2;
          
          const confidence = maxCount / intervals.length;
          const offset = (peaks[0] * downsampleFactor) / sampleRate;
          
          return { bpm: Math.round(bpm * 10) / 10, offset, confidence };
        }

        self.onmessage = (event) => {
          const { channelData, sampleRate } = event.data;
          try {
            const result = detectBPM(channelData, sampleRate);
            self.postMessage(result);
          } catch (error) {
            self.postMessage({ bpm: 120, offset: 0, confidence: 0, error: error.message });
          }
        };
      `;

      const bpmBlob = new Blob([bpmWorkerCode], {
        type: "application/javascript",
      });
      const bpmWorkerUrl = URL.createObjectURL(bpmBlob);
      bpmWorkerRef.current = new Worker(bpmWorkerUrl);

      bpmWorkerRef.current.onmessage = (event) => {
        const { bpm, offset, confidence } = event.data;
        console.log(
          `🎵 BPM detected: ${bpm} (confidence: ${(confidence * 100).toFixed(1)}%)`,
        );

        // Update AudioEngine with detected BPM
        try {
          getEngine()
            .then((engine) => engine.setBPM(deckId, bpm, offset))
            .catch((err) => console.warn("Failed to set BPM:", err));
        } catch (error) {
          console.warn("Failed to set BPM:", error);
        }
      };

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
          URL.revokeObjectURL(workerUrl);
        }
        if (bpmWorkerRef.current) {
          bpmWorkerRef.current.terminate();
          URL.revokeObjectURL(bpmWorkerUrl);
        }
      };
    } catch (err) {
      console.error("Failed to initialize workers:", err);
      setError("Worker initialization failed");
    }
  }, [deckId]);

  // Process audio buffer when track loads
  useEffect(() => {
    if (!deckState.url || !workerRef.current) return;

    const processWaveform = async () => {
      setIsProcessing(true);
      setError(null);

      try {
        const engine = await getEngine();
        const deck = engine?.decks.get(deckId);

        if (!deck?.buffer) {
          setError("No audio buffer available");
          setIsProcessing(false);
          return;
        }

        const audioBuffer = deck.buffer;
        const canvasWidth = canvasRef.current?.width || 800;

        // Calculate samples per pixel for optimal resolution
        const samplesPerPixel = Math.floor(audioBuffer.length / canvasWidth);

        // Extract channel data
        const channelData: Float32Array[] = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channelData.push(audioBuffer.getChannelData(i));
        }

        // Send to waveform worker
        if (workerRef.current) {
          workerRef.current.postMessage({
            channelData,
            samplesPerPixel,
          });
        }

        // PHASE 8: Send to BPM worker
        if (bpmWorkerRef.current) {
          bpmWorkerRef.current.postMessage({
            channelData,
            sampleRate: audioBuffer.sampleRate,
          });
        }
      } catch (err) {
        console.error("Waveform processing error:", err);
        setError(err instanceof Error ? err.message : "Processing failed");
        setIsProcessing(false);
      }
    };

    processWaveform();
  }, [deckState.url, deckId]);

  // RAF rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Draw waveform if peaks are available
      if (peaksRef.current && peaksRef.current.length > 0) {
        const peaks = peaksRef.current;
        const barWidth = width / peaks.length;
        const centerY = height / 2;
        const maxBarHeight = height / 2 - 4; // Leave 4px padding

        ctx.fillStyle = color;

        // Draw mirrored waveform (Serato/Rekordbox style)
        for (let i = 0; i < peaks.length; i++) {
          const x = i * barWidth;
          const barHeight = peaks[i] * maxBarHeight;

          // Top half (mirrored)
          ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);

          // Bottom half (mirrored)
          ctx.fillRect(x, centerY, barWidth - 1, barHeight);
        }

        // PHASE 8: Draw beatgrid (vertical lines at beat positions)
        try {
          const engine = engineRef.current;
          const bpm = engine?.getBPM(deckId) ?? 0;
          const gridOffset = engine?.getGridOffset(deckId) ?? 0;

          if (bpm > 0 && deckState.duration > 0) {
            const beatLength = 60 / bpm; // Seconds per beat
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";

            // Draw beat markers
            for (
              let time = gridOffset;
              time < deckState.duration;
              time += beatLength
            ) {
              const x = (time / deckState.duration) * width;
              ctx.fillRect(x, 0, 1, height);
            }
          }
        } catch (err) {
          // Engine might not be initialized
        }

        // Draw playhead indicator
        if (deckState.isPlaying && deckState.duration > 0) {
          try {
            const engine = engineRef.current;
            const deck = engine?.decks.get(deckId);

            if (deck && engine?.context) {
              // Calculate current playback position
              const currentTime =
                engine.context.currentTime - deck.startTime + deck.pauseTime;
              const progress = Math.min(currentTime / deckState.duration, 1);
              const playheadX = progress * width;

              // Only redraw if playhead moved significantly (optimization)
              if (Math.abs(playheadX - lastPlayheadRef.current) > 1) {
                lastPlayheadRef.current = playheadX;

                // Draw playhead line
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(playheadX - 1, 0, 2, height);
              }
            }
          } catch (err) {
            // Engine might not be initialized
          }
        }
      } else if (isProcessing) {
        // Show loading state
        ctx.fillStyle = "#666666";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Processing waveform...", width / 2, height / 2);
      } else if (error) {
        // Show error state
        ctx.fillStyle = "#FF0000";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`Error: ${error}`, width / 2, height / 2);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    deckId,
    deckState.isPlaying,
    deckState.duration,
    color,
    isProcessing,
    error,
  ]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
};
