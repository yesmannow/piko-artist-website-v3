"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { JogWheel } from "./dj-ui/JogWheel";
import { PerformancePads } from "./dj-ui/PerformancePads";
import { Fader } from "./dj-ui/Fader";
import { Tooltip } from "./dj-ui/Tooltip";
import { Play, Pause, RotateCcw, Link2, Repeat } from "lucide-react";

interface DJDeckProps {
  trackUrl: string | null;
  isPlaying: boolean;
  speed: number; // Playback rate (1.0 = 0%, range 0.92 to 1.08 for +/- 8%)
  onLoaded?: () => void;
  deckColor: string; // Color for waveform (e.g., "#4a90e2" or "#e24a4a")
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
    const [loopStart, setLoopStart] = useState<number | null>(null);
    const [loopBeats, setLoopBeats] = useState<number | null>(null);
    const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize WaveSurfer
    useEffect(() => {
      if (!waveformRef.current) return;

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#2a2a2a",
        progressColor: deckColor,
        cursorColor: deckColor,
        barWidth: 2,
        barRadius: 1,
        height: 100,
        normalize: true,
        backend: "MediaElement",
        mediaControls: false,
        interact: true,
        xhr: {
          crossOrigin: "anonymous",
        },
      });

      wavesurferRef.current = ws;

      ws.on("ready", () => {
        setDuration(ws.getDuration());
        onLoaded?.();

        // Connect to Web Audio API if provided
        if (audioContext && outputNode) {
          try {
            const mediaElement = ws.getMediaElement();
            if (!mediaElement) return;

            const mediaSource = audioContext.createMediaElementSource(mediaElement);
            mediaSourceRef.current = mediaSource;

            // Connect: MediaElement -> Mixer Input (outputNode)
            // The mixer handles EQ, volume, crossfader, and master output
            mediaSource.connect(outputNode);
            // Note: Do NOT connect to destination here, the Mixer handles that.
          } catch (error) {
            console.warn("Could not connect media element to Web Audio:", error);
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
        if (ws.isPlaying() && duration > 0) {
          const rotationValue = (time / duration) * 360;
          setRotation(rotationValue);
        }
      });

      return () => {
        if (mediaSourceRef.current) {
          try {
            mediaSourceRef.current.disconnect();
          } catch {
            // Ignore disconnect errors
          }
        }
        ws.destroy();
      };
    }, [trackUrl, deckColor, audioContext, outputNode, onLoaded, isPlaying, duration]);

    // Load track when URL changes
    useEffect(() => {
      if (wavesurferRef.current && trackUrl) {
        wavesurferRef.current.load(trackUrl);
      }
    }, [trackUrl]);

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
        if (audioContext && outputNode && !mediaSourceRef.current) {
          try {
            const mediaElement = wavesurferRef.current.getMediaElement();
            if (mediaElement) {
              const mediaSource = audioContext.createMediaElementSource(mediaElement);
              mediaSourceRef.current = mediaSource;
              mediaSource.connect(outputNode);
            }
          } catch (error) {
            console.warn("Could not connect media element to Web Audio:", error);
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
      // Optionally resume playback if it was playing before
      // if (wasPlayingBeforeScrubRef.current && wavesurferRef.current) {
      //   wavesurferRef.current.play();
      // }
    };

    // Handle performance pad cues
    const handleCueSet = (padIndex: number, time: number) => {
      // Store cue point (could be expanded to support multiple pads)
      if (padIndex === 0) {
        setCuePoint(time);
      }
    };

    const handleCueJump = (time: number) => {
      if (wavesurferRef.current && duration) {
        wavesurferRef.current.seekTo(time / duration);
      }
    };

    const handleCueClear = (padIndex: number) => {
      if (padIndex === 0) {
        setCuePoint(null);
      }
    };

    // Handle loop functionality
    const handleLoop = (beats: number) => {
      if (!wavesurferRef.current || !duration) return;

      // Assuming 120 BPM average (2 beats per second)
      const beatsPerSecond = 2;
      const loopDuration = beats / beatsPerSecond;
      const currentTime = wavesurferRef.current.getCurrentTime();

      if (isLooping && loopBeats === beats) {
        // Disable loop
        setIsLooping(false);
        setLoopStart(null);
        setLoopBeats(null);
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
          loopIntervalRef.current = null;
        }
      } else {
        // Enable loop
        setIsLooping(true);
        setLoopStart(currentTime);
        setLoopBeats(beats);

        // Clear existing loop
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
        }

        // Set up loop check
        const checkLoop = () => {
          if (!wavesurferRef.current || !loopStart) return;
          const now = wavesurferRef.current.getCurrentTime();
          const loopEnd = loopStart + loopDuration;

          if (now >= loopEnd) {
            wavesurferRef.current.seekTo(loopStart / duration);
          }
        };

        loopIntervalRef.current = setInterval(checkLoop, 50);
      }
    };

    // Cleanup loop on unmount
    useEffect(() => {
      return () => {
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
        }
      };
    }, []);

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
      <div className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 w-full">
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
            className={`relative w-16 h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 ${
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
            className="relative w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-gray-700 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95"
            style={{
              boxShadow: isPlaying
                ? `0 0 20px ${deckColor}40, inset 0 0 10px ${deckColor}20`
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
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
              className={`relative w-16 h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 ${
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
        <div className="flex items-center gap-4">
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
              height={150}
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

          {/* Loop Controls */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider mb-1">
              LOOP
            </div>
            <div className="flex flex-col gap-2">
              {[4, 8, 16].map((beats) => (
                <button
                  key={beats}
                  onClick={() => handleLoop(beats)}
                  className={`relative w-12 h-10 rounded-lg border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 ${
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
          className="w-full rounded border border-gray-800 p-2"
          style={{
            minHeight: 100,
            background: `
              linear-gradient(to right, rgba(42, 42, 42, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(42, 42, 42, 0.1) 1px, transparent 1px),
              #0a0a0a
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Performance Pads */}
        <div data-tour="performance-pads">
          <PerformancePads
            onCueSet={handleCueSet}
            onCueJump={handleCueJump}
            onCueClear={handleCueClear}
            getCurrentTime={() => wavesurferRef.current?.getCurrentTime() || 0}
            helpText="Set Hot Cues or trigger Loops. Click to set/jump, Right-click to clear"
          />
        </div>

        {/* Track Info */}
        {trackUrl && (
          <div className="text-xs font-barlow uppercase text-gray-500 text-center">
            {trackUrl.split("/").pop()?.replace(".mp3", "") || "No Track"}
          </div>
        )}
      </div>
    );
  }
);

DJDeck.displayName = "DJDeck";

