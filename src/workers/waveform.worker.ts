export {};

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
let beatGrid: number[] = [];
let duration = 0;
let progress = 0;
let color = "#22d3ee";
let coverage = 1;

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

  // Base plate
  ctx.fillStyle = "rgba(6,7,10,0.9)";
  ctx.fillRect(0, 0, width, height);

  // Waveform path
  const mid = height / 2;
  const drawWidth = width * Math.max(0, Math.min(1, coverage));
  const step = Math.max(1, drawWidth / peaks.length);
  ctx.beginPath();
  ctx.moveTo(0, mid);
  for (let i = 0; i < peaks.length; i++) {
    const x = i * step;
    const amp = peaks[i];
    const y = mid - amp * (height * 0.45);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(drawWidth, mid);
  for (let i = peaks.length - 1; i >= 0; i--) {
    const x = i * step;
    const amp = peaks[i];
    const y = mid + amp * (height * 0.45);
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.32;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

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

self.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;
  switch (data.type) {
    case "init": {
      canvas = data.canvas;
      color = data.color || color;
      ctx = canvas.getContext("2d");
      setSize(canvas.width || width, canvas.height || height, data.dpr ?? dpr);
      self.postMessage({ type: "ready" });
      break;
    }
    case "render": {
      peaks = data.peaks;
      duration = data.duration;
      beatGrid = data.beatGrid ?? [];
      color = data.color || color;
      coverage = typeof data.coverage === "number" ? Math.max(0, Math.min(1, data.coverage)) : 1;
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
