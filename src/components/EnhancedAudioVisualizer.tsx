"use client";

import { useEffect, useRef, useState } from "react";
import { useAudio } from "@/context/AudioContext";

interface EnhancedAudioVisualizerProps {
  height?: number;
}

/**
 * EnhancedAudioVisualizer - Real-time frequency bars that dance to the beat
 * Uses Web Audio API AnalyserNode for frequency data
 */
export function EnhancedAudioVisualizer({ height = 40 }: EnhancedAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const { isPlaying, currentTrack, analyserNode, ensureAnalyser } = useAudio();
  const [colors, setColors] = useState<{ primary: string; secondary: string }>({
    primary: "#FFD700",
    secondary: "#E0E0E0",
  });

  // Extract colors from album art (simplified - using track vibe for now)
  useEffect(() => {
    if (currentTrack) {
      // Color palette based on vibe
      const vibeColors: Record<string, { primary: string; secondary: string }> = {
        hype: { primary: "#FFD700", secondary: "#FF6600" },
        chill: { primary: "#00d9ff", secondary: "#00ff99" },
        storytelling: { primary: "#ff0099", secondary: "#ff6600" },
        classic: { primary: "#E0E0E0", secondary: "#FFD700" },
      };
      setColors(vibeColors[currentTrack.vibe] || vibeColors.hype);
    }
  }, [currentTrack]);

  // Setup audio analyser
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure a single analyser graph (owned by AudioProvider)
    const analyser = analyserNode ?? ensureAnalyser();
    if (!analyser) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = height * dpr;
      // Reset transform so repeated resizes don't compound scaling
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation loop
    const draw = () => {
      if (!analyser || !isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = "rgba(10, 10, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

      // Draw frequency bars
      const barCount = 32; // Show 32 bars
      const barWidth = (canvas.width / window.devicePixelRatio) / barCount;
      const barGap = barWidth * 0.1;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * (canvas.height / window.devicePixelRatio);

        // Gradient based on frequency range
        const gradient = ctx.createLinearGradient(
          i * barWidth,
          0,
          i * barWidth,
          canvas.height / window.devicePixelRatio
        );

        // Low frequencies (left) = primary color, High frequencies (right) = secondary color
        const colorMix = i / barCount;
        const r1 = parseInt(colors.primary.slice(1, 3), 16);
        const g1 = parseInt(colors.primary.slice(3, 5), 16);
        const b1 = parseInt(colors.primary.slice(5, 7), 16);
        const r2 = parseInt(colors.secondary.slice(1, 3), 16);
        const g2 = parseInt(colors.secondary.slice(3, 5), 16);
        const b2 = parseInt(colors.secondary.slice(5, 7), 16);

        const r = Math.floor(r1 + (r2 - r1) * colorMix);
        const g = Math.floor(g1 + (g2 - g1) * colorMix);
        const b = Math.floor(b1 + (b2 - b1) * colorMix);

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.3)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * barWidth + barGap,
          (canvas.height / window.devicePixelRatio) - barHeight,
          barWidth - barGap * 2,
          barHeight
        );

        // Add glow effect for high bars
        if (barHeight > (canvas.height / window.devicePixelRatio) * 0.7) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(
            i * barWidth + barGap,
            (canvas.height / window.devicePixelRatio) - barHeight,
            barWidth - barGap * 2,
            barHeight
          );
          ctx.shadowBlur = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, ensureAnalyser, isPlaying, colors, height]);

  if (!currentTrack || !isPlaying) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}

