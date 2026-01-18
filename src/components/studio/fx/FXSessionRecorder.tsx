"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { ensureAudioEngineReady } from '@/engine/AudioEngine';
import { CanvasRecorder, type CanvasRecorderRef } from '@/components/recorder/CanvasRecorder';
import { useCanvasVideoRecorder } from '@/hooks/useCanvasVideoRecorder';
import { RecordSessionControls } from './RecordSessionControls';
import { useFXEngine } from '@/hooks/useFXEngine';

/**
 * FXSessionRecorder - Complete session recording component for FX editor
 *
 * Combines:
 * - Canvas visualization (waveform, FX parameters, timeline)
 * - Audio recording from AudioEngine
 * - Video export with merged canvas + audio
 *
 * @example
 * ```tsx
 * <FXSessionRecorder />
 * ```
 */
export function FXSessionRecorder() {
  const fx = useFXEngine();
  const canvasRef = useRef<CanvasRecorderRef>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio stream from AudioEngine
  useEffect(() => {
    const setupAudioStream = async () => {
      try {
        const engine = await ensureAudioEngineReady();

        // Access mediaDestination (private property, but we need it)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mediaDest = (engine as any).mediaDestination as
          | MediaStreamAudioDestinationNode
          | undefined;

        if (mediaDest) {
          setAudioStream(mediaDest.stream);
          setIsInitialized(true);
        } else {
          console.warn('AudioEngine mediaDestination not available');
        }
      } catch (error) {
        console.error('Failed to setup audio stream:', error);
      }
    };

    setupAudioStream();
  }, []);

  // Canvas drawing function
  const drawCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      const canvas = ctx.canvas;
      const width = canvas.width;
      const height = canvas.height;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw FX automation visualization
      if (fx.automationTracks.length > 0) {
        fx.automationTracks.forEach((track, trackIndex) => {
          if (track.keyframes.length === 0) return;

          const trackY = (trackIndex * 120) + 50;
          const trackHeight = 100;

          // Track background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(20, trackY, width - 40, trackHeight);

          // Draw automation curve
          const sortedKeyframes = [...track.keyframes].sort(
            (a, b) => a.time - b.time
          );

          ctx.strokeStyle =
            track.type === 'delay'
              ? '#7c3aed'
              : track.type === 'reverb'
                ? '#c1ff00'
                : '#ff6b6b';
          ctx.lineWidth = 3;
          ctx.beginPath();

          sortedKeyframes.forEach((kf, idx) => {
            const x = 20 + (kf.time / 60) * (width - 40);
            const y = trackY + trackHeight - kf.value * trackHeight;

            if (idx === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });

          ctx.stroke();

          // Draw keyframes
          sortedKeyframes.forEach((kf) => {
            const x = 20 + (kf.time / 60) * (width - 40);
            const y = trackY + trackHeight - kf.value * trackHeight;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Track label
          ctx.fillStyle = '#ffffff';
          ctx.font = '16px monospace';
          ctx.fillText(
            `${track.name} (${track.type})`,
            30,
            trackY + 20
          );
        });
      }

      // Draw timeline indicator
      if (fx.isAutomationPlaying) {
        const currentX = 20 + (fx.automationTime / 60) * (width - 40);
        ctx.strokeStyle = '#c1ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();
      }

      // Draw FX parameter values
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(
        `Delay: ${fx.currentPreset?.delay.toFixed(2) || '0.00'}`,
        30,
        height - 80
      );
      ctx.fillText(
        `Reverb: ${fx.currentPreset?.reverb.toFixed(2) || '0.00'}`,
        30,
        height - 50
      );
      ctx.fillText(
        `Filter: ${fx.currentPreset?.filter.toFixed(2) || '0.00'}`,
        30,
        height - 20
      );

      // Draw recording indicator
      // (Will be shown when recording)
    },
    [fx]
  );

  // Create a ref that points to the actual canvas element
  const canvasElementRef = useRef<HTMLCanvasElement>(null as unknown as HTMLCanvasElement);

  useEffect(() => {
    const updateCanvasRef = () => {
      const canvas = canvasRef.current?.getCanvas();
      if (canvas) {
        canvasElementRef.current = canvas;
      }
    };
    updateCanvasRef();
    const interval = setInterval(updateCanvasRef, 100);
    return () => clearInterval(interval);
  }, []);

  // Video recorder hook
  const videoRecorder = useCanvasVideoRecorder(
    canvasElementRef as React.RefObject<HTMLCanvasElement>,
    audioStream
  );

  if (!isInitialized) {
    return (
      <div className="text-center text-white/60 text-sm">
        Initializing recording...
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hidden canvas for recording */}
      <CanvasRecorder
        ref={canvasRef}
        draw={drawCanvas}
        width={1280}
        height={720}
        hidden={true}
      />

      {/* Recording controls */}
      <RecordSessionControls
        isRecording={videoRecorder.isRecording}
        onStart={videoRecorder.start}
        onStop={videoRecorder.stop}
        onExport={videoRecorder.exportBlob}
      />
    </div>
  );
}
