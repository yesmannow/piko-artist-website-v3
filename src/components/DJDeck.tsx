"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { motion } from "framer-motion";
import WaveSurfer from "wavesurfer.js";
import { JogWheel } from "./dj-ui/JogWheel";
import { PerformancePads } from "./dj-ui/PerformancePads";
import { Fader } from "./dj-ui/Fader";
import { Tooltip } from "./dj-ui/Tooltip";
import { TrackTransition } from "./dj-ui/TrackTransition";
import { Play, Pause, RotateCcw, Link2, Repeat } from "lucide-react";

interface DJDeckProps {
  trackUrl: string | null;
  isPlaying: boolean;
  speed: number; // Playback rate (1.0 = 0%, range 0.92 to 1.08 for +/- 8%)
  onLoaded?: () => void;
  deckColor: string; // Color for waveform (e.g., "#00d9ff" for cyan Deck A or "#ff00d9" for magenta Deck B)
  deckLabel: string; // "DECK A" or "DECK B"
  onPlayPause: () => void;
  onCue?: () => void;
  onSync?: () => void;
  onSpeedChange?: (speed: number) => void;
  isSynced?: boolean;
  audioContext?: AudioContext;
  outputNode?: AudioNode;
  title?: string; // Track title to display
  coverArt?: string; // Cover art image URL for vinyl label
}

export interface DJDeckRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
}

export const DJDeck = forwardRef<DJDeckRef, DJDeckProps>(
    (
    {
      trackUrl,
      isPlaying,
      speed,
      onLoaded,
      deckColor,
      deckLabel,
      onPlayPause,
      onCue,
      onSync,
      onSpeedChange,
      isSynced = false,
      audioContext,
      outputNode,
      title,
      coverArt,
    },
    ref
  ) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const [rotation, setRotation] = useState(0);
    const [duration, setDuration] = useState(0);
    const [cuePoint, setCuePoint] = useState<number | null>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const wasPlayingBeforeScrubRef = useRef(false);
  const [isLooping, setIsLooping] = useState(false);
  const [, setLoopStart] = useState<number | null>(null); // Used internally for loop logic
  const [loopBeats, setLoopBeats] = useState<number | null>(null);
    const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [previousTrackUrl, setPreviousTrackUrl] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Initialize WaveSurfer
    useEffect(() => {
      if (!waveformRef.current) return;

      // 1. Create Audio Element with CORS (Crucial for Web Audio API)
      const audio = document.createElement("audio");
      audio.crossOrigin = "anonymous";
      audio.controls = false;

      // 2. Initialize WaveSurfer with this element
      // Determine waveform colors based on deck color (cyan for A, magenta for B)
      const isCyan = deckColor === "#00d9ff" || deckColor.includes("00d9ff") || deckColor.includes("00ffff");
      const waveColor = isCyan ? "#004d66" : "#66004d"; // Darker version of deck color for unplayed waveform
      const progressColor = deckColor; // Bright deck color for played portion
      const cursorColor = deckColor; // Deck color for cursor

      // Make height responsive for mobile devices
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const waveformHeight = isMobile ? 80 : 100;

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: waveColor,
        progressColor: progressColor,
        cursorColor: cursorColor,
        barWidth: 2,
        barRadius: 1,
        height: waveformHeight,
        normalize: true,
        backend: "MediaElement", // Use the element we created
        media: audio,            // Pass the element explicitly
        mediaControls: false,
        interact: true, // Enable clicking on waveform for scrubbing
        dragToSeek: true, // Enable dragging on waveform for scrubbing
      });

      wavesurferRef.current = ws;

      ws.on("ready", () => {
        setDuration(ws.getDuration());
        onLoaded?.();

        // 3. Connect to Web Audio Mixer
        if (audioContext && outputNode) {
          try {
            // Disconnect old source if exists
            if (mediaSourceRef.current) {
              try {
                mediaSourceRef.current.disconnect();
              } catch {
                // Ignore disconnect errors
              }
            }

            const mediaElement = ws.getMediaElement();
            const mediaSource = audioContext.createMediaElementSource(mediaElement);
            mediaSourceRef.current = mediaSource;

            // Connect to the specific Deck Input (High/Mid/Low Filter Chain)
            mediaSource.connect(outputNode);
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.warn("Audio Routing Error:", error);
            }
          }
        }
      });

      ws.on("play", () => {
        // Play event handled by parent
      });

      ws.on("pause", () => {
        // Pause event handled by parent
      });

      ws.on("timeupdate", (time: number) => {
        const d = ws.getDuration();
        if (d > 0) setRotation((time / d) * 360);
      });

      return () => {
        // Clean up carefully to prevent context loss
        if (mediaSourceRef.current) {
          try {
            mediaSourceRef.current.disconnect();
          } catch {
            // Ignore disconnect errors
          }
        }
        ws.destroy();
      };
    }, [trackUrl, deckColor, audioContext, outputNode, onLoaded]);

    // Load track when URL changes with transition effect
    useEffect(() => {
      if (wavesurferRef.current && trackUrl) {
        // Trigger transition if track changed
        if (previousTrackUrl && previousTrackUrl !== trackUrl) {
          setIsTransitioning(true);
          setTimeout(() => setIsTransitioning(false), 1000);
        }
        setPreviousTrackUrl(trackUrl);
        wavesurferRef.current.load(trackUrl);
      }
    }, [trackUrl, previousTrackUrl]);

    // Update playback rate
    useEffect(() => {
      if (wavesurferRef.current) {
        wavesurferRef.current.setPlaybackRate(speed);
      }
    }, [speed]);

    // Volume is now controlled by the mixer chain in DJInterface
    // No need to update gain node here

    // Handle play/pause
    const handlePlayPause = async () => {
      // FORCE WAKE UP
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (wavesurferRef.current) {
        wavesurferRef.current.playPause();
      }
      onPlayPause();
    };

    // Sync isPlaying with wavesurfer state and ensure audio connection
    useEffect(() => {
      if (!wavesurferRef.current) return;

      const ensureConnection = async () => {
        // FORCE WAKE UP audio context if suspended
        if (audioContext && audioContext.state === "suspended") {
          await audioContext.resume();
        }

        // Ensure media source is connected
        if (audioContext && outputNode && !mediaSourceRef.current && wavesurferRef.current) {
          try {
            const mediaElement = wavesurferRef.current.getMediaElement();
            if (mediaElement) {
              const mediaSource = audioContext.createMediaElementSource(mediaElement);
              mediaSourceRef.current = mediaSource;
              mediaSource.connect(outputNode);
            }
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.warn("Could not connect media element to Web Audio:", error);
            }
          }
        }
      };

      ensureConnection();

      if (isPlaying && !wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.play();
      } else if (!isPlaying && wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.pause();
      }
    }, [isPlaying, audioContext, outputNode]);

    // Handle cue button
    const handleCue = () => {
      if (wavesurferRef.current) {
        if (cuePoint === null) {
          // Set cue point at current position
          const currentTime = wavesurferRef.current.getCurrentTime();
          setCuePoint(currentTime);
        } else {
          // Jump to cue point
          wavesurferRef.current.seekTo(cuePoint / (wavesurferRef.current.getDuration() || 1));
        }
        onCue?.();
      }
    };

    // Handle vinyl mode scrubbing
    const handleScrub = (deltaAngle: number) => {
      if (!wavesurferRef.current || !duration) return;

      // Convert angle delta to time delta (rough approximation)
      // 360 degrees = full track duration
      const timeDelta = (deltaAngle / 360) * duration * 0.1; // Sensitivity factor
      const currentTime = wavesurferRef.current.getCurrentTime();
      const newTime = Math.max(0, Math.min(duration, currentTime + timeDelta));

      wavesurferRef.current.seekTo(newTime / duration);
    };

    const handleDragStart = () => {
      if (wavesurferRef.current) {
        wasPlayingBeforeScrubRef.current = wavesurferRef.current.isPlaying();
        if (wasPlayingBeforeScrubRef.current) {
          wavesurferRef.current.pause();
        }
        setIsScrubbing(true);
      }
    };

    const handleDragEnd = () => {
      setIsScrubbing(false);
    };

    // Hot cues state (8 cues per deck) - stored but not directly used in render
    const [, setHotCues] = useState<Record<number, number>>({});

    // Handle performance pad cues (8 hot cues)
    const handleCueSet = useCallback((padIndex: number, time: number) => {
      setHotCues((prev) => ({
        ...prev,
        [padIndex]: time,
      }));
      // Also update single cue point for backward compatibility
      if (padIndex === 0) {
        setCuePoint(time);
      }
    }, []);

    const handleCueJump = useCallback((time: number) => {
      if (wavesurferRef.current && duration) {
        // Debounce rapid jumps to prevent audio glitches
        const seekRatio = time / duration;
        if (seekRatio >= 0 && seekRatio <= 1) {
          wavesurferRef.current.seekTo(seekRatio);
        }
      }
    }, [duration]);

    const handleCueClear = useCallback((padIndex: number) => {
      setHotCues((prev) => {
        const newCues = { ...prev };
        delete newCues[padIndex];
        return newCues;
      });
      // Also clear single cue point if it was pad 0
      if (padIndex === 0) {
        setCuePoint(null);
      }
    }, []);

    // Enhanced loop functionality with in/out markers
    const [loopIn, setLoopIn] = useState<number | null>(null);
    const [loopOut, setLoopOut] = useState<number | null>(null);

    const handleLoop = useCallback((beats: number) => {
      if (!wavesurferRef.current || !duration) return;

      // Assuming 120 BPM average (2 beats per second) - fallback if BPM unknown
      const beatsPerSecond = 2;
      const loopDuration = beats / beatsPerSecond;
      const currentTime = wavesurferRef.current.getCurrentTime();

      if (isLooping && loopBeats === beats && loopIn !== null) {
        // Disable loop
        setIsLooping(false);
        setLoopStart(null);
        setLoopBeats(null);
        setLoopIn(null);
        setLoopOut(null);
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
          loopIntervalRef.current = null;
        }
      } else {
        // Set loop in point at current position
        const loopInTime = currentTime;
        const loopOutTime = Math.min(loopInTime + loopDuration, duration);

        // Enable loop
        setIsLooping(true);
        setLoopStart(loopInTime);
        setLoopBeats(beats);
        setLoopIn(loopInTime);
        setLoopOut(loopOutTime);

        // Clear existing loop
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
        }

        // Set up loop check with smooth seeking
        const checkLoop = () => {
          if (!wavesurferRef.current || loopInTime === null) return;
          const now = wavesurferRef.current.getCurrentTime();

          // Check if we've passed the loop out point
          if (now >= loopOutTime || now < loopInTime) {
            // Smoothly seek back to loop in point
            const seekRatio = loopInTime / duration;
            if (seekRatio >= 0 && seekRatio <= 1) {
              wavesurferRef.current.seekTo(seekRatio);
            }
          }
        };

        // Check more frequently for better accuracy
        loopIntervalRef.current = setInterval(checkLoop, 30);
      }
    }, [isLooping, loopBeats, loopIn, duration]);

    // Set loop in point
    const handleSetLoopIn = useCallback(() => {
      if (wavesurferRef.current) {
        const currentTime = wavesurferRef.current.getCurrentTime();
        setLoopIn(currentTime);
        // If loop out is set and is before loop in, clear it
        if (loopOut !== null && loopOut <= currentTime) {
          setLoopOut(null);
        }
      }
    }, [loopOut]);

    // Set loop out point
    const handleSetLoopOut = useCallback(() => {
      if (wavesurferRef.current && loopIn !== null) {
        const currentTime = wavesurferRef.current.getCurrentTime();
        if (currentTime > loopIn) {
          setLoopOut(currentTime);
          // Calculate beats based on loop length
          const loopDuration = currentTime - loopIn;
          const beats = Math.round(loopDuration * 2); // Assuming 2 beats per second
          setLoopBeats(beats);
          setIsLooping(true);
          setLoopStart(loopIn);
        }
      }
    }, [loopIn]);

    // Cleanup loop on unmount or track change
    useEffect(() => {
      return () => {
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
          loopIntervalRef.current = null;
        }
        setIsLooping(false);
        setLoopStart(null);
        setLoopBeats(null);
      };
    }, [trackUrl]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      play: () => {
        wavesurferRef.current?.play();
      },
      pause: () => {
        wavesurferRef.current?.pause();
      },
      seek: (time: number) => {
        wavesurferRef.current?.seekTo(time);
      },
      getCurrentTime: () => {
        return wavesurferRef.current?.getCurrentTime() || 0;
      },
      getDuration: () => {
        return wavesurferRef.current?.getDuration() || 0;
      },
      setPlaybackRate: (rate: number) => {
        wavesurferRef.current?.setPlaybackRate(rate);
      },
      getPlaybackRate: () => {
        return wavesurferRef.current?.getPlaybackRate() || 1.0;
      },
    }));

    return (
      <motion.div
        className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 w-full relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Track Transition Effect */}
        <TrackTransition
          isTransitioning={isTransitioning}
          fromTrack={previousTrackUrl ? title || undefined : undefined}
          toTrack={trackUrl ? title || undefined : undefined}
        />
        {/* Deck Label */}
        <h3 className="text-lg font-barlow uppercase tracking-wider text-gray-300">
          {deckLabel}
        </h3>

        {/* Jog Wheel with Vinyl Mode */}
        <div className="w-full flex justify-center">
          <JogWheel
            rotation={rotation}
            isPlaying={isPlaying && !isScrubbing}
            size={Math.min(180, typeof window !== "undefined" ? window.innerWidth * 0.3 : 180)}
            onScrub={handleScrub}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            bpm={120} // Default BPM - can be made configurable in the future
            playbackRate={speed}
            coverArt={coverArt}
          />
        </div>

        {/* Transport Controls */}
        <div className="relative z-10 flex gap-2 md:gap-3 items-center flex-wrap justify-center" data-tour="sync-pitch">
          {/* Cue Button */}
          <button
            onClick={handleCue}
            aria-label={cuePoint !== null ? `Cue point set at ${cuePoint.toFixed(1)} seconds. Click to jump to cue.` : "Set cue point"}
            className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 touch-manipulation ${
              cuePoint !== null ? "border-orange-500" : "border-gray-700"
            }`}
            style={{
              boxShadow: cuePoint !== null
                ? `0 0 15px rgba(249, 115, 22, 0.3), inset 0 0 8px rgba(249, 115, 22, 0.1)`
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
            title={cuePoint !== null ? `Cue: ${cuePoint.toFixed(1)}s` : "Set Cue Point"}
          >
            <RotateCcw className="w-6 h-6" style={{ color: cuePoint !== null ? "#f97316" : deckColor }} />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            aria-label={isPlaying ? `Pause ${title || "track"} on ${deckLabel}` : `Play ${title || "track"} on ${deckLabel}`}
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1a1a1a] border-2 border-gray-700 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation"
            style={{
              boxShadow: isPlaying
                ? `0 0 20px ${deckColor}40, inset 0 0 10px ${deckColor}20`
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
              "--focus-ring-color": deckColor,
            } as React.CSSProperties & { "--focus-ring-color": string }}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" style={{ color: deckColor }} />
            ) : (
              <Play className="w-8 h-8 ml-1" style={{ color: deckColor }} />
            )}
          </button>

          {/* Sync Button */}
          <Tooltip content="Automatically matches this deck's BPM to the other deck">
            <button
              onClick={onSync}
              aria-label={isSynced ? `${deckLabel} is synced. Click to unsync.` : `Sync ${deckLabel} BPM to other deck`}
              className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 touch-manipulation ${
                isSynced ? "border-green-500" : "border-gray-700"
              }`}
              style={{
                boxShadow: isSynced
                  ? `0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 8px rgba(34, 197, 94, 0.1)`
                  : "inset 0 2px 4px rgba(0,0,0,0.5)",
              }}
              title="Sync BPM"
            >
              <Link2 className="w-6 h-6" style={{ color: isSynced ? "#22c55e" : deckColor }} />
            </button>
          </Tooltip>
        </div>

        {/* Pitch Fader (Vertical, +/- 8%) */}
        <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
              PITCH
            </div>
            <Fader
              value={(speed - 0.92) / 0.16} // Map 0.92-1.08 to 0-1
              onChange={(value) => {
                // Map 0-1 to 0.92-1.08
                const newSpeed = 0.92 + value * 0.16;
                onSpeedChange?.(newSpeed);
              }}
              height={typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 150}
              helpText="Adjusts playback speed (pitch). Range: -8% to +8%"
            />
            <div className="flex flex-col items-center gap-1 text-xs text-gray-500 font-barlow">
              <span>+8%</span>
              <span className="text-gray-400">0%</span>
              <span>-8%</span>
            </div>
            <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider mt-1">
              {speed >= 1 ? "+" : ""}{((speed - 1) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Enhanced Loop Controls */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider mb-1">
              LOOP
            </div>
            {/* Loop In/Out Controls */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleSetLoopIn}
                className={`px-2 py-1 text-[10px] font-barlow uppercase rounded border transition-all touch-manipulation min-h-[44px] ${
                  loopIn !== null
                    ? "bg-[#1a1a1a] border-[#ccff00] text-[#ccff00]"
                    : "bg-[#0a0a0a] border-gray-700 text-gray-500 hover:border-gray-600"
                }`}
                aria-label="Set loop in point"
                title="Set Loop In"
              >
                IN
              </button>
              <button
                onClick={handleSetLoopOut}
                disabled={loopIn === null}
                className={`px-2 py-1 text-[10px] font-barlow uppercase rounded border transition-all touch-manipulation min-h-[44px] ${
                  loopOut !== null
                    ? "bg-[#1a1a1a] border-[#ccff00] text-[#ccff00]"
                    : loopIn === null
                    ? "bg-[#0a0a0a] border-gray-700 text-gray-500 opacity-50 cursor-not-allowed"
                    : "bg-[#0a0a0a] border-gray-700 text-gray-500 hover:border-gray-600"
                }`}
                aria-label="Set loop out point"
                title="Set Loop Out"
              >
                OUT
              </button>
            </div>
            {/* Quick Loop Length Buttons */}
            <div className="flex flex-col gap-2">
              {[2, 4, 8, 16].map((beats) => (
                <button
                  key={beats}
                  onClick={() => handleLoop(beats)}
                  aria-label={isLooping && loopBeats === beats ? `${beats} beat loop active. Click to disable.` : `Enable ${beats} beat loop`}
                  className={`relative w-14 h-12 md:w-12 md:h-10 rounded-lg border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#ccff00] touch-manipulation min-h-[44px] ${
                    isLooping && loopBeats === beats
                      ? "bg-[#1a1a1a] border-[#ccff00]"
                      : "bg-[#0a0a0a] border-gray-700"
                  }`}
                  style={{
                    boxShadow:
                      isLooping && loopBeats === beats
                        ? `0 0 15px rgba(204, 255, 0, 0.3), inset 0 0 8px rgba(204, 255, 0, 0.1)`
                        : "inset 0 2px 4px rgba(0,0,0,0.5)",
                  }}
                  title={`${beats} Beat Loop`}
                >
                  <Repeat
                    className="w-4 h-4"
                    style={{
                      color: isLooping && loopBeats === beats ? "#ccff00" : deckColor,
                    }}
                  />
                  <span
                    className={`absolute bottom-0.5 text-[8px] font-barlow font-bold ${
                      isLooping && loopBeats === beats ? "text-[#ccff00]" : "text-gray-500"
                    }`}
                  >
                    {beats}
                  </span>
                </button>
              ))}
            </div>
            {/* Loop Status Display */}
            {isLooping && loopIn !== null && loopOut !== null && (
              <div className="text-[10px] font-barlow text-[#ccff00] text-center mt-1">
                {loopIn.toFixed(1)}s - {loopOut.toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Track Title */}
        {title && (
          <div className="w-full text-center">
            <h4 className="text-xl md:text-2xl font-bold text-[#ccff00] uppercase tracking-wider truncate px-4">
              {title}
            </h4>
          </div>
        )}

        {/* Waveform with Dark Grid Background */}
        <div
          ref={waveformRef}
          className="w-full rounded border border-gray-800 p-2 cursor-pointer"
          style={{
            minHeight: typeof window !== "undefined" && window.innerWidth < 768 ? 80 : 100,
            background: `
              linear-gradient(to right, rgba(42, 42, 42, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(42, 42, 42, 0.1) 1px, transparent 1px),
              #0a0a0a
            `,
            backgroundSize: "20px 20px",
          }}
          title="Click or drag to scrub through the track"
        />

        {/* Performance Pads */}
        <div data-tour="performance-pads">
          <PerformancePads
            onCueSet={handleCueSet}
            onCueJump={handleCueJump}
            onCueClear={handleCueClear}
            getCurrentTime={() => wavesurferRef.current?.getCurrentTime() || 0}
            helpText="Set Hot Cues (8 pads). Click to set/jump, Long press or Shift+Click to clear"
            numPads={typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 8}
          />
        </div>

        {/* Track Info */}
        {trackUrl && (
          <div className="text-xs font-barlow uppercase text-gray-500 text-center">
            {trackUrl.split("/").pop()?.replace(".mp3", "") || "No Track"}
          </div>
        )}
      </motion.div>
    );
  }
);

DJDeck.displayName = "DJDeck";

