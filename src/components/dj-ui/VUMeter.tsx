"use client";

import { useEffect, useRef, useState } from "react";

interface VUMeterProps {
  analyserNode?: AnalyserNode;
  label?: string;
  color?: string;
}

export function VUMeter({ analyserNode, label = "L", color = "#00ff00" }: VUMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [peakLevel, setPeakLevel] = useState(0);
  const peakHoldRef = useRef(0);
  const peakHoldTimeRef = useRef(0);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const bufferLength = dataArray.length;

    const draw = () => {
      if (!analyserNode || !ctx) return;

      analyserNode.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) for level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const level = Math.min(rms * 2, 1); // Scale and clamp to 0-1

      // Convert to dB (approximate)
      const db = level > 0.0001 ? 20 * Math.log10(level) : -60;
      const normalizedDb = Math.max(0, (db + 60) / 60); // Normalize -60dB to 0dB as 0-1

      // Update peak
      if (level > peakHoldRef.current) {
        peakHoldRef.current = level;
        peakHoldTimeRef.current = Date.now();
        setPeakLevel(level);
      } else if (Date.now() - peakHoldTimeRef.current > 1000) {
        // Hold peak for 1 second, then decay
        peakHoldRef.current *= 0.95;
        setPeakLevel(peakHoldRef.current);
      }

      // Clear canvas
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      // Draw background grid
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = (height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw level bar
      const barHeight = normalizedDb * height;
      const isPeaking = normalizedDb > 0.95;
      const isWarning = normalizedDb > 0.85;

      // Gradient colors
      let barColor = color;
      if (isPeaking) {
        barColor = "#ff0000";
      } else if (isWarning) {
        barColor = "#ffaa00";
      }

      // Draw level
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(1, isPeaking ? "#ff6666" : barColor + "80");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - barHeight, width, barHeight);

      // Draw peak indicator
      if (peakLevel > 0) {
        const peakDb = peakLevel > 0.0001 ? 20 * Math.log10(peakLevel) : -60;
        const normalizedPeakDb = Math.max(0, (peakDb + 60) / 60);
        const peakY = height - normalizedPeakDb * height;

        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, peakY);
        ctx.lineTo(width, peakY);
        ctx.stroke();

        // Peak glow effect
        if (isPeaking) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ff0000";
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Draw label
      ctx.fillStyle = "#888";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, width / 2, height - 2);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, label, color, peakLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={40}
      height={120}
      className="border border-gray-800 rounded"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

