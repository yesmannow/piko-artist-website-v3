/**
 * Waveform Worker - Phase IV Enhanced
 * Supports frequency-based coloring and stem mute visualization
 */

/// <reference lib="webworker" />

type IncomingMessage =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      color: string;
      dpr?: number;
    }
  | {
      type: "render";
      peaks: Float32Array;
      duration: number;
      beatGrid?: number[];
      color: string;
      coverage?: number;
      isComplete?: boolean;
      frequencyPeaks?: { low: Float32Array; mid: Float32Array; high: Float32Array };
    }
  | {
      type: "resize";
      width: number;
      height: number;
      dpr?: number;
    }
  | {
      type: "playhead";
      progress: number;
    }
  | {
      type: "stem-mutes";
      mutes: { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
    };

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let dpr = 1;
let peaks: Float32Array | null = null;
let frequencyPeaks: { low: Float32Array; mid: Float32Array; high: Float32Array } | null = null;
let beatGrid: number[] = [];
let duration = 0;
let progress = 0;
let color = "#22d3ee";
let coverage = 1;
let stemMutes = { vocals: false, drums: false, bass: false, other: false };

// Frequency-based colors (Phase III)
const FREQ_COLORS = {
  low: "#ef4444",    // Crimson/Red for bass
  mid: "#f59e0b",    // Gold for mids
  high: "#00F2FF",   // Cyan for highs/vocals
};

const setSize = (w: number, h: number, ratio: number) => {
  width = Math.max(1, Math.floor(w));
  height = Math.max(1, Math.floor(h));
  dpr = ratio || 1;
  if (canvas) {
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
  }
};

// Helper: Draw waveform path from peak data
const drawWaveformPath = (
  context: OffscreenCanvasRenderingContext2D,
  peakData: Float32Array,
  mid: number,
  step: number,
  drawWidth: number,
  heightScale: number
) => {
  context.beginPath();
  context.moveTo(0, mid);
  for (let i = 0; i < peakData.length; i++) {
    const x = i * step;
    const amp = peakData[i];
    const y = mid - amp * heightScale;
    context.lineTo(x, y);
  }
  context.lineTo(drawWidth, mid);
  for (let i = peakData.length - 1; i >= 0; i--) {
    const x = i * step;
    const amp = peakData[i];
    const y = mid + amp * heightScale;
    context.lineTo(x, y);
  }
  context.closePath();
};

// Helper: Render frequency-based multi-band waveform
const renderFrequencyBands = (
  context: OffscreenCanvasRenderingContext2D,
  mid: number,
  step: number,
  drawWidth: number,
  heightScale: number
) => {
  if (!frequencyPeaks) return;

  const { low, mid: midBand, high } = frequencyPeaks;
  const bands = [
    { data: low, color: FREQ_COLORS.low, alpha: stemMutes.bass ? 0.08 : 0.32 },
    { data: midBand, color: FREQ_COLORS.mid, alpha: stemMutes.drums ? 0.08 : 0.28 },
    { data: high, color: FREQ_COLORS.high, alpha: stemMutes.vocals ? 0.08 : 0.35 },
  ];

  for (const band of bands) {
    drawWaveformPath(context, band.data, mid, step, drawWidth, heightScale);

    context.save();
    context.fillStyle = band.color;
    context.globalAlpha = band.alpha;
    context.fill();
    context.restore();

    context.save();
    context.strokeStyle = "rgba(255,255,255,0.05)";
    context.lineWidth = 0.5;
    context.stroke();
    context.restore();
  }
};

// Helper: Render single-color fallback waveform
const renderSingleColor = (
  context: OffscreenCanvasRenderingContext2D,
  mid: number,
  step: number,
  drawWidth: number,
  heightScale: number
) => {
  if (!peaks) return;

  drawWaveformPath(context, peaks, mid, step, drawWidth, heightScale);

  context.save();
  context.fillStyle = color;
  context.globalAlpha = 0.32;
  context.fill();
  context.restore();

  context.save();
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1;
  context.stroke();
  context.restore();
};

const draw = () => {
  if (!ctx || !canvas || !peaks) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Base plate
  ctx.fillStyle = "rgba(6,7,10,0.9)";
  ctx.fillRect(0, 0, width, height);

  const mid = height / 2;
  const drawWidth = width * Math.max(0, Math.min(1, coverage));
  const step = Math.max(1, drawWidth / peaks.length);
  const heightScale = height * 0.45;

  // Render waveform (frequency-based or single-color)
  if (frequencyPeaks) {
    renderFrequencyBands(ctx, mid, step, drawWidth, heightScale);
  } else {
    renderSingleColor(ctx, mid, step, drawWidth, heightScale);
  }

  // Progress overlay
  const playheadX = Math.max(0, Math.min(width, progress * width));
  const loadedX = Math.max(0, Math.min(width, drawWidth));
  const fillX = Math.min(playheadX, loadedX);
  if (fillX > 0) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 0, fillX, height);
    ctx.restore();
  }

  // Beat grid
  if (beatGrid.length && duration > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (const beat of beatGrid) {
      const pct = Math.max(0, Math.min(1, beat / duration));
      const x = pct * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Playhead
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
  ctx.restore();
};

globalThis.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;
  switch (data.type) {
    case "init": {
      canvas = data.canvas;
      color = data.color || color;
      ctx = canvas.getContext("2d");
      setSize(canvas.width || width, canvas.height || height, data.dpr ?? dpr);
      globalThis.postMessage({ type: "ready" });
      break;
    }
    case "render": {
      peaks = data.peaks;
      duration = data.duration;
      beatGrid = data.beatGrid ?? [];
      color = data.color || color;
      coverage = typeof data.coverage === "number" ? Math.max(0, Math.min(1, data.coverage)) : 1;
      if (data.frequencyPeaks) {
        frequencyPeaks = data.frequencyPeaks;
      }
      draw();
      break;
    }
    case "resize": {
      setSize(data.width, data.height, data.dpr ?? dpr);
      draw();
      break;
    }
    case "playhead": {
      progress = Math.max(0, Math.min(1, data.progress));
      draw();
      break;
    }
    case "stem-mutes": {
      stemMutes = data.mutes;
      draw();
      break;
    }
    default:
      break;
  }
};
