export {};

type IncomingMessage =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      color: string;
      dpr?: number;
      frequencyAware?: boolean;
    }
  | {
      type: "render";
      peaks: Float32Array;
      frequencyData?: { low: Float32Array; mid: Float32Array; high: Float32Array };
      duration: number;
      beatGrid?: number[];
      color: string;
      coverage?: number;
      isComplete?: boolean;
      isPlaying?: boolean;
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
    };

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let dpr = 1;
let peaks: Float32Array | null = null;
let frequencyData: { low: Float32Array; mid: Float32Array; high: Float32Array } | null = null;
let beatGrid: number[] = [];
let duration = 0;
let progress = 0;
let color = "#009688"; // Pro DJ teal
let coverage = 1;
let frequencyAware = false;
let isPlaying = false;

// Pro DJ color palette - desaturated for dark mode
const COLORS = {
  bass: '#FF4136',      // Red for lows
  mid: '#F012BE',       // Pink for mids
  high: '#7FDBFF',      // Teal/Cyan for highs
  idle: '#009688',      // Desaturated teal when idle
  idleDim: 'rgba(0, 150, 136, 0.2)', // Very dim idle state
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

const draw = () => {
  if (!ctx || !canvas || !peaks) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Base plate - dark background
  ctx.fillStyle = "rgba(18, 18, 18, 0.95)"; // --bg-primary
  ctx.fillRect(0, 0, width, height);

  const mid = height / 2;
  const drawWidth = width * Math.max(0, Math.min(1, coverage));
  const step = Math.max(1, drawWidth / peaks.length);

  // Draw frequency-aware waveform or standard waveform
  if (frequencyAware && frequencyData && isPlaying) {
    // Frequency-aware rendering with vibrant colors during playback
    drawFrequencyAwareWaveform(mid, drawWidth, step);
  } else {
    // Standard rendering with desaturated idle colors
    drawStandardWaveform(mid, drawWidth, step);
  }

  // Progress overlay - subtle fill
  const playheadX = Math.max(0, Math.min(width, progress * width));
  const loadedX = Math.max(0, Math.min(width, drawWidth));
  const fillX = Math.min(playheadX, loadedX);
  if (fillX > 0) {
    ctx.save();
    const activeColor = isPlaying ? color : COLORS.idle;
    ctx.fillStyle = activeColor;
    ctx.globalAlpha = isPlaying ? 0.15 : 0.08;
    ctx.fillRect(0, 0, fillX, height);
    ctx.restore();
  }

  // Beat grid - subtle markers
  if (beatGrid.length && duration > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < beatGrid.length; i++) {
      const beat = beatGrid[i];
      const pct = Math.max(0, Math.min(1, beat / duration));
      const x = pct * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Playhead - accent color with glow
  ctx.save();
  const playheadColor = isPlaying ? color : COLORS.idle;
  ctx.strokeStyle = playheadColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = playheadColor;
  ctx.shadowBlur = isPlaying ? 16 : 8;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
  ctx.restore();
};

const drawStandardWaveform = (mid: number, drawWidth: number, step: number) => {
  if (!ctx || !peaks) return;

  // Draw waveform path
  ctx.beginPath();
  ctx.moveTo(0, mid);
  for (let i = 0; i < peaks.length; i++) {
    const x = i * step;
    const amp = peaks[i];
    const y = mid - amp * (height * 0.42);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(drawWidth, mid);
  for (let i = peaks.length - 1; i >= 0; i--) {
    const x = i * step;
    const amp = peaks[i];
    const y = mid + amp * (height * 0.42);
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Fill with desaturated idle color
  ctx.save();
  ctx.fillStyle = isPlaying ? color : COLORS.idle;
  ctx.globalAlpha = isPlaying ? 0.35 : 0.25;
  ctx.fill();
  ctx.restore();

  // Subtle outline
  ctx.save();
  ctx.strokeStyle = "rgba(224, 224, 224, 0.08)"; // --text-primary with low alpha
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
};

const drawFrequencyAwareWaveform = (mid: number, drawWidth: number, step: number) => {
  if (!ctx || !peaks || !frequencyData) return;

  const { low, mid: midFreq, high } = frequencyData;

  // Draw layered frequency bands
  for (let i = 0; i < peaks.length; i++) {
    const x = i * step;
    const barWidth = step * 0.9;

    // Get frequency amplitudes
    const bassAmp = low[i] || 0;
    const midAmp = midFreq[i] || 0;
    const highAmp = high[i] || 0;

    // Bass (bottom layer - red)
    if (bassAmp > 0.05) {
      const bassHeight = bassAmp * (height * 0.42);
      ctx.fillStyle = COLORS.bass;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, mid - bassHeight, barWidth, bassHeight * 2);
    }

    // Mids (middle layer - pink)
    if (midAmp > 0.05) {
      const midHeight = midAmp * (height * 0.35);
      ctx.fillStyle = COLORS.mid;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x, mid - midHeight, barWidth, midHeight * 2);
    }

    // Highs (top layer - teal/cyan)
    if (highAmp > 0.05) {
      const highHeight = highAmp * (height * 0.28);
      ctx.fillStyle = COLORS.high;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, mid - highHeight, barWidth, highHeight * 2);
    }
  }

  ctx.globalAlpha = 1.0;
};

self.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;
  switch (data.type) {
    case "init": {
      canvas = data.canvas;
      color = data.color || color;
      frequencyAware = data.frequencyAware ?? false;
      ctx = canvas.getContext("2d");
      setSize(canvas.width || width, canvas.height || height, data.dpr ?? dpr);
      self.postMessage({ type: "ready" });
      break;
    }
    case "render": {
      peaks = data.peaks;
      frequencyData = data.frequencyData || null;
      duration = data.duration;
      beatGrid = data.beatGrid ?? [];
      color = data.color || color;
      coverage = typeof data.coverage === "number" ? Math.max(0, Math.min(1, data.coverage)) : 1;
      isPlaying = data.isPlaying ?? false;
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
    default:
      break;
  }
};
