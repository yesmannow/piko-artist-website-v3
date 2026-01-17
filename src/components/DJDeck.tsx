"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import WaveSurfer from "wavesurfer.js";
import { JogWheel } from "./dj-ui/JogWheel";
import { SpinningVinyl } from "./dj-ui/SpinningVinyl";
import { PerformancePads } from "./dj-ui/PerformancePads";
import { Fader } from "./dj-ui/Fader";
import { Tooltip } from "./dj-ui/Tooltip";
import { TrackTransition } from "./dj-ui/TrackTransition";
import { MIDIButton } from "./dj-ui/MIDIButton";
import {
  Play,
  Pause,
  RotateCcw,
  Link2,
  Repeat,
  RotateCw,
  Music,
  Grid3x3,
  Radio,
} from "lucide-react";
import { useBPMDetection } from "@/hooks/useBPMDetection";
import {
  reverseAudioBuffer,
  calculateBeatPositions,
  snapToBeat,
  quantizeLoop,
} from "@/utils/audioUtils";
import { useMIDIStore } from "@/store/useMIDIStore";

// Lazy load heavy components
const Waveform = lazy(() => import("./dj-ui/Waveform"));

// Utility function to format time remaining as -MM:SS
function formatTimeRemaining(seconds: number): string {
  if (seconds < 0) return "-0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `-${minutes}:${String(secs).padStart(2, "0")}`;
}

// Utility function to format time elapsed as MM:SS
function formatTimeElapsed(seconds: number): string {
  if (seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

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
  audioBuffer?: AudioBuffer | null; // Audio buffer for BPM detection
  onReverse?: (reverse: boolean) => void; // Callback for reverse playback
  isReversed?: boolean; // Whether track is playing in reverse
  quantize?: boolean; // Whether to snap to beat grid
  // Slip Mode props
  isSlipMode?: boolean; // Whether Slip Mode is active
  onSlipModeToggle?: () => void; // Callback to toggle Slip Mode
  onScratch?: (velocity: number, isTouching: boolean) => void; // Callback for scratch/velocity
  deckId?: "A" | "B"; // Deck identifier for scratch callback
  // Hot Cues props
  hotCues?: Record<number, number>; // External hot cues state from useDualDeck
  onHotCueSet?: (padIndex: number, time: number) => void; // Callback to set hot cue
  onHotCueClear?: (padIndex: number) => void; // Callback to clear hot cue
  // Haptic feedback
  onHapticTrigger?: () => void; // Haptic feedback trigger
  // Library trigger
  onLibraryOpen?: () => void; // Callback to open library modal
  // FX active state
  isFxActive?: boolean; // Whether FX are currently active on this deck
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
      audioBuffer,
      onReverse,
      isReversed = false,
      quantize = false,
      isSlipMode = false,
      onSlipModeToggle,
      onScratch,
      deckId = "A",
      hotCues: externalHotCues,
      onHotCueSet,
      onHotCueClear,
      onHapticTrigger,
      onLibraryOpen,
      isFxActive,
    },
    ref,
  ) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const reversedBufferRef = useRef<AudioBuffer | null>(null);
    const reverseGainRef = useRef<GainNode | null>(null);
    const reversePositionRef = useRef<number>(0);
    const reverseIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reverseStartTimeRef = useRef<number>(0);
    const [rotation, setRotation] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [cuePoint, setCuePoint] = useState<number | null>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const wasPlayingBeforeScrubRef = useRef(false);
    const [isLooping, setIsLooping] = useState(false);
    const [, setLoopStart] = useState<number | null>(null); // Used internally for loop logic
    const [loopBeats, setLoopBeats] = useState<number | null>(null);
    const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [previousTrackUrl, setPreviousTrackUrl] = useState<string | null>(
      null,
    );
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showBeatGrid, setShowBeatGrid] = useState(false);
    const [beatPositions, setBeatPositions] = useState<number[]>([]);
    const [quantizeEnabled, setQuantizeEnabled] = useState(false);
    const [beatGridOffset, setBeatGridOffset] = useState(0); // seconds; adjust if BPM grid is slightly off
    const [isReversedState, setIsReversedState] = useState(isReversed || false);
    const [showElapsedTime, setShowElapsedTime] = useState(false); // Toggle between elapsed and remaining time

    // MIDI store
    const { learnMode } = useMIDIStore();

    // Use internal state for isReversed, sync with prop if it changes
    useEffect(() => {
      if (isReversed !== undefined) {
        setIsReversedState(isReversed);
      }
    }, [isReversed]);

    // BPM Detection
    const {
      bpm,
      confidence,
      isDetecting: isDetectingBPM,
    } = useBPMDetection({
      audioBuffer,
      trackTitle: title || "",
      trackArtist: "",
      enabled: !!trackUrl,
    });

    // Calculate beat positions when BPM is available
    useEffect(() => {
      if (bpm && duration > 0) {
        const beats = calculateBeatPositions(duration, bpm);
        setBeatPositions(beats);
      } else {
        setBeatPositions([]);
      }
    }, [bpm, duration]);

    // Create reversed buffer when audio buffer is available
    useEffect(() => {
      if (audioBuffer && audioContext) {
        try {
          reversedBufferRef.current = reverseAudioBuffer(
            audioBuffer,
            audioContext,
          );
        } catch {
          reversedBufferRef.current = null;
        }
      } else {
        reversedBufferRef.current = null;
      }
    }, [audioBuffer, audioContext]);

    // Initialize WaveSurfer
    useEffect(() => {
      if (!waveformRef.current) return;

      // 1. Create Audio Element
      const audio = document.createElement("audio");
      // Only set CORS for external URLs; local files don't need (and may reject) CORS
      if (trackUrl && /^(https?:)?\/\//i.test(trackUrl)) {
        audio.crossOrigin = "anonymous";
      }
      audio.controls = false;
      audio.preload = "auto";
      audio.muted = false;
      audio.volume = 1;

      // 2. Initialize WaveSurfer with this element
      // Determine waveform colors based on deck color (cyan for A, magenta for B)
      const isCyan =
        deckColor === "#00d9ff" ||
        deckColor.includes("00d9ff") ||
        deckColor.includes("00ffff");
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
        media: audio, // Pass the element explicitly
        mediaControls: false,
        interact: true, // Enable clicking on waveform for scrubbing
        dragToSeek: true, // Enable dragging on waveform for scrubbing
      });

      wavesurferRef.current = ws;

      const connectMedia = () => {
        setDuration(ws.getDuration());
        onLoaded?.();

        // 3. Connect to Web Audio Mixer
        if (audioContext && outputNode) {
          try {
            // Only create source once per media element to avoid InvalidStateError
            if (!mediaSourceRef.current) {
              const mediaElement = ws.getMediaElement();
              if (!mediaElement) {
                console.error("DJDeck: No media element available from WaveSurfer");
                return;
              }
              
              console.log(`DJDeck (${deckLabel}): Creating MediaElementSource and connecting to output`);
              const mediaSource = audioContext.createMediaElementSource(mediaElement);
              mediaSourceRef.current = mediaSource;
              // Connect to the specific Deck Input (High/Mid/Low Filter Chain)
              mediaSource.connect(outputNode);
              console.log(`DJDeck (${deckLabel}): Audio routing connected successfully`);
            } else {
              // Source already exists, ensure it's connected
              console.log(`DJDeck (${deckLabel}): MediaElementSource already exists, ensuring connection`);
              try {
                mediaSourceRef.current.connect(outputNode);
                console.log(`DJDeck (${deckLabel}): Reconnected existing source`);
              } catch (connectError) {
                // Already connected or connection failed
                console.log(`DJDeck (${deckLabel}): Source already connected or connection failed (this is normal)`, connectError);
              }
            }
          } catch (error) {
            console.error(`DJDeck (${deckLabel}): Audio Routing Error:`, error);
            // Try to recover by clearing the ref and retrying once
            if (mediaSourceRef.current) {
              console.log(`DJDeck (${deckLabel}): Attempting to recover from error by clearing stale reference`);
              try {
                mediaSourceRef.current.disconnect();
              } catch (disconnectError) {
                // Ignore disconnect errors
              }
              mediaSourceRef.current = null;
            }
          }
        } else {
          console.warn(`DJDeck (${deckLabel}): Missing audioContext or outputNode, cannot connect audio`);
        }
      };

      ws.on("ready", connectMedia);
      // Fallback: also attempt connection on play (covers some mobile browsers)
      ws.on("play", connectMedia);

      // 'play' handled above for connection

      ws.on("pause", () => {
        // Pause event handled by parent
      });

      ws.on("timeupdate", (time: number) => {
        const d = ws.getDuration();
        if (d > 0) {
          setRotation((time / d) * 360);
          setCurrentPosition(time);
        }
      });

      // Swallow benign errors from teardown/aborted loads
      ws.on("error", (error) => {
        // Silently ignore AbortErrors and network errors during cleanup
        // These are expected when tracks change or component unmounts
      });

      return () => {
        // Clean up carefully to prevent context loss
        if (mediaSourceRef.current) {
          try {
            mediaSourceRef.current.disconnect();
          } catch {
            // Ignore disconnect errors
          } finally {
            mediaSourceRef.current = null;
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

        // Use AbortController to properly cancel pending loads
        const abortController = new AbortController();

        try {
          wavesurferRef.current.load(trackUrl);
        } catch (error) {
          // Silently ignore AbortErrors and other loading errors
          // These are expected when tracks change rapidly or component unmounts
        }

        return () => {
          abortController.abort();
        };
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

    // Handle reverse playback
    const handleReversePlayback = useCallback(async () => {
      if (!audioContext || !reversedBufferRef.current || !outputNode) {
        return;
      }

      // Stop any existing reverse playback
      if (bufferSourceRef.current) {
        try {
          bufferSourceRef.current.stop();
        } catch {
          // Already stopped
        }
        bufferSourceRef.current = null;
      }

      if (reverseIntervalRef.current) {
        clearInterval(reverseIntervalRef.current);
        reverseIntervalRef.current = null;
      }

      // Get current position (from wavesurfer or use 0)
      const currentTime = wavesurferRef.current?.getCurrentTime() || 0;
      const totalDuration = reversedBufferRef.current.duration;
      reversePositionRef.current = Math.max(
        0,
        Math.min(totalDuration - currentTime, totalDuration),
      );

      // Create gain node for reverse playback
      if (!reverseGainRef.current) {
        reverseGainRef.current = audioContext.createGain();
        reverseGainRef.current.gain.value = 1.0;
        reverseGainRef.current.connect(outputNode);
      }

      // Create buffer source
      const source = audioContext.createBufferSource();
      source.buffer = reversedBufferRef.current;
      source.playbackRate.value = speed;
      source.connect(reverseGainRef.current);

      // Start playback from reversed position
      const startOffset = totalDuration - reversePositionRef.current;
      reverseStartTimeRef.current = audioContext.currentTime;
      source.start(0, startOffset);

      bufferSourceRef.current = source;

      // Update position as it plays
      const updateInterval = 100; // Update every 100ms
      reverseIntervalRef.current = setInterval(() => {
        if (
          bufferSourceRef.current &&
          reversedBufferRef.current &&
          audioContext
        ) {
          const elapsed =
            audioContext.currentTime - reverseStartTimeRef.current;
          reversePositionRef.current = Math.max(
            0,
            totalDuration - (startOffset + elapsed * speed),
          );

          // Update wavesurfer position for visualization
          if (wavesurferRef.current && totalDuration > 0) {
            const normalPosition = totalDuration - reversePositionRef.current;
            wavesurferRef.current.seekTo(normalPosition / totalDuration);
          }

          // Stop when we reach the beginning
          if (reversePositionRef.current <= 0) {
            if (bufferSourceRef.current) {
              try {
                bufferSourceRef.current.stop();
              } catch {
                // Already stopped
              }
              bufferSourceRef.current = null;
            }
            if (reverseIntervalRef.current) {
              clearInterval(reverseIntervalRef.current);
              reverseIntervalRef.current = null;
            }
            setIsReversedState(false);
            onReverse?.(false);
          }
        }
      }, updateInterval);

      // Handle when source ends
      source.onended = () => {
        if (reverseIntervalRef.current) {
          clearInterval(reverseIntervalRef.current);
          reverseIntervalRef.current = null;
        }
        bufferSourceRef.current = null;
        reversePositionRef.current = 0;
        setIsReversedState(false);
        onReverse?.(false);
      };
    }, [audioContext, outputNode, speed, onReverse]);

    // Handle play/pause
    const handlePlayPause = async () => {
      console.log(`DJDeck (${deckLabel}): handlePlayPause called, isPlaying=${isPlaying}, isReversed=${isReversedState}`);
      
      // FORCE WAKE UP
      if (audioContext && audioContext.state === "suspended") {
        console.log(`DJDeck (${deckLabel}): AudioContext is suspended, resuming...`);
        await audioContext.resume();
        console.log(`DJDeck (${deckLabel}): AudioContext resumed, state=${audioContext.state}`);
      }

      // If reverse is enabled, use buffer playback
      if (isReversedState && reversedBufferRef.current) {
        console.log(`DJDeck (${deckLabel}): Using reverse buffer playback`);
        if (bufferSourceRef.current) {
          // Pause reverse playback
          try {
            bufferSourceRef.current.stop();
          } catch {
            // Already stopped
          }
          bufferSourceRef.current = null;
          if (reverseIntervalRef.current) {
            clearInterval(reverseIntervalRef.current);
            reverseIntervalRef.current = null;
          }
          setIsReversedState(false);
          onReverse?.(false);
        } else {
          // Start reverse playback
          setIsReversedState(true);
          onReverse?.(true);
          await handleReversePlayback();
        }
        onPlayPause();
        return;
      }

      // Normal forward playback
      if (wavesurferRef.current) {
        const ws = wavesurferRef.current;
        console.log(`DJDeck (${deckLabel}): Normal forward playback, WaveSurfer isPlaying=${ws.isPlaying()}`);
        
        // Verify audio connection before playing
        if (!mediaSourceRef.current && audioContext && outputNode) {
          console.warn(`DJDeck (${deckLabel}): MediaElementSource not connected! Attempting emergency connection...`);
          try {
            const mediaElement = ws.getMediaElement();
            if (mediaElement) {
              const mediaSource = audioContext.createMediaElementSource(mediaElement);
              mediaSourceRef.current = mediaSource;
              mediaSource.connect(outputNode);
              console.log(`DJDeck (${deckLabel}): Emergency connection successful`);
            }
          } catch (error) {
            console.error(`DJDeck (${deckLabel}): Emergency connection failed:`, error);
          }
        }
        
        if (quantizeEnabled && bpm) {
          const isPlayingNow = ws.isPlaying();
          const dur = ws.getDuration() || 1;
          if (!isPlayingNow) {
            // Quantize start position before playing
            const t = ws.getCurrentTime();
            const snapped =
              snapToBeat(t - beatGridOffset, bpm, 1.0) + beatGridOffset;
            ws.seekTo(Math.max(0, Math.min(snapped, dur)) / dur);
            console.log(`DJDeck (${deckLabel}): Quantized playback starting at ${snapped}s`);
            ws.play();
          } else {
            console.log(`DJDeck (${deckLabel}): Pausing playback`);
            ws.pause();
          }
        } else {
          console.log(`DJDeck (${deckLabel}): Toggling play/pause (no quantize)`);
          ws.playPause();
        }
      }
      onPlayPause();
    };

    // Sync isPlaying with wavesurfer state and ensure audio connection
    useEffect(() => {
      if (!wavesurferRef.current) return;

      const ensureConnection = async () => {
        // FORCE WAKE UP audio context if suspended
        if (audioContext && audioContext.state === "suspended") {
          console.log(`DJDeck (${deckLabel}): Resuming suspended AudioContext`);
          await audioContext.resume();
        }

        // Ensure media source is connected (backup connection attempt)
        // This should normally be handled by connectMedia in the WaveSurfer init effect
        if (
          audioContext &&
          outputNode &&
          !mediaSourceRef.current &&
          wavesurferRef.current
        ) {
          try {
            const mediaElement = wavesurferRef.current.getMediaElement();
            if (mediaElement) {
              console.log(`DJDeck (${deckLabel}): Backup connection attempt - creating MediaElementSource`);
              const mediaSource =
                audioContext.createMediaElementSource(mediaElement);
              mediaSourceRef.current = mediaSource;
              mediaSource.connect(outputNode);
              console.log(`DJDeck (${deckLabel}): Backup connection successful`);
            }
          } catch (error) {
            console.error(
              `DJDeck (${deckLabel}): Could not connect media element to Web Audio:`,
              error,
            );
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

    // Cleanup reverse playback on unmount
    useEffect(() => {
      return () => {
        // Stop reverse playback if active
        if (bufferSourceRef.current) {
          try {
            bufferSourceRef.current.stop();
          } catch {
            // Already stopped
          }
          bufferSourceRef.current = null;
        }

        // Clear reverse interval
        if (reverseIntervalRef.current) {
          clearInterval(reverseIntervalRef.current);
          reverseIntervalRef.current = null;
        }

        // Disconnect reverse gain node
        if (reverseGainRef.current) {
          try {
            reverseGainRef.current.disconnect();
          } catch {
            // Already disconnected
          }
          reverseGainRef.current = null;
        }
      };
    }, []);

    // Handle cue button with quantize support
    const handleCue = () => {
      if (wavesurferRef.current) {
        if (cuePoint === null) {
          // Set cue point at current position (with quantize if enabled)
          let currentTime = wavesurferRef.current.getCurrentTime();
          if (quantizeEnabled && bpm) {
            const snapped =
              snapToBeat(currentTime - beatGridOffset, bpm, 1.0) +
              beatGridOffset;
            currentTime = snapped;
            wavesurferRef.current.seekTo(
              currentTime / (wavesurferRef.current.getDuration() || 1),
            );
          }
          setCuePoint(currentTime);
        } else {
          // Jump to cue point (with quantize if enabled)
          let seekTime = cuePoint;
          if (quantizeEnabled && bpm) {
            seekTime =
              snapToBeat(cuePoint - beatGridOffset, bpm, 1.0) + beatGridOffset;
          }
          wavesurferRef.current.seekTo(
            seekTime / (wavesurferRef.current.getDuration() || 1),
          );
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

    // Hot cues state (12 cues per deck) - stored for performance pads
    // Use external hot cues if provided, otherwise use internal state
    const [hotCues, setHotCues] = useState<Record<number, number>>({});
    const hotCuesRef = useRef<Record<number, number>>({});

    // Use external or internal hot cues
    const activeHotCues = externalHotCues ?? hotCues;

    // Sync ref with state
    useEffect(() => {
      hotCuesRef.current = activeHotCues;
    }, [activeHotCues]);

    // Handle performance pad cues (8 hot cues)
    const handleCueSet = useCallback(
      (padIndex: number, time: number) => {
        if (onHotCueSet) {
          onHotCueSet(padIndex, time);
        } else {
          setHotCues((prev) => ({
            ...prev,
            [padIndex]: time,
          }));
        }
        // Also update single cue point for backward compatibility
        if (padIndex === 0) {
          setCuePoint(time);
        }
      },
      [onHotCueSet],
    );

    const handleCueJump = useCallback(
      (time: number) => {
        if (wavesurferRef.current && duration) {
          // Debounce rapid jumps to prevent audio glitches
          const seekRatio = time / duration;
          if (seekRatio >= 0 && seekRatio <= 1) {
            wavesurferRef.current.seekTo(seekRatio);
          }
        }
      },
      [duration],
    );

    const handleCueClear = useCallback(
      (padIndex: number) => {
        if (onHotCueClear) {
          onHotCueClear(padIndex);
        } else {
          setHotCues((prev) => {
            const newCues = { ...prev };
            delete newCues[padIndex];
            return newCues;
          });
        }
        // Also clear single cue point if it was pad 0
        if (padIndex === 0) {
          setCuePoint(null);
        }
      },
      [onHotCueClear],
    );

    // Handle stutter effect (jump to cue point repeatedly)
    const handleStutter = useCallback((padIndex: number) => {
      if (wavesurferRef.current) {
        const cueTime = hotCuesRef.current[padIndex];
        if (cueTime !== undefined) {
          const duration = wavesurferRef.current.getDuration();
          if (duration > 0) {
            wavesurferRef.current.seekTo(cueTime / duration);
          }
        }
      }
    }, []);

    // Enhanced loop functionality with in/out markers
    const [loopIn, setLoopIn] = useState<number | null>(null);
    const [loopOut, setLoopOut] = useState<number | null>(null);

    const handleLoop = useCallback(
      (beats: number) => {
        if (!wavesurferRef.current || !duration) return;

        // Use detected BPM if available, otherwise fallback to 120 BPM
        const effectiveBPM = bpm || 120;
        const beatsPerSecond = effectiveBPM / 60;
        const loopDuration = beats / beatsPerSecond;
        let currentTime = wavesurferRef.current.getCurrentTime();

        // Quantize loop start if quantize is enabled
        if (quantizeEnabled && bpm) {
          const snapped =
            snapToBeat(currentTime - beatGridOffset, bpm, 1.0) + beatGridOffset;
          currentTime = snapped;
          wavesurferRef.current.seekTo(currentTime / duration);
        }

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
      },
      [isLooping, loopBeats, loopIn, duration],
    );

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

        {/* Spinning Vinyl with DJ Scratch Interaction */}
        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={trackUrl || "empty"}
              initial={{ scale: 0.8, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 180 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                opacity: { duration: 0.3 },
              }}
            >
              <SpinningVinyl
                isPlaying={isPlaying && !isScrubbing}
                coverArt={coverArt}
                rotation={rotation}
                onScratch={(velocity, isTouching) => {
                  if (isTouching) {
                    if (!isScrubbing) {
                      handleDragStart();
                    }
                    // Apply scratch velocity to playback
                    if (onScratch) {
                      onScratch(velocity, true);
                    }
                  } else {
                    if (isScrubbing) {
                      handleDragEnd();
                    }
                    if (onScratch) {
                      onScratch(0, false);
                    }
                  }
                }}
                size={Math.min(
                  200,
                  typeof window !== "undefined"
                    ? window.innerWidth * 0.35
                    : 200,
                )}
                deckColor={deckColor}
                onClick={onLibraryOpen}
                showEmptyState={!trackUrl}
                playbackRate={speed}
                isFxActive={isFxActive}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Transport Controls */}
        <div
          className="relative z-10 flex gap-2 md:gap-3 items-center flex-wrap justify-center"
          data-tour="sync-pitch"
        >
          {/* Cue Button */}
          <MIDIButton
            midiAction={deckId === "A" ? "deckA_cue" : "deckB_cue"}
            onClick={handleCue}
            className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 touch-manipulation ${
              cuePoint !== null ? "border-orange-500" : "border-gray-700"
            }`}
            title={
              cuePoint !== null
                ? `Cue: ${cuePoint.toFixed(1)}s`
                : "Set Cue Point"
            }
          >
            <div
              style={{
                boxShadow:
                  cuePoint !== null
                    ? `0 0 15px rgba(249, 115, 22, 0.3), inset 0 0 8px rgba(249, 115, 22, 0.1)`
                    : "inset 0 2px 4px rgba(0,0,0,0.5)",
              }}
              className="w-full h-full rounded-lg flex items-center justify-center"
            >
              <RotateCcw
                className="w-6 h-6"
                style={{ color: cuePoint !== null ? "#f97316" : deckColor }}
              />
            </div>
          </MIDIButton>

          {/* Play/Pause Button */}
          <MIDIButton
            midiAction={deckId === "A" ? "deckA_play" : "deckB_play"}
            onClick={handlePlayPause}
            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1a1a1a] border-2 border-gray-700 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation`}
            title={
              isPlaying
                ? `Pause ${title || "track"} on ${deckLabel}`
                : `Play ${title || "track"} on ${deckLabel}`
            }
          >
            <div
              style={
                {
                  boxShadow: isPlaying
                    ? `0 0 20px ${deckColor}40, inset 0 0 10px ${deckColor}20`
                    : "inset 0 2px 4px rgba(0,0,0,0.5)",
                  "--focus-ring-color": deckColor,
                } as React.CSSProperties & { "--focus-ring-color": string }
              }
              className="w-full h-full rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" style={{ color: deckColor }} />
              ) : (
                <Play className="w-8 h-8 ml-1" style={{ color: deckColor }} />
              )}
            </div>
          </MIDIButton>

          {/* Sync Button */}
          <Tooltip content="Automatically matches this deck's BPM to the other deck">
            <button
              onClick={onSync}
              aria-label={
                isSynced
                  ? `${deckLabel} is synced. Click to unsync.`
                  : `Sync ${deckLabel} BPM to other deck`
              }
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
              <Link2
                className="w-6 h-6"
                style={{ color: isSynced ? "#22c55e" : deckColor }}
              />
            </button>
          </Tooltip>

          {/* Slip Mode Button */}
          {onSlipModeToggle && (
            <Tooltip content="Slip Mode: Maintains virtual playhead during scratching">
              <button
                onClick={onSlipModeToggle}
                aria-label={
                  isSlipMode ? "Disable Slip Mode" : "Enable Slip Mode"
                }
                className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FFD700] touch-manipulation ${
                  isSlipMode ? "border-[#FFD700]" : "border-gray-700"
                } ${isSlipMode ? "animate-pulse" : ""}`}
                style={{
                  boxShadow: isSlipMode
                    ? `0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.1)`
                    : "inset 0 2px 4px rgba(0,0,0,0.5)",
                }}
                title={isSlipMode ? "Slip Mode: ON" : "Slip Mode: OFF"}
              >
                <span
                  className={`text-xs font-black italic uppercase tracking-wider ${
                    isSlipMode ? "text-[#FFD700]" : "text-gray-400"
                  }`}
                >
                  SLIP
                </span>
              </button>
            </Tooltip>
          )}

          {/* Reverse Button */}
          <Tooltip content="Play track in reverse">
            <button
              onClick={async () => {
                const newReversed = !isReversedState;
                if (newReversed) {
                  // Start reverse playback
                  setIsReversedState(true);
                  onReverse?.(true);
                  await handleReversePlayback();
                } else {
                  // Stop reverse playback and resume normal
                  if (bufferSourceRef.current) {
                    try {
                      bufferSourceRef.current.stop();
                    } catch {
                      // Already stopped
                    }
                    bufferSourceRef.current = null;
                  }
                  if (reverseIntervalRef.current) {
                    clearInterval(reverseIntervalRef.current);
                    reverseIntervalRef.current = null;
                  }
                  // Resume normal playback from current position
                  if (wavesurferRef.current && duration > 0) {
                    const currentPos = reversePositionRef.current;
                    wavesurferRef.current.seekTo(currentPos / duration);
                    if (isPlaying) {
                      wavesurferRef.current.play();
                    }
                  }
                  setIsReversedState(false);
                  onReverse?.(false);
                }
              }}
              aria-label={isReversedState ? "Play forward" : "Play in reverse"}
              className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 touch-manipulation ${
                isReversedState ? "border-purple-500" : "border-gray-700"
              }`}
              style={{
                boxShadow: isReversedState
                  ? `0 0 15px rgba(168, 85, 247, 0.3), inset 0 0 8px rgba(168, 85, 247, 0.1)`
                  : "inset 0 2px 4px rgba(0,0,0,0.5)",
              }}
              title="Reverse Playback"
            >
              <RotateCw
                className="w-6 h-6"
                style={{ color: isReversedState ? "#a855f7" : deckColor }}
              />
            </button>
          </Tooltip>

          {/* MIDI Learn Mode Toggle */}
          <Tooltip content={learnMode ? "Exit MIDI Learn Mode" : "Enter MIDI Learn Mode"}>
            <button
              onClick={() => {
                const { startLearn, stopLearn } = useMIDIStore.getState();
                if (learnMode) {
                  stopLearn();
                } else {
                  // Don't start learn mode here, let individual controls handle it
                }
              }}
              className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 touch-manipulation ${
                learnMode ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700"
              }`}
              style={{
                boxShadow: learnMode
                  ? `0 0 15px rgba(6, 182, 212, 0.3), inset 0 0 8px rgba(6, 182, 212, 0.1)`
                  : "inset 0 2px 4px rgba(0,0,0,0.5)",
              }}
              title={learnMode ? "MIDI Learn Mode Active - Click controls to map" : "Enable MIDI Learn Mode"}
            >
              <Radio
                className={`w-6 h-6 ${learnMode ? "text-cyan-400 animate-pulse" : "text-gray-400"}`}
              />
            </button>
          </Tooltip>

          {/* Eject/Remove Button - Only visible when track is loaded */}
          {trackUrl && (
            <Tooltip content="Remove track and reset deck">
              <button
                onClick={() => {
                  // Clear track state
                  if (wavesurferRef.current) {
                    wavesurferRef.current.pause();
                    wavesurferRef.current.empty();
                  }
                  setCuePoint(null);
                  setHotCues({});
                  setIsLooping(false);
                  setLoopIn(null);
                  setLoopOut(null);
                  // TODO: Notify parent component to clear track
                  // onTrackRemove?.() - would be better than page reload
                  console.warn(
                    "Track eject - parent component should handle track removal",
                  );
                }}
                aria-label="Remove track from deck"
                className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[#1a1a1a] border-2 border-red-700 flex items-center justify-center transition-all hover:border-red-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 touch-manipulation"
                style={{
                  boxShadow:
                    "0 0 15px rgba(239, 68, 68, 0.2), inset 0 0 8px rgba(239, 68, 68, 0.1)",
                }}
                title="Eject Track"
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                >
                  <path d="M7 8l5-5 5 5M12 3v12M5 21h14" />
                </svg>
              </button>
            </Tooltip>
          )}
        </div>

        {/* BPM, Key & Time Remaining Display */}
        {trackUrl && (
          <div className="flex items-center justify-between w-full px-4 mt-2">
            {/* BPM & Key Display */}
            <div className="flex flex-col items-start gap-1">
              {bpm && (
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-barlow font-bold text-gray-300">
                    {bpm} BPM
                  </span>
                  {confidence < 0.5 && (
                    <span
                      className="text-xs text-gray-500"
                      title="Low confidence BPM detection"
                    >
                      ~
                    </span>
                  )}
                </div>
              )}
              {/* Musical Key Display - Placeholder */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-barlow text-gray-500">KEY:</span>
                <span className="text-xs font-barlow font-bold text-gray-300">
                  C♯m {/* Placeholder - would need key detection */}
                </span>
              </div>
            </div>

            {/* Time Remaining Countdown */}
            <button
              onClick={() => setShowElapsedTime(!showElapsedTime)}
              className="flex flex-col items-end gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              title={`Click to toggle between ${showElapsedTime ? "remaining" : "elapsed"} time`}
              aria-label={`Toggle time display. Currently showing ${showElapsedTime ? "elapsed" : "remaining"} time`}
            >
              <span className="text-xs font-barlow text-gray-500">
                {showElapsedTime ? "ELAPSED" : "REMAINING"}
              </span>
              <span
                className={`text-lg font-barlow font-bold tabular-nums ${
                  duration - currentPosition < 30 && !showElapsedTime
                    ? "text-red-500 animate-pulse"
                    : "text-gray-300"
                }`}
              >
                {showElapsedTime
                  ? formatTimeElapsed(currentPosition)
                  : formatTimeRemaining(duration - currentPosition)}
              </span>
            </button>
          </div>
        )}

        {/* Beat Grid Toggle */}
        {bpm && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowBeatGrid(!showBeatGrid)}
              className={`p-1.5 rounded border transition-all ${
                showBeatGrid
                  ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
              title="Toggle Beat Grid"
              aria-label="Toggle beat grid visualization"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            {/* Beat grid alignment nudges */}
            <div className="flex items-center gap-1" title="Align beat grid">
              <button
                onClick={() => setBeatGridOffset((o) => o - 0.02)}
                className="px-2 py-1 text-[10px] font-barlow uppercase rounded border border-gray-700 text-gray-400 hover:border-gray-600"
                aria-label="Nudge grid left"
              >
                «
              </button>
              <button
                onClick={() => setBeatGridOffset((o) => o + 0.02)}
                className="px-2 py-1 text-[10px] font-barlow uppercase rounded border border-gray-700 text-gray-400 hover:border-gray-600"
                aria-label="Nudge grid right"
              >
                »
              </button>
            </div>
            <button
              onClick={() => {
                setQuantizeEnabled(!quantizeEnabled);
              }}
              className={`px-2 py-1 text-xs font-barlow uppercase rounded border transition-all ${
                quantizeEnabled
                  ? "border-[#00ff00] bg-[#00ff00]/10 text-[#00ff00]"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
              title="Quantize (Snap to Beat)"
              aria-label="Toggle quantize"
            >
              Q
            </button>
          </div>
        )}

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
              height={
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 120
                  : 150
              }
              helpText="Adjusts playback speed (pitch). Range: -8% to +8%"
              midiAction={deckId === "A" ? "deckA_volume" : "deckB_volume"}
            />
            <div className="flex flex-col items-center gap-1 text-xs text-gray-500 font-barlow">
              <span>+8%</span>
              <span className="text-gray-400">0%</span>
              <span>-8%</span>
            </div>
            <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider mt-1">
              {speed >= 1 ? "+" : ""}
              {((speed - 1) * 100).toFixed(1)}%
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
                    ? "bg-[#1a1a1a] border-[#FFD700] text-[#FFD700]"
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
                    ? "bg-[#1a1a1a] border-[#FFD700] text-[#FFD700]"
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
                  aria-label={
                    isLooping && loopBeats === beats
                      ? `${beats} beat loop active. Click to disable.`
                      : `Enable ${beats} beat loop`
                  }
                  className={`relative w-14 h-12 md:w-12 md:h-10 rounded-lg border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FFD700] touch-manipulation min-h-[44px] ${
                    isLooping && loopBeats === beats
                      ? "bg-[#1a1a1a] border-[#FFD700]"
                      : "bg-[#0a0a0a] border-gray-700"
                  }`}
                  style={{
                    boxShadow:
                      isLooping && loopBeats === beats
                        ? `0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.1)`
                        : "inset 0 2px 4px rgba(0,0,0,0.5)",
                  }}
                  title={`${beats} Beat Loop`}
                >
                  <Repeat
                    className="w-4 h-4"
                    style={{
                      color:
                        isLooping && loopBeats === beats
                          ? "#FFD700"
                          : deckColor,
                    }}
                  />
                  <span
                    className={`absolute bottom-0.5 text-[8px] font-barlow font-bold ${
                      isLooping && loopBeats === beats
                        ? "text-[#FFD700]"
                        : "text-gray-500"
                    }`}
                  >
                    {beats}
                  </span>
                </button>
              ))}
            </div>
            {/* Loop Status Display */}
            {isLooping && loopIn !== null && loopOut !== null && (
              <div className="text-[10px] font-barlow text-[#FFD700] text-center mt-1">
                {loopIn.toFixed(1)}s - {loopOut.toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Track Title */}
        {title && (
          <div className="w-full text-center">
            <h4 className="text-xl md:text-2xl font-bold text-[#FFD700] uppercase tracking-wider truncate px-4">
              {title}
            </h4>
          </div>
        )}

        {/* Waveform with Beat Grid and Dark Grid Background */}
        <div
          ref={waveformRef}
          className="relative w-full rounded border border-gray-800 p-2 cursor-pointer"
          style={{
            minHeight:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 80
                : 100,
            background: `
              linear-gradient(to right, rgba(42, 42, 42, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(42, 42, 42, 0.1) 1px, transparent 1px),
              #0a0a0a
            `,
            backgroundSize: "20px 20px",
          }}
          title="Click or drag to scrub through the track"
        >
          {/* Waveform Component */}
          {trackUrl && (
            <Suspense fallback={<div className="h-20 bg-gray-800 animate-pulse rounded" />}>
              <Waveform
                audioUrl={trackUrl}
                progress={(currentPosition / duration) * 100}
                isPlaying={isPlaying}
                onSeek={(time) => {
                  if (wavesurferRef.current) {
                    wavesurferRef.current.setTime(time);
                    setCurrentPosition(time);
                  }
                }}
                height={
                  typeof window !== "undefined" && window.innerWidth < 768
                    ? 60
                    : 80
                }
                hotCues={externalHotCues}
                loopStart={loopIn}
                loopEnd={loopOut}
                onHotCueUpdate={onHotCueSet ? (padIndex, newTime) => {
                  onHotCueSet(padIndex, newTime);
                } : undefined}
              />
            </Suspense>
          )}

          {/* Beat Grid Overlay */}
          {showBeatGrid && beatPositions.length > 0 && duration > 0 && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{ padding: "8px" }}
            >
              {beatPositions.map((beatTime, index) => {
                const position = ((beatTime + beatGridOffset) / duration) * 100;
                return (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 w-px bg-[#FFD700]/30"
                    style={{ left: `${position}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Performance Pads */}
        <div data-tour="performance-pads">
          <PerformancePads
            onCueSet={handleCueSet}
            onCueJump={handleCueJump}
            onCueClear={handleCueClear}
            onStutter={handleStutter}
            isPlaying={isPlaying}
            getCurrentTime={() => wavesurferRef.current?.getCurrentTime() || 0}
            helpText="Set Hot Cues (8 pads). Click to set/jump/stutter, Long press or Shift+Click to clear"
            numPads={8}
            cuePoints={activeHotCues}
            onHapticTrigger={onHapticTrigger}
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
  },
);

DJDeck.displayName = "DJDeck";
