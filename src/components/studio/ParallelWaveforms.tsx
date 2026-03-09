'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useDeckStore, DeckState } from '@/store/deckStore';
import { WaveformAutomation } from './WaveformAutomation';

// ── RGB Frequency Colors ────────────────────────────────────────────────
const COLORS = {
  low:  { r: 255, g: 34, b: 68 },   // Red — Bass / Kick
  mid:  { r: 68,  g: 136, b: 255 },  // Blue — Vocals / Mids
  high: { r: 255, g: 255, b: 255 },  // White — Percussion / Highs
  vocal: 'rgba(191, 0, 255, 0.15)',   // Neon Purple — Vocal Zones
  downbeat: '#00f2ff',                // Neon Blue — Downbeat "1"
  beatLine: 'rgba(255, 255, 255, 0.08)',
  playhead: '#00f2ff',
};

// ── Waveform Peak Extraction ────────────────────────────────────────────
function extractPeaks(buffer: AudioBuffer, buckets: number): Float32Array {
  const channel = buffer.getChannelData(0);
  const step = Math.floor(channel.length / buckets);
  const peaks = new Float32Array(buckets);
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    const start = i * step;
    const end = Math.min(start + step, channel.length);
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channel[j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
  }
  return peaks;
}

// ── Frequency-Band Peak Extraction ──────────────────────────────────────
function extractFrequencyPeaks(
  buffer: AudioBuffer,
  buckets: number
): { low: Float32Array; mid: Float32Array; high: Float32Array } {
  const sampleRate = buffer.sampleRate;
  const channel = buffer.getChannelData(0);
  const step = Math.floor(channel.length / buckets);
  const low = new Float32Array(buckets);
  const mid = new Float32Array(buckets);
  const high = new Float32Array(buckets);

  const smoothWindow = Math.max(1, Math.round(sampleRate / 200));
  const highWindow = Math.max(1, Math.round(sampleRate / 4000));

  for (let i = 0; i < buckets; i++) {
    const start = i * step;
    const end = Math.min(start + step, channel.length);
    let maxLow = 0, maxMid = 0, maxHigh = 0;

    for (let j = start; j < end; j += 4) {
      let sumLow = 0;
      const lwStart = Math.max(0, j - smoothWindow);
      const lwEnd = Math.min(channel.length, j + smoothWindow);
      for (let k = lwStart; k < lwEnd; k += 2) sumLow += channel[k];
      const lowVal = sumLow / ((lwEnd - lwStart) / 2);

      let sumHigh = 0;
      const hwStart = Math.max(0, j - highWindow);
      const hwEnd = Math.min(channel.length, j + highWindow);
      for (let k = hwStart; k < hwEnd; k++) sumHigh += channel[k];
      const smoothedHigh = sumHigh / (hwEnd - hwStart);
      const highVal = channel[j] - smoothedHigh;

      const midVal = channel[j] - lowVal - highVal;

      maxLow = Math.max(maxLow, Math.abs(lowVal));
      maxMid = Math.max(maxMid, Math.abs(midVal));
      maxHigh = Math.max(maxHigh, Math.abs(highVal));
    }

    low[i] = Math.min(1, maxLow * 2.5);
    mid[i] = Math.min(1, maxMid * 3.0);
    high[i] = Math.min(1, maxHigh * 3.5);
  }

  return { low, mid, high };
}

// ── Sub-renderers (extracted to reduce complexity) ───────────────────────

type FreqPeaks = { low: Float32Array; mid: Float32Array; high: Float32Array };

function drawRGBBands(ctx: CanvasRenderingContext2D, w: number, h: number, freqPeaks: FreqPeaks, step: number, mid: number, heightScale: number) {
  const bands = [
    { data: freqPeaks.low,  color: COLORS.low,  alpha: 0.5 },
    { data: freqPeaks.mid,  color: COLORS.mid,  alpha: 0.5 },
    { data: freqPeaks.high, color: COLORS.high, alpha: 0.4 },
  ];

  for (const band of bands) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(${band.color.r}, ${band.color.g}, ${band.color.b}, ${band.alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    for (let i = 0; i < band.data.length; i++) {
      ctx.lineTo(i * step, mid - band.data[i] * heightScale);
    }
    ctx.lineTo(w, mid);
    for (let i = band.data.length - 1; i >= 0; i--) {
      ctx.lineTo(i * step, mid + band.data[i] * heightScale);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawFallbackWaveform(ctx: CanvasRenderingContext2D, w: number, peaks: Float32Array, step: number, mid: number, heightScale: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(0, mid);
  for (let i = 0; i < peaks.length; i++) {
    ctx.lineTo(i * step, mid - peaks[i] * heightScale);
  }
  ctx.lineTo(w, mid);
  for (let i = peaks.length - 1; i >= 0; i--) {
    ctx.lineTo(i * step, mid + peaks[i] * heightScale);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVocalMarkers(ctx: CanvasRenderingContext2D, w: number, h: number, duration: number, vocalSegments: { start: number; end: number }[]) {
  ctx.save();
  ctx.fillStyle = COLORS.vocal;
  for (const seg of vocalSegments) {
    const x1 = (seg.start / duration) * w;
    const x2 = (seg.end / duration) * w;
    ctx.fillRect(x1, 0, x2 - x1, h);
  }
  ctx.restore();
}

function drawPhraseMarkers(ctx: CanvasRenderingContext2D, w: number, h: number, bpm: number, duration: number) {
  const secondsPerBeat = 60 / bpm;
  const totalBeats = Math.floor(duration / secondsPerBeat);
  ctx.save();
  for (let i = 0; i <= totalBeats; i++) {
    const beatTime = i * secondsPerBeat;
    const x = (beatTime / duration) * w;
    const isDownbeat = i % 4 === 0;

    ctx.strokeStyle = isDownbeat ? COLORS.downbeat : COLORS.beatLine;
    ctx.lineWidth = isDownbeat ? 2 : 0.5;
    ctx.globalAlpha = isDownbeat ? 0.5 : 1;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayhead(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) {
  const playheadX = progress * w;

  // Progress fill
  ctx.save();
  ctx.fillStyle = 'rgba(0, 242, 255, 0.08)';
  ctx.fillRect(0, 0, playheadX, h);
  ctx.restore();

  // Playhead line
  ctx.save();
  ctx.strokeStyle = COLORS.playhead;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = COLORS.playhead;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, h);
  ctx.stroke();
  ctx.restore();
}

// ── Combined Deck Waveform Render ───────────────────────────────────────
function drawDeckWaveform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  peaks: Float32Array,
  freqPeaks: FreqPeaks | null,
  progress: number,
  bpm: number,
  duration: number,
  vocalSegments?: { start: number; end: number }[],
) {
  const mid = h / 2;
  const step = w / peaks.length;
  const heightScale = h * 0.42;

  // Background
  ctx.fillStyle = 'rgba(6, 7, 10, 0.95)';
  ctx.fillRect(0, 0, w, h);

  // Waveform
  if (freqPeaks) {
    drawRGBBands(ctx, w, h, freqPeaks, step, mid, heightScale);
  } else {
    drawFallbackWaveform(ctx, w, peaks, step, mid, heightScale);
  }

  // Vocal zones — only render if vocalSegments data exists
  if (vocalSegments && vocalSegments.length > 0 && duration > 0) {
    drawVocalMarkers(ctx, w, h, duration, vocalSegments);
  }

  // Phrase markers
  if (bpm > 0 && duration > 0) {
    drawPhraseMarkers(ctx, w, h, bpm, duration);
  }

  // Playhead
  if (progress > 0) {
    drawPlayhead(ctx, w, h, progress);
  }
}

// ── Empty Canvas Message ────────────────────────────────────────────────
function drawEmpty(ctx: CanvasRenderingContext2D, w: number, h: number, label: string) {
  ctx.fillStyle = 'rgba(6, 7, 10, 0.95)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, w / 2, h / 2 + 4);
}

// ── Render one deck ─────────────────────────────────────────────────────
interface PeakCache {
  buffer: AudioBuffer | null;
  peaks: Float32Array | null;
  freq: FreqPeaks | null;
}

function renderDeck(
  canvas: HTMLCanvasElement,
  deck: DeckState,
  cache: React.MutableRefObject<PeakCache>,
  dpr: number,
  emptyLabel: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!deck.buffer) {
    drawEmpty(ctx, w, h, emptyLabel);
    return;
  }

  // Extract peaks if buffer changed
  if (cache.current.buffer !== deck.buffer) {
    const buckets = Math.min(1200, Math.floor(w));
    cache.current.buffer = deck.buffer;
    cache.current.peaks = extractPeaks(deck.buffer, buckets);
    cache.current.freq = extractFrequencyPeaks(deck.buffer, buckets);
  }

  const progress = deck.duration > 0 ? deck.currentTime / deck.duration : 0;
  const bpm = deck.track?.bpm ? Number(deck.track.bpm) : 0;
  const vocalSegments = deck.track?.vocalSegments;
  drawDeckWaveform(ctx, w, h, cache.current.peaks!, cache.current.freq, progress, bpm, deck.duration, vocalSegments);
}

// ══════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════

export function ParallelWaveforms() {
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const peaksCacheA = useRef<PeakCache>({ buffer: null, peaks: null, freq: null });
  const peaksCacheB = useRef<PeakCache>({ buffer: null, peaks: null, freq: null });

  const [automationMode, setAutomationMode] = useState<'off' | 'volume' | 'hpf' | 'reverb'>('off');
  const [containerWidth, setContainerWidth] = useState(0);

  const resizeCanvases = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const deckH = 60;

    setContainerWidth(w);

    for (const canvas of [canvasARef.current, canvasBRef.current]) {
      if (canvas) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(deckH * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${deckH}px`;
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    // Animation loop — reads store via getState() for zero-lag performance
    const tick = () => {
      const state = useDeckStore.getState();
      const dpr = window.devicePixelRatio || 1;

      if (canvasARef.current) {
        renderDeck(canvasARef.current, state.deckA, peaksCacheA, dpr, 'DECK A — NO TRACK LOADED');
      }
      if (canvasBRef.current) {
        renderDeck(canvasBRef.current, state.deckB, peaksCacheB, dpr, 'DECK B — NO TRACK LOADED');
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resizeCanvases);
      cancelAnimationFrame(rafRef.current);
    };
  }, [resizeCanvases]);

  return (
    <div className="flex flex-col gap-2">
      {/* Automation Controls */}
      <div className="flex gap-2 items-center px-2 py-1 bg-slate-900/50 rounded-lg border border-slate-800/60 font-mono text-xs">
        <span className="text-white/60 uppercase tracking-widest mr-2">Auto:</span>
        {(['off', 'volume', 'hpf', 'reverb'] as const).map(mode => (
          <button 
            key={mode}
            onClick={() => setAutomationMode(mode)}
            className={`px-3 py-1 rounded transition-colors ${automationMode === mode ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="parallel-waveforms sticky top-0 z-30 w-full flex flex-col rounded-xl overflow-hidden border border-slate-800/60"
        style={{ background: 'rgba(6, 7, 10, 0.95)' }}
      >
        {/* Deck A Lane */}
        <div className="relative">
          <canvas ref={canvasARef} className="block w-full" style={{ height: 60 }} />
          <div className="absolute top-1 left-2 px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-cyan-400 bg-black/60 rounded z-50 pointer-events-none">
            A
          </div>
          {automationMode !== 'off' && containerWidth > 0 && (
            <WaveformAutomation deckId="A" width={containerWidth} height={60} activeParam={automationMode} />
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Deck B Lane */}
        <div className="relative">
          <canvas ref={canvasBRef} className="block w-full" style={{ height: 60 }} />
          <div className="absolute top-1 left-2 px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-purple-400 bg-black/60 rounded z-50 pointer-events-none">
            B
          </div>
          {automationMode !== 'off' && containerWidth > 0 && (
            <WaveformAutomation deckId="B" width={containerWidth} height={60} activeParam={automationMode} />
          )}
        </div>
      </div>
    </div>
  );
}
