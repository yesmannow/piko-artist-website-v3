"use client";

import { useState, useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { useAudioGraph } from "@/hooks/useAudioGraph";
import { StudioCanvas } from "@/components/3d/StudioCanvas";
import { TerminalLog, useTerminalLogs } from "@/components/ui/TerminalLog";

/**
 * Studio Page - Main controller for the DJ Studio
 *
 * This page wires together:
 * - Audio Engine (useAudioGraph) - The "Brain"
 * - Visual Layer (StudioCanvas) - The "Body"
 *
 * Features:
 * - "Enter Studio" overlay for autoplay policy compliance
 * - Real-time audio visualization (frequency data -> visualizer levels)
 * - Test player for loading and playing MP3 files
 * - Audio-reactive holographic decks
 */
export default function StudioPage() {
  const { audioContext, isReady, initializeAudio, setIsPlaying, isPlaying } = useAudioStore();
  const { getFrequencyData, masterGainNode, stopWithTapeEffect, isReady: graphReady } = useAudioGraph();
  const { logs, addLog, clearLogs } = useTerminalLogs();

  // Combined ready state (both context and graph must be ready)
  const isFullyReady = isReady && graphReady;

  // Visualizer state
  const [visualizerLevel, setVisualizerLevel] = useState(0);
  const [deckAAudioLevel, setDeckAAudioLevel] = useState(0);
  const [deckBAudioLevel, setDeckBAudioLevel] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Audio source ref (for cleanup and tape stop)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Visualizer Loop - Updates frequency data every frame
   *
   * Calculates RMS (Root Mean Square) of low frequencies (bass)
   * to drive the holographic deck pulse effect.
   *
   * Uses requestAnimationFrame for smooth 60fps updates.
   */
  useEffect(() => {
    if (!isFullyReady || !getFrequencyData) {
      return;
    }

    const updateVisualizer = () => {
      const frequencyData = getFrequencyData();
      if (!frequencyData) {
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        return;
      }

      // Calculate RMS of low frequencies (bass range)
      // Frequency bins 0-32 typically represent 0-500Hz (bass frequencies)
      const bassRange = Math.min(32, frequencyData.length);
      let sum = 0;
      let count = 0;

      for (let i = 0; i < bassRange; i++) {
        const value = frequencyData[i];
        sum += value * value; // Square for RMS
        count++;
      }

      // Calculate RMS and normalize to 0-1 range
      const rms = count > 0 ? Math.sqrt(sum / count) : 0;
      const normalizedLevel = Math.min(1.0, rms / 255.0);

      // Smooth the level with exponential moving average
      setVisualizerLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);
      setDeckAAudioLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);
      setDeckBAudioLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);

      // Update playback rate for visual sync (if source exists)
      if (audioSourceRef.current?.playbackRate) {
        setPlaybackRate(audioSourceRef.current.playbackRate.value);
      }

      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    updateVisualizer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isFullyReady, getFrequencyData]);

  /**
   * Handle File Upload - Load and play MP3 file
   *
   * Reads the file as ArrayBuffer, decodes it via AudioContext,
   * creates a source node, and connects it to the master gain.
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !audioContext || !masterGainNode) {
      return;
    }

    try {
      // Stop any currently playing source
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Decode audio data
      addLog("SYSTEM_CORE: ANALYZING_WAVEFORM...");
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      addLog("SYSTEM_CORE: WAVEFORM_ANALYZED");

      // Create source node
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = false; // Don't loop for now

      // Connect to master gain (which goes through limiter -> analyser -> destination)
      source.connect(masterGainNode);

      // Handle playback end
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };

      // Start playback
      source.start(0);
      audioSourceRef.current = source;
      setIsPlaying(true);
      setPlaybackRate(1.0);
      addLog("SYSTEM_CORE: REAL_TIME_DSP_ACTIVE");
    } catch (error) {
      console.error("[StudioPage] Failed to load audio file:", error);
    }

    // Reset file input to allow re-uploading the same file
    event.target.value = "";
  };

  /**
   * Handle Initialize - Resumes AudioContext on user interaction
   *
   * This satisfies browser autoplay policies by requiring
   * explicit user interaction before audio can play.
   */
  const handleInitialize = async () => {
    addLog("SYSTEM_CORE: CORE_BOOT...");
    await initializeAudio();
    if (isReady) {
      addLog("SYSTEM_CORE: AUDIO_CONTEXT_READY");
      addLog("SYSTEM_CORE: SYSTEM_ONLINE");
    }
  };

  /**
   * Handle Stop - Physics-based tape stop
   *
   * Uses exponential deceleration to simulate turntable stop.
   */
  const handleStop = () => {
    if (audioSourceRef.current && stopWithTapeEffect) {
      stopWithTapeEffect(audioSourceRef.current);
      setIsPlaying(false);
      addLog("SYSTEM_CORE: TAPE_STOP_ACTIVE");
    }
  };

  // Show "Enter Studio" overlay if audio isn't ready
  if (!isReady) {
    return (
      <div className="relative h-screen w-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-card to-background" />

        <div className="relative z-10 text-center space-y-8 px-4">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-header text-foreground tracking-tighter">
              STUDIO
            </h1>
            <p className="text-foreground/60 font-industrial text-lg md:text-xl">
              Initialize audio system to begin
            </p>
          </div>

          <button
            onClick={handleInitialize}
            className="px-12 py-6 bg-toxic-lime text-black font-header font-bold text-xl md:text-2xl transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black min-h-[60px]"
            style={{
              boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
            }}
          >
            INITIALIZE SYSTEM
          </button>

          <p className="text-foreground/40 font-mono text-xs max-w-md mx-auto">
            Browser autoplay policy requires user interaction to start audio playback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* 3D Canvas Background */}
      <StudioCanvas
        deckAIsPlaying={isPlaying}
        deckAAudioLevel={deckAAudioLevel}
        deckBIsPlaying={isPlaying}
        deckBAudioLevel={deckBAudioLevel}
        deckAColor="#ccff00" // toxic-lime
        deckBColor="#ff0099" // spray-magenta
        getFrequencyData={getFrequencyData}
        playbackRate={playbackRate}
      />

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top-left: Load Track Button */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <label
            htmlFor="audio-file-input"
            className="px-6 py-3 bg-white/90 backdrop-blur-sm text-black font-header font-bold text-sm transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black cursor-pointer inline-block min-h-[44px] flex items-center justify-center"
            style={{
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            }}
          >
            LOAD TRACK
          </label>
          <input
            id="audio-file-input"
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Top-right: Status Indicator & Stop Button */}
        <div className="absolute top-4 right-4 pointer-events-auto flex flex-col gap-2">
          <div className="px-4 py-2 bg-black/80 backdrop-blur-sm text-toxic-lime font-mono text-xs border border-toxic-lime">
            {isPlaying ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-toxic-lime rounded-full animate-pulse" />
                PLAYING
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-foreground/40 rounded-full" />
                READY
              </span>
            )}
          </div>

          {/* Stop Button */}
          {isPlaying && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600/80 backdrop-blur-sm text-white font-mono text-xs border border-red-600 hover:bg-red-600 transition-colors min-h-[44px]"
            >
              STOP
            </button>
          )}
        </div>

        {/* Bottom: Terminal Log */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto max-w-md">
          <TerminalLog logs={logs} maxLines={8} />
        </div>

        {/* Bottom: Visualizer Level Indicator (Debug) */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute bottom-4 left-4 pointer-events-auto">
            <div className="px-4 py-2 bg-black/80 backdrop-blur-sm text-white font-mono text-xs">
              Level: {(visualizerLevel * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

