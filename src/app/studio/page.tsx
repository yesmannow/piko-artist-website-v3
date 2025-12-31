"use client";

import { useState, useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { useAudioGraph } from "@/hooks/useAudioGraph";
import { useDualDeck } from "@/hooks/useDualDeck";
import { StudioCanvas } from "@/components/3d/StudioCanvas";
import { StudioMonitor, useStudioMonitor } from "@/components/ui/StudioMonitor";
import { SessionSummary } from "@/components/studio/SessionSummary";
import { audioBufferToWAV } from "@/utils/audioRenderer";

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
  const { logs, addLog, clearLogs } = useStudioMonitor();
  const {
    deckA,
    deckB,
    loadDeckA,
    loadDeckB,
    playDeckA,
    playDeckB,
    stopDeckA,
    stopDeckB,
    setDeckAGain,
    setDeckBGain,
    clearDeckA,
    clearDeckB,
  } = useDualDeck();

  // Combined ready state (both context and graph must be ready)
  const isFullyReady = isReady && graphReady;

  // Visualizer state
  const [visualizerLevel, setVisualizerLevel] = useState(0);
  const [deckAAudioLevel, setDeckAAudioLevel] = useState(0);
  const [deckBAudioLevel, setDeckBAudioLevel] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [remixIntensity, setRemixIntensity] = useState(0);
  const [stemManipulations, setStemManipulations] = useState(0);
  const [showSessionSummary, setShowSessionSummary] = useState(false);

  // Animation frame ref
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

      // Separate levels for each deck (can be enhanced with actual deck-specific analysis)
      setDeckAAudioLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);
      setDeckBAudioLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);

      // Update playback rate for visual sync (use deck A or B)
      if (deckA.sourceNode?.playbackRate) {
        setPlaybackRate(deckA.sourceNode.playbackRate.value);
      } else if (deckB.sourceNode?.playbackRate) {
        setPlaybackRate(deckB.sourceNode.playbackRate.value);
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
   * Extract track name from filename
   * Converts "el-don.mp3" -> "EL DON", "amor-sincero.mp3" -> "AMOR SINCERO"
   */
  const getTrackName = (filename: string): string => {
    return filename
      .replace(/\.[^/.]+$/, "") // Remove extension
      .split(/[-_]/) // Split on hyphens/underscores
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(" ");
  };

  /**
   * Handle Deck A Load - Load site-hosted track
   */
  const handleLoadDeckA = async (trackPath: string, trackName: string) => {
    clearDeckA(); // Memory cleanup
    await loadDeckA(trackPath, trackName);
      addLog(`STUDIO_CORE: DECK_A_LOADED: ${trackName}`);
  };

  /**
   * Handle Deck B Upload - Load user-uploaded file (IMPORT SESSION_B)
   */
  const handleDeckBUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !audioContext) {
      return;
    }

    try {
      clearDeckB(); // Memory cleanup

      // Extract track name
      const trackName = getTrackName(file.name);

      // Clear logs and start sequence
      clearLogs();
      addLog(`PREPARING_MASTER_STEMS: ${trackName}...`);

      // Load to Deck B
      const audioBuffer = await loadDeckB(file);

      if (audioBuffer) {
        // [1.2s]: PREPARING_MASTER_STEMS
        setTimeout(() => {
          addLog("STUDIO_CORE: PREPARING_MASTER_STEMS: VOCALS | INSTRUMENTAL | BASS");
        }, 1200);

        // [2.5s]: COMPRESSION_CHAIN_LIVE
        setTimeout(() => {
          addLog("STUDIO_CORE: COMPRESSION_CHAIN_LIVE");
        }, 2500);

        // [3.5s]: SESSION_READY
        setTimeout(() => {
          addLog("STUDIO_CORE: SESSION_READY");
        }, 3500);
      }
    } catch (error) {
      console.error("[StudioPage] Failed to load Deck B:", error);
      addLog("STUDIO_CORE: ERROR: LOAD_FAILED");
    }

    event.target.value = "";
  };

  /**
   * Handle File Upload - Legacy single-track loading (for backward compatibility)
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Route to Deck B for user uploads
    await handleDeckBUpload(event);
  };

  // Impact pulse state for visual effect
  const [impactPulse, setImpactPulse] = useState(false);

  /**
   * Handle Initialize - Resumes AudioContext on user interaction
   *
   * This satisfies browser autoplay policies by requiring
   * explicit user interaction before audio can play.
   *
   * Triggers the Studio Session Launch sequence.
   */
  const handleInitialize = async () => {
    clearLogs();

    // Initialize audio context
    await initializeAudio();

    if (isReady) {
      // Studio Session Launch Sequence
      // [0.0s]: SESSION_INITIALIZED
      addLog("STUDIO_ENGINE: SESSION_INITIALIZED");

      // [1.2s]: WELCOME TO THE PIKO V3 SUITE
      setTimeout(() => {
        addLog("STUDIO_ENGINE: WELCOME TO THE PIKO V3 SUITE");
      }, 1200);

      // [2.5s]: COMMAND THE MIX. OWN THE MASTER.
      setTimeout(() => {
        addLog("STUDIO_ENGINE: COMMAND THE MIX. OWN THE MASTER.");
      }, 2500);

      // [4.0s]: NEURAL STEMS ONLINE
      setTimeout(() => {
        addLog("STUDIO_ENGINE: NEURAL STEMS ONLINE");
      }, 4000);

      // [5.0s]: SELECT A TRACK TO BEGIN (triggers impact pulse)
      setTimeout(() => {
        addLog("STUDIO_ENGINE: SELECT A TRACK TO BEGIN");
        // Trigger visual impact pulse
        setImpactPulse(true);
        setTimeout(() => {
          setImpactPulse(false);
        }, 300);
      }, 5000);
    }
  };

  /**
   * Handle Stop - Physics-based tape stop
   *
   * Uses exponential deceleration to simulate turntable stop.
   * Also triggers session summary if session was significant.
   */
  const handleStop = () => {
    if (deckA.sourceNode && stopWithTapeEffect) {
      stopWithTapeEffect(deckA.sourceNode);
      stopDeckA();
    }
    if (deckB.sourceNode && stopWithTapeEffect) {
      stopWithTapeEffect(deckB.sourceNode);
      stopDeckB();
    }

    setIsPlaying(false);
      addLog("STUDIO_CORE: DECELERATING");

    // Show session summary if session was significant (2+ minutes or remix activity)
    if (sessionDuration >= 120 || remixIntensity > 0.3) {
      setShowSessionSummary(true);
    }
  };

  // Update isPlaying state based on deck states
  useEffect(() => {
    const anyPlaying = deckA.isPlaying || deckB.isPlaying;
    setIsPlaying(anyPlaying);
  }, [deckA.isPlaying, deckB.isPlaying]);

  // Session duration tracking
  useEffect(() => {
    const anyPlaying = deckA.isPlaying || deckB.isPlaying;

    if (anyPlaying && !sessionStartTime) {
      setSessionStartTime(Date.now());
    } else if (!anyPlaying && sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionDuration((prev) => prev + duration);
      setSessionStartTime(null);
    }
  }, [deckA.isPlaying, deckB.isPlaying, sessionStartTime]);

  // Update session duration while playing
  useEffect(() => {
    const anyPlaying = deckA.isPlaying || deckB.isPlaying;
    if (!anyPlaying || !sessionStartTime) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionDuration(duration);

      // Auto-show summary after 2 minutes
      if (duration >= 120) {
        setShowSessionSummary(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deckA.isPlaying, deckB.isPlaying, sessionStartTime]);

  // Calculate remix intensity based on session activity
  // Enhanced calculation: based on duration, deck usage, and future stem manipulations
  useEffect(() => {
    const baseIntensity = Math.min(1.0, sessionDuration / 300); // 5 minutes = 100%
    const deckActivity = (deckA.audioBuffer ? 0.3 : 0) + (deckB.audioBuffer ? 0.3 : 0);
    const manipulationBonus = Math.min(0.4, stemManipulations / 20.0);
    const intensity = Math.min(1.0, baseIntensity + deckActivity + manipulationBonus);
    setRemixIntensity(intensity);
  }, [sessionDuration, deckA.audioBuffer, deckB.audioBuffer, stemManipulations]);

  /**
   * Handle Download - Render mix to WAV
   */
  const handleDownload = async () => {
    if (!audioContext || !deckA.audioBuffer && !deckB.audioBuffer) {
      return;
    }

    try {
      // For now, download the primary deck's buffer
      // Full implementation would mix both decks
      const bufferToRender = deckA.audioBuffer || deckB.audioBuffer;
      if (!bufferToRender) return;

      const wavBlob = audioBufferToWAV(bufferToRender);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `piko-studio-mix-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog("MIX_RENDERED: DOWNLOAD_COMPLETE");
    } catch (error) {
      console.error("[StudioPage] Download failed:", error);
      addLog("ERROR: RENDER_FAILED");
    }
  };

  /**
   * Handle Share - Web Share API
   */
  const handleShare = async () => {
    const trackName = deckA.trackName || deckB.trackName || "Track";
    const message = `Just remixed ${trackName} at the Piko Artist Studio. Own the master. 🔥 #PikoStudio #CommandTheMix`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Piko Studio Remix",
          text: message,
          url: window.location.href,
        });
        addLog("SHARE_COMPLETE");
      } catch (error) {
        // User cancelled or share failed
        console.log("[StudioPage] Share cancelled or failed:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(message);
        addLog("SHARE_LINK_COPIED");
      } catch (error) {
        console.error("[StudioPage] Clipboard copy failed:", error);
      }
    }
  };

  // Show "Enter Studio" overlay if audio isn't ready
  if (!isReady) {
    return (
      <div
        className="relative h-screen w-screen flex items-center justify-center"
        style={{
          // Concrete Bunker Background
          background: `
            #050505,
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.3) 2px,
              rgba(0, 0, 0, 0.3) 4px
            ),
            radial-gradient(circle at 50% 0%, rgba(224, 224, 224, 0.05) 0%, transparent 50%)
          `,
          backgroundSize: "100% 100%, 100% 8px, 100% 100%",
        }}
      >

        <div className="relative z-10 text-center space-y-8 px-4">
          <div className="space-y-4">
            <h1
              className="text-5xl md:text-7xl font-black italic uppercase text-[#FFD700] tracking-tighter"
              style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
            >
              V3 STUDIO
            </h1>
            <p className="text-[#E0E0E0]/60 font-mono text-lg md:text-xl uppercase tracking-wider">
              COMMAND THE MIX. OWN THE MASTER.
            </p>
          </div>

          <button
            onClick={handleInitialize}
            className="px-12 py-6 bg-[#FFD700] text-black font-black italic uppercase text-xl md:text-2xl skew-x-[-12deg] hover:skew-x-[-10deg] transition-transform border-2 border-black min-h-[60px] tracking-wider"
            style={{
              fontFamily: "var(--font-lexend), system-ui, sans-serif",
              boxShadow: "8px 8px 0px rgba(0,0,0,1)",
            }}
          >
            <span className="skew-x-[12deg] block">ENTER THE BOOTH</span>
          </button>

          <p className="text-[#E0E0E0]/40 font-mono text-[10px] max-w-md mx-auto uppercase tracking-wider">
            BROWSER AUTOPLAY POLICY REQUIRES USER INTERACTION TO START AUDIO PLAYBACK.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{
        // Concrete Bunker Background - Soundproofed concrete vault
        background: `
          #050505,
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.3) 2px,
            rgba(0, 0, 0, 0.3) 4px
          ),
          radial-gradient(circle at 50% 0%, rgba(224, 224, 224, 0.05) 0%, transparent 50%)
        `,
        backgroundSize: "100% 100%, 100% 8px, 100% 100%",
      }}
    >
      {/* 3D Canvas Background */}
      <StudioCanvas
        deckAIsPlaying={deckA.isPlaying}
        deckAAudioLevel={deckAAudioLevel}
        deckBIsPlaying={deckB.isPlaying}
        deckBAudioLevel={deckBAudioLevel}
        deckAColor="#E0E0E0" // Industrial Chrome
        deckBColor="#E0E0E0" // Industrial Chrome
        getFrequencyData={getFrequencyData}
        playbackRate={playbackRate}
        impactPulse={impactPulse}
      />

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top-left: Deck Controls */}
        <div className="absolute top-4 left-4 pointer-events-auto flex flex-col gap-2">
          {/* Deck A: Site Track Selector */}
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const trackPath = `/audio/tracks/${e.target.value}`;
                  const trackName = getTrackName(e.target.value);
                  handleLoadDeckA(trackPath, trackName);
                }
              }}
              className="px-4 py-2 bg-[#111111] text-[#FFD700] font-mono font-bold text-xs border-2 border-[#E0E0E0]/30 min-h-[44px] uppercase tracking-wider"
              style={{
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.5), 4px 4px 0px rgba(0,0,0,1)",
              }}
              defaultValue=""
            >
              <option value="">SELECT DECK A</option>
              <option value="el-don.mp3">EL DON</option>
              <option value="amor-sincero.mp3">AMOR SINCERO</option>
              <option value="jardin-de-rosas.mp3">JARDIN DE ROSAS</option>
              <option value="amores-perdidos.mp3">AMORES PERDIDOS</option>
              <option value="bungalow.mp3">BUNGALOW</option>
              <option value="corazon-y-mente.mp3">CORAZON Y MENTE</option>
              <option value="crussin.mp3">CRUSSIN</option>
              <option value="dejate-llevar.mp3">DEJATE LLEVAR</option>
              <option value="entre-humos.mp3">ENTRE HUMOS</option>
              <option value="ganja.mp3">GANJA</option>
            </select>
            {deckA.audioBuffer && (
              <button
                onClick={deckA.isPlaying ? stopDeckA : playDeckA}
                className="px-4 py-2 bg-[#FFD700] text-black font-mono font-bold text-xs uppercase min-h-[44px] border-2 border-black tracking-wider"
                style={{
                  boxShadow: "4px 4px 0px rgba(0,0,0,1)",
                }}
              >
                {deckA.isPlaying ? "STOP A" : "PLAY A"}
              </button>
            )}
          </div>

          {/* Deck B: User Upload (IMPORT SESSION_B) */}
          <div className="flex gap-2">
            <label
              htmlFor="deck-b-upload"
              className="px-6 py-3 bg-[#FFD700] text-black font-mono font-black text-sm uppercase tracking-wider skew-x-[-12deg] hover:skew-x-[-10deg] transition-transform cursor-pointer inline-block min-h-[44px] flex items-center justify-center border-2 border-black"
              style={{
                fontFamily: "var(--font-lexend), system-ui, sans-serif",
                fontStyle: "italic",
                boxShadow: "6px 6px 0px rgba(0,0,0,1)",
              }}
            >
              <span className="skew-x-[12deg]">IMPORT SESSION_B</span>
            </label>
            <input
              id="deck-b-upload"
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
              onChange={handleDeckBUpload}
              className="hidden"
            />
            {deckB.audioBuffer && (
              <button
                onClick={deckB.isPlaying ? stopDeckB : playDeckB}
                className="px-4 py-2 bg-[#FFD700] text-black font-mono font-bold text-xs uppercase min-h-[44px] border-2 border-black tracking-wider"
                style={{
                  boxShadow: "4px 4px 0px rgba(0,0,0,1)",
                }}
              >
                {deckB.isPlaying ? "STOP B" : "PLAY B"}
              </button>
            )}
          </div>
        </div>

        {/* Top-right: Status Indicator & Stop Button */}
        <div className="absolute top-4 right-4 pointer-events-auto flex flex-col gap-2">
          <div
            className="px-4 py-2 bg-[#111111] text-[#FFD700] font-mono text-[10px] border-2 border-[#E0E0E0]/30 uppercase tracking-wider"
            style={{
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.5), 4px 4px 0px rgba(0,0,0,1)",
            }}
          >
            {isPlaying ? (
              <span className="flex items-center gap-2 font-bold">
                <span className="w-2 h-2 bg-[#FFD700] animate-pulse" style={{ boxShadow: "0 0 6px rgba(255, 215, 0, 0.8)" }} />
                PLAYING
              </span>
            ) : (
              <span className="flex items-center gap-2 font-bold">
                <span className="w-2 h-2 bg-[#E0E0E0]/40" />
                READY
              </span>
            )}
          </div>

          {/* Stop Button */}
          {isPlaying && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-700 text-white font-mono font-bold text-xs uppercase border-2 border-black tracking-wider min-h-[44px] hover:bg-red-600 transition-colors"
              style={{
                boxShadow: "4px 4px 0px rgba(0,0,0,1)",
              }}
            >
              STOP
            </button>
          )}
        </div>

        {/* Session Summary Popup */}
        <SessionSummary
          isOpen={showSessionSummary}
          onClose={() => setShowSessionSummary(false)}
          deckATrack={deckA.trackName}
          deckBTrack={deckB.trackName}
          sessionDuration={sessionDuration}
          remixIntensity={remixIntensity}
          onDownload={handleDownload}
          onShare={handleShare}
        />

        {/* Bottom: Studio Monitor */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto max-w-md">
          <StudioMonitor logs={logs} maxLines={8} />
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

