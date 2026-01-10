"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import { ZoomIn, ZoomOut } from "lucide-react";

interface WaveformProps {
  audioUrl: string;
  progress: number; // 0-100
  isPlaying: boolean; // Kept for potential future use
  onSeek: (time: number) => void;
  height?: number;
  hotCues?: Record<number, number>; // Hot cue points (index -> time in seconds)
  loopStart?: number | null; // Loop start time in seconds
  loopEnd?: number | null; // Loop end time in seconds
  onHotCueUpdate?: (padIndex: number, newTime: number) => void; // Callback when cue marker is dragged
}

export function Waveform({
  audioUrl,
  progress,
  isPlaying: _isPlaying, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSeek,
  height = 60,
  hotCues = {},
  loopStart = null,
  loopEnd = null,
  onHotCueUpdate,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isSeekingRef = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = no zoom, higher = more zoomed
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create regions plugin
    const regionsPlugin = RegionsPlugin.create();
    regionsPluginRef.current = regionsPlugin;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#3f3f46", // Zinc 700 - unplayed
      progressColor: "#FFD700", // Safety Yellow - played
      cursorColor: "rgba(255, 255, 255, 0.3)", // Thin white cursor
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: height,
      normalize: true,
      interact: true,
      dragToSeek: true,
      backend: "WebAudio",
      mediaControls: false,
      plugins: [regionsPlugin],
    });

    wavesurferRef.current = wavesurfer;

    // Load audio with abort guard
    try {
      // Some builds return a promise; guard aborts
      const maybePromise = wavesurfer.load(audioUrl) as unknown;
      if (
        maybePromise &&
        typeof (maybePromise as Promise<unknown>).catch === "function"
      ) {
        (maybePromise as Promise<unknown>).catch(() => {});
      }
    } catch {
      // Ignore race conditions on teardown
    }

    // Handle ready state
    wavesurfer.on("ready", () => {
      setIsReady(true);
    });
    // Swallow benign errors from abort/destroy
    wavesurfer.on("error", () => {});

    // Handle seek - sync with audio element
    // @ts-expect-error - WaveSurfer types may not include all events
    wavesurfer.on("seek", (seekProgress: number) => {
      if (!wavesurferRef.current) return;
      isSeekingRef.current = true;

      // Get duration from wavesurfer and calculate time
      const duration = wavesurferRef.current.getDuration();
      if (duration) {
        const time = seekProgress * duration;
        onSeek(time);
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 200);
    });

    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, onSeek, height]);

  // Note: WaveSurfer is visualization-only, actual playback is handled by AudioContext
  // We just sync the progress visualization

  // Sync progress from audio element to waveform (but not when user is seeking)
  useEffect(() => {
    // Sync progress only if not dragging
    if (!wavesurferRef.current || !isReady || isSeekingRef.current) return;

    const duration = wavesurferRef.current.getDuration();
    if (duration > 0) {
      const time = (progress / 100) * duration;
      // Prevent feedback loop: only seek if difference is significant
      const currentTime = wavesurferRef.current.getCurrentTime();
      if (Math.abs(currentTime - time) > 0.2) {
        wavesurferRef.current.setTime(time);
      }
    }
  }, [progress, isReady]);

  // Update hot cue markers
  useEffect(() => {
    if (!regionsPluginRef.current || !isReady || !wavesurferRef.current) return;

    const regions = regionsPluginRef.current;
    const duration = wavesurferRef.current.getDuration();

    // Clear existing cue markers (regions with id starting with "cue-")
    regions.getRegions().forEach((region) => {
      if (region.id.startsWith("cue-")) {
        region.remove();
      }
    });

    // Add new cue markers
    Object.entries(hotCues).forEach(([index, time]) => {
      if (time >= 0 && time <= duration) {
        const region = regions.addRegion({
          id: `cue-${index}`,
          start: time,
          end: time + 0.1, // Small width for visibility
          color:
            hoveredRegion === `cue-${index}`
              ? "rgba(255, 215, 0, 0.6)" // Brighter on hover
              : "rgba(255, 215, 0, 0.3)", // Safety Yellow with transparency
          drag: !!onHotCueUpdate, // Enable drag if callback provided
          resize: false,
        });

        // Add label to the region element
        if (region.element) {
          const label = document.createElement('div');
          label.textContent = (parseInt(index) + 1).toString(); // Display 1-based pad number
          label.style.cssText = `
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: #FFD700;
            color: #000;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            font-family: 'Barlow', sans-serif;
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
            z-index: 10;
          `;
          region.element.appendChild(label);
        }

        // Add hover event listeners
        if (region.element) {
          region.element.addEventListener("mouseenter", () => {
            setHoveredRegion(`cue-${index}`);
            if (region.element) {
              region.element.style.cursor = onHotCueUpdate ? "grab" : "pointer";
            }
          });

          region.element.addEventListener("mouseleave", () => {
            setHoveredRegion(null);
            if (region.element) {
              region.element.style.cursor = "default";
            }
          });
        }

        // Add drag update event listener
        if (onHotCueUpdate) {
          region.on("update-end", () => {
            const newTime = region.start;
            onHotCueUpdate(parseInt(index), newTime);
          });
        }
      }
    });
  }, [hotCues, isReady, onHotCueUpdate, hoveredRegion]);

  // Update loop region
  useEffect(() => {
    if (!regionsPluginRef.current || !isReady || !wavesurferRef.current) return;

    const regions = regionsPluginRef.current;
    const duration = wavesurferRef.current.getDuration();

    // Clear existing loop region
    const existingLoop = regions.getRegions().find((r) => r.id === "loop");
    if (existingLoop) {
      existingLoop.remove();
    }

    // Add new loop region if both start and end are defined
    if (
      loopStart !== null &&
      loopEnd !== null &&
      loopStart >= 0 &&
      loopEnd <= duration &&
      loopStart < loopEnd
    ) {
      regions.addRegion({
        id: "loop",
        start: loopStart,
        end: loopEnd,
        color: "rgba(255, 215, 0, 0.15)", // Semi-transparent Safety Yellow
        drag: false,
        resize: false,
      });
    }
  }, [loopStart, loopEnd, isReady]);

  // Handle zoom controls
  const handleZoomIn = () => {
    if (wavesurferRef.current) {
      const newZoom = Math.min(zoomLevel * 1.5, 10); // Max 10x zoom
      setZoomLevel(newZoom);
      wavesurferRef.current.zoom(newZoom * 50); // WaveSurfer zoom units
    }
  };

  const handleZoomOut = () => {
    if (wavesurferRef.current) {
      const newZoom = Math.max(zoomLevel / 1.5, 1); // Min 1x zoom
      setZoomLevel(newZoom);
      wavesurferRef.current.zoom(newZoom * 50); // WaveSurfer zoom units
    }
  };

  const handleZoomReset = () => {
    if (wavesurferRef.current) {
      setZoomLevel(1);
      wavesurferRef.current.zoom(50); // Reset to default
    }
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
        className="w-full"
        style={{
          boxShadow: "0 0 15px rgb(204 255 0 / 0.1)",
        }}
      >
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}

export default Waveform;
