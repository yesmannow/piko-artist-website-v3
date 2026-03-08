'use client';

import { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  buffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  color?: string;
  height?: number;
}

export function WaveformCanvas({
  buffer,
  currentTime,
  duration,
  isPlaying,
  color = '#00f5d4',
  height = 60,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformData = useRef<Float32Array | null>(null);

  // Compute downsampled waveform from buffer
  useEffect(() => {
    if (!buffer) {
      waveformData.current = null;
      return;
    }
    const raw = buffer.getChannelData(0);
    const numBars = 200;
    const blockSize = Math.floor(raw.length / numBars);
    const data = new Float32Array(numBars);
    for (let i = 0; i < numBars; i++) {
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(raw[i * blockSize + j] ?? 0);
        if (val > max) max = val;
      }
      data[i] = max;
    }
    waveformData.current = data;
  }, [buffer]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const data = waveformData.current;
    if (!data) {
      // Empty state
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, H / 2 - 1, W, 2);
      return;
    }

    const progress = duration > 0 ? currentTime / duration : 0;
    const bars = data.length;
    const barW = W / bars;

    for (let i = 0; i < bars; i++) {
      const h = data[i] * H * 0.85;
      const x = i * barW;
      const played = i / bars < progress;
      ctx.fillStyle = played ? color : 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1, (H - h) / 2, Math.max(barW - 2, 1), h || 2);
    }

    // Playhead
    const pxLine = progress * W;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(pxLine, 0);
    ctx.lineTo(pxLine, H);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [buffer, currentTime, duration, color]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={height}
      className="waveform-glow"
      style={{ width: '100%', height, borderRadius: 6 }}
    />
  );
}
