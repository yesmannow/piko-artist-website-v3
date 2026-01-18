"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

interface WaveformProps {
  audioUrl: string;
  progress: number; // 0-100 (deprecated - use currentTime for sample accuracy)
  isPlaying: boolean; // Kept for potential future use
  onSeek: (time: number) => void;
  height?: number;
  hotCues?: Record<number, number>; // Hot cue points (index -> time in seconds)
  loopStart?: number | null; // Loop start time in seconds
  loopEnd?: number | null; // Loop end time in seconds
  onHotCueUpdate?: (padIndex: number, newTime: number) => void; // Callback when cue marker is dragged
  currentTime?: number; // Sample-accurate current time from AudioContext.currentTime
}

interface FrequencyData {
  bass: number[]; // <250Hz
  highs: number[]; // >2kHz
  timestamp: number;
}

// Frequency band definitions
const BASS_CUTOFF = 250; // Hz
const HIGH_CUTOFF = 2000; // Hz
const FFT_SIZE = 2048;
const SMOOTHING_TIME_CONSTANT = 0.8;
const FREQUENCY_BIN_COUNT = FFT_SIZE / 2;

// Color schemes for professional DJ standards
const COLORS = {
  bass: "#DC2626", // Red for bass (<250Hz)
  highs: "#2563EB", // Blue for highs (>2kHz)
  progress: "#FFD700", // Safety Yellow for playhead
  background: "#3F3F46", // Zinc 700 for background
  markers: "#FFD700", // Safety Yellow for markers
} as const;

export function Waveform({
  audioUrl,
  progress,
  isPlaying: _isPlaying,  
  onSeek,
  height = 60,
  hotCues = {},
  loopStart = null,
  loopEnd = null,
  onHotCueUpdate,
  currentTime,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Audio analysis state
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<FrequencyData[]>([]);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Interaction state
  const isSeekingRef = useRef(false);
  const dragStateRef = useRef<{
    isDragging: boolean;
    dragType: "playhead" | "cue" | null;
    cueIndex: number | null;
    startX: number;
    startTime: number;
  }>({
    isDragging: false,
    dragType: null,
    cueIndex: null,
    startX: 0,
    startTime: 0,
  });

  // Initialize audio context and load audio
  useEffect(() => {
    if (!audioUrl) {
      setIsReady(false);
      return;
    }

    const initializeAudio = async () => {
      try {
        // Create audio context
        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        audioContextRef.current = audioContext;

        // Create analyser for real-time frequency analysis
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
        analyserRef.current = analyser;

        // Load and decode audio
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        audioBufferRef.current = audioBuffer;
        setDuration(audioBuffer.duration);

        // Perform offline frequency analysis
        await performFrequencyAnalysis(audioBuffer, audioContext);

        setIsReady(true);
      } catch (error) {
        console.error("Failed to load audio for waveform:", error);
        setIsReady(false);
      }
    };

    initializeAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      frequencyDataRef.current = [];
    };
  }, [audioUrl]);

  // Perform offline frequency analysis
  const performFrequencyAnalysis = useCallback(
    async (audioBuffer: AudioBuffer, audioContext: AudioContext) => {
      const channelData = audioBuffer.getChannelData(0); // Use first channel
      const sampleRate = audioBuffer.sampleRate;
      const totalSamples = channelData.length;
      const duration = audioBuffer.duration;

      const analysisDuration = duration;
      const sampleRateAnalysis = 30; // 30 FPS analysis
      const frameCount = Math.floor(analysisDuration * sampleRateAnalysis);

      frequencyDataRef.current = [];

      // Simple frequency band analysis using basic filtering
      // This is more efficient than FFT for our use case
      const bassFilter = createSimpleBandpassFilter(BASS_CUTOFF, sampleRate);
      const highFilter = createSimpleHighpassFilter(HIGH_CUTOFF, sampleRate);

      const chunkSize = Math.floor(totalSamples / frameCount);

      for (let frame = 0; frame < frameCount; frame++) {
        const startSample = frame * chunkSize;
        const endSample = Math.min(startSample + chunkSize, totalSamples);
        const time = (frame / frameCount) * analysisDuration;

        // Extract chunk
        const chunk = channelData.slice(startSample, endSample);

        // Calculate RMS for original signal (for reference)
        const rms = Math.sqrt(
          chunk.reduce((sum, sample) => sum + sample * sample, 0) /
            chunk.length,
        );

        // Apply simple filtering for frequency bands
        const bassFiltered = applySimpleLowpassFilter(chunk, bassFilter);
        const highFiltered = applySimpleHighpassFilter(chunk, highFilter);

        // Calculate RMS for each band
        const bassRms = Math.sqrt(
          bassFiltered.reduce(
            (sum: number, sample: number) => sum + sample * sample,
            0,
          ) / bassFiltered.length,
        );
        const highRms = Math.sqrt(
          highFiltered.reduce(
            (sum: number, sample: number) => sum + sample * sample,
            0,
          ) / highFiltered.length,
        );

        // Convert to 0-255 range like Web Audio API analyser
        const bassAmplitude = Math.min(255, bassRms * 1000);
        const highAmplitude = Math.min(255, highRms * 1000);

        frequencyDataRef.current.push({
          bass: [bassAmplitude],
          highs: [highAmplitude],
          timestamp: time,
        });
      }
    },
    [],
  );

  // Simple lowpass filter for bass frequencies
  const createSimpleBandpassFilter = (cutoff: number, sampleRate: number) => {
    const rc = 1.0 / (cutoff * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    return { alpha, prevOutput: 0 };
  };

  // Simple highpass filter for high frequencies
  const createSimpleHighpassFilter = (cutoff: number, sampleRate: number) => {
    const rc = 1.0 / (cutoff * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = rc / (rc + dt);
    return { alpha, prevInput: 0, prevOutput: 0 };
  };

  // Apply simple lowpass filter
  const applySimpleLowpassFilter = (
    input: Float32Array,
    filter: { alpha: number; prevOutput: number },
  ) => {
    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      output[i] =
        filter.alpha * input[i] + (1 - filter.alpha) * filter.prevOutput;
      filter.prevOutput = output[i];
    }
    return output;
  };

  // Apply simple highpass filter
  const applySimpleHighpassFilter = (
    input: Float32Array,
    filter: { alpha: number; prevInput: number; prevOutput: number },
  ) => {
    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      output[i] =
        filter.alpha * (filter.prevOutput + input[i] - filter.prevInput);
      filter.prevInput = input[i];
      filter.prevOutput = output[i];
    }
    return output;
  };

  // Render waveform on canvas
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas || !isReady || !audioBufferRef.current)
      return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!ctx || !overlayCtx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvases
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    overlayCtx.clearRect(0, 0, width, height);

    const data = frequencyDataRef.current;
    if (data.length === 0) return;

    // Render frequency-colored waveform
    const barWidth = width / data.length;

    data.forEach((frame, index) => {
      const x = index * barWidth;
      const centerY = height / 2;

      // Render bass (red) - bottom half
      const bassHeight = (frame.bass[0] / 255) * (height / 2);
      ctx.fillStyle = COLORS.bass;
      ctx.fillRect(x, centerY, barWidth, bassHeight);

      // Render highs (blue) - top half
      const highHeight = (frame.highs[0] / 255) * (height / 2);
      ctx.fillStyle = COLORS.highs;
      ctx.fillRect(x, centerY - highHeight, barWidth, highHeight);
    });

    // Render progress indicator
    const playheadTime =
      currentTime !== undefined ? currentTime : (progress / 100) * duration;
    const progressX = duration > 0 ? (playheadTime / duration) * width : 0;
    overlayCtx.strokeStyle = COLORS.progress;
    overlayCtx.lineWidth = 2;
    overlayCtx.beginPath();
    overlayCtx.moveTo(progressX, 0);
    overlayCtx.lineTo(progressX, height);
    overlayCtx.stroke();

    // Render hot cues
    Object.entries(hotCues).forEach(([index, time]) => {
      const cueX = (time / duration) * width;
      const isHovered = hoveredRegion === `cue-${index}`;

      // Draw cue marker
      overlayCtx.fillStyle = isHovered
        ? "rgba(255, 215, 0, 0.8)"
        : "rgba(255, 215, 0, 0.6)";
      overlayCtx.fillRect(cueX - 2, 0, 4, height);

      // Draw cue label
      overlayCtx.fillStyle = COLORS.markers;
      overlayCtx.font = "10px Barlow, sans-serif";
      overlayCtx.fillText((parseInt(index) + 1).toString(), cueX + 5, 15);
    });

    // Render loop region
    if (loopStart !== null && loopEnd !== null) {
      const startX = (loopStart / duration) * width;
      const endX = (loopEnd / duration) * width;
      const regionWidth = endX - startX;

      overlayCtx.fillStyle = "rgba(255, 215, 0, 0.15)";
      overlayCtx.fillRect(startX, 0, regionWidth, height);

      overlayCtx.strokeStyle = COLORS.markers;
      overlayCtx.lineWidth = 1;
      overlayCtx.strokeRect(startX, 0, regionWidth, height);
    }
  }, [
    isReady,
    progress,
    currentTime,
    hotCues,
    loopStart,
    loopEnd,
    duration,
    hoveredRegion,
  ]);

  // Handle canvas resize and rendering
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!canvas || !overlayCanvas || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;

      overlayCanvas.width = rect.width * dpr;
      overlayCanvas.height = height * dpr;
      overlayCanvas.style.width = `${rect.width}px`;
      overlayCanvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      const overlayCtx = overlayCanvas.getContext("2d");
      if (ctx && overlayCtx) {
        ctx.scale(dpr, dpr);
        overlayCtx.scale(dpr, dpr);
      }

      renderWaveform();
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [renderWaveform, height]);

  // Re-render when data changes
  useEffect(() => {
    renderWaveform();
  }, [renderWaveform]);

  // Handle mouse interactions
  const getMousePosition = useCallback(
    (event: React.MouseEvent) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return { x: 0, time: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const time = (x / rect.width) * duration;

      return { x, time };
    },
    [duration],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isReady) return;

      const { x, time } = getMousePosition(event);

      // Check if clicking on a cue marker
      let clickedCue = null;
      Object.entries(hotCues).forEach(([index, cueTime]) => {
        const cueX =
          (cueTime / duration) *
          (overlayCanvasRef.current?.getBoundingClientRect().width || 0);
        if (Math.abs(x - cueX) < 10) {
          clickedCue = parseInt(index);
        }
      });

      if (clickedCue !== null && onHotCueUpdate) {
        dragStateRef.current = {
          isDragging: true,
          dragType: "cue",
          cueIndex: clickedCue,
          startX: x,
          startTime: time,
        };
      } else {
        // Seek to position
        dragStateRef.current = {
          isDragging: true,
          dragType: "playhead",
          cueIndex: null,
          startX: x,
          startTime: time,
        };
        onSeek(time);
        isSeekingRef.current = true;
      }
    },
    [isReady, getMousePosition, hotCues, duration, onSeek, onHotCueUpdate],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const { time } = getMousePosition(event);

      if (dragStateRef.current.isDragging) {
        if (
          dragStateRef.current.dragType === "cue" &&
          dragStateRef.current.cueIndex !== null &&
          onHotCueUpdate
        ) {
          onHotCueUpdate(dragStateRef.current.cueIndex, time);
        } else if (dragStateRef.current.dragType === "playhead") {
          onSeek(time);
        }
      } else {
        // Check for hover over cues
        let hoveredCue = null;
        Object.entries(hotCues).forEach(([index, cueTime]) => {
          const cueX =
            (cueTime / duration) *
            (overlayCanvasRef.current?.getBoundingClientRect().width || 0);
          const mouseX =
            event.clientX -
            (overlayCanvasRef.current?.getBoundingClientRect().left || 0);
          if (Math.abs(mouseX - cueX) < 10) {
            hoveredCue = `cue-${index}`;
          }
        });
        setHoveredRegion(hoveredCue);
      }
    },
    [getMousePosition, hotCues, duration, onSeek, onHotCueUpdate],
  );

  const handleMouseUp = useCallback(() => {
    dragStateRef.current = {
      isDragging: false,
      dragType: null,
      cueIndex: null,
      startX: 0,
      startTime: 0,
    };
    isSeekingRef.current = false;
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 10));
    // Note: Zoom implementation would require more complex canvas rendering
    // For now, this is a placeholder
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.5, 1));
    // Note: Zoom implementation would require more complex canvas rendering
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  return (
    <div className="w-full relative">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 1}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Zoom Out"
          aria-label="Zoom out waveform"
        >
          <ZoomOut className="w-4 h-4 text-[#FFD700]" />
        </button>
        <button
          onClick={handleZoomReset}
          disabled={zoomLevel === 1}
          className="px-2 py-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-barlow text-[#FFD700]"
          title="Reset Zoom"
          aria-label="Reset zoom to default"
        >
          {zoomLevel.toFixed(1)}x
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 10}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Zoom In"
          aria-label="Zoom in waveform"
        >
          <ZoomIn className="w-4 h-4 text-[#FFD700]" />
        </button>
      </div>

      {/* Waveform Container */}
      <div
        ref={containerRef}
        className="w-full relative cursor-pointer"
        style={{
          height: `${height}px`,
          boxShadow: "0 0 15px rgb(204 255 0 / 0.1)",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Main waveform canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Overlay canvas for markers and playhead */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Loading state */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
            <div className="text-white/60 text-sm">Analyzing audio...</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Waveform;
