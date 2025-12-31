"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { useAudioGraph } from "@/hooks/useAudioGraph";
import { useDualDeck } from "@/hooks/useDualDeck";
import { useSignalCracker } from "@/hooks/useSignalCracker";
import { StudioCanvas } from "@/components/3d/StudioCanvas";
import { StudioMonitor, useStudioMonitor } from "@/components/ui/StudioMonitor";
import { SignalHatch } from "@/components/studio/SignalHatch";
import { CrossFader } from "@/components/studio/CrossFader";
import { ThermalMeter } from "@/components/studio/ThermalMeter";
import { SessionSummary } from "@/components/studio/SessionSummary";
import { audioBufferToWAV } from "@/utils/audioRenderer";
import { tracks, MediaItem } from "@/lib/data";
import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Studio Page - V3 Urban Syndicate Widescreen Console
 *
 * Professional dual-console mixing interface with:
 * - Constant-Power Signal Splitter (cosine/sine curve)
 * - WASM Signal Cracker for stem separation
 * - Modular Console Layout (widescreen)
 * - Integrated SignalHatch, CrossFader, ThermalMeter
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
    crossfaderPosition,
    setCrossfader,
  } = useDualDeck();
  const { processAudio, isProcessing, progress } = useSignalCracker();

  // Combined ready state
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

  // Track selection state
  const [selectedTrackA, setSelectedTrackA] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Animation frame ref
  const animationFrameRef = useRef<number | null>(null);

  // Filter audio tracks
  const audioTracks = useMemo(() => {
    return tracks.filter((track) => track.type === "audio");
  }, []);

  // Filter tracks by search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery) return audioTracks;
    const query = searchQuery.toLowerCase();
    return audioTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.vibe.toLowerCase().includes(query)
    );
  }, [audioTracks, searchQuery]);

  /**
   * Visualizer Loop - Updates frequency data every frame
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
      const bassRange = Math.min(32, frequencyData.length);
      let sum = 0;
      let count = 0;

      for (let i = 0; i < bassRange; i++) {
        const value = frequencyData[i];
        sum += value * value;
        count++;
      }

      const rms = count > 0 ? Math.sqrt(sum / count) : 0;
      const normalizedLevel = Math.min(1.0, rms / 255.0);

      setVisualizerLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);
      setDeckAAudioLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);
      setDeckBAudioLevel((prev) => prev * 0.7 + normalizedLevel * 0.3);

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
  }, [isFullyReady, getFrequencyData, deckA.sourceNode, deckB.sourceNode]);

  /**
   * Handle Deck A Load - Load site-hosted track
   */
  const handleLoadDeckA = async (track: MediaItem) => {
    clearDeckA();
    setSelectedTrackA(track);
    await loadDeckA(track.src, track.title);
    addLog(`STUDIO_CORE: CONSOLE_A_LOADED: ${track.title}`);
  };

  /**
   * Handle Signal Import - Process via WASM Signal Cracker
   */
  const handleSignalImport = async (file: File) => {
    if (!audioContext) return;

    try {
      clearDeckB();
      clearLogs();

      // Decode audio file
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Load to Deck B first
      await loadDeckB(file);

      // Process via Signal Cracker (WASM)
      if (audioBuffer) {
        const stems = await processAudio(audioBuffer);
        if (stems) {
          addLog(`STUDIO_CORE: SIGNAL_CRACKED: STEMS_ISOLATED`);
          setStemManipulations((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("[StudioPage] Signal import failed:", error);
      addLog(`STUDIO_CORE: ERROR: CRACKING_SIGNAL_CHAIN_FAILED`);
    }
  };

  /**
   * Handle Initialize - Resumes AudioContext on user interaction
   */
  const handleInitialize = async () => {
    clearLogs();
    await initializeAudio();

    if (isReady) {
      addLog("STUDIO_ENGINE: SESSION_INITIALIZED");
      setTimeout(() => {
        addLog("STUDIO_ENGINE: WELCOME TO THE PIKO V3 SUITE");
      }, 1200);
      setTimeout(() => {
        addLog("STUDIO_ENGINE: COMMAND THE MIX. OWN THE MASTER.");
      }, 2500);
      setTimeout(() => {
        addLog("STUDIO_ENGINE: NEURAL STEMS ONLINE");
      }, 4000);
    }
  };

  /**
   * Handle Stop - Physics-based tape stop
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

    if (sessionDuration >= 120 || remixIntensity > 0.3) {
      setShowSessionSummary(true);
    }
  };

  // Update isPlaying state
  useEffect(() => {
    const anyPlaying = deckA.isPlaying || deckB.isPlaying;
    setIsPlaying(anyPlaying);
  }, [deckA.isPlaying, deckB.isPlaying, setIsPlaying]);

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

  useEffect(() => {
    const anyPlaying = deckA.isPlaying || deckB.isPlaying;
    if (!anyPlaying || !sessionStartTime) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionDuration(duration);
      if (duration >= 120) {
        setShowSessionSummary(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deckA.isPlaying, deckB.isPlaying, sessionStartTime]);

  // Calculate remix intensity
  useEffect(() => {
    const baseIntensity = Math.min(1.0, sessionDuration / 300);
    const deckActivity = (deckA.audioBuffer ? 0.3 : 0) + (deckB.audioBuffer ? 0.3 : 0);
    const manipulationBonus = Math.min(0.4, stemManipulations / 20.0);
    const intensity = Math.min(1.0, baseIntensity + deckActivity + manipulationBonus);
    setRemixIntensity(intensity);
  }, [sessionDuration, deckA.audioBuffer, deckB.audioBuffer, stemManipulations]);

  // Impact pulse state
  const [impactPulse, setImpactPulse] = useState(false);

  // Show "Enter Studio" overlay if audio isn't ready
  if (!isReady) {
    return (
      <div
        className="relative h-screen w-screen flex items-center justify-center"
        style={{
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
      className="relative min-h-screen w-full overflow-hidden"
      style={{
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
      {/* 3D Canvas Background - Centered */}
      <div className="absolute inset-0 z-0">
        <StudioCanvas
          deckAIsPlaying={deckA.isPlaying}
          deckAAudioLevel={deckAAudioLevel}
          deckBIsPlaying={deckB.isPlaying}
          deckBAudioLevel={deckBAudioLevel}
          deckAColor="#E0E0E0"
          deckBColor="#E0E0E0"
          getFrequencyData={getFrequencyData}
          playbackRate={playbackRate}
          impactPulse={impactPulse}
        />
      </div>

      {/* Widescreen Console Layout */}
      <div className="relative z-10 max-w-[1920px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
          {/* Left Column: Console A (Artist) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-[#111] border-4 border-[#E0E0E0] p-4">
              <h2
                className="text-xl font-black italic uppercase text-[#FFD700] mb-4"
                style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
              >
                CONSOLE_A
              </h2>

              {/* Track Selection */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="SEARCH_TRACKS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050505] border-2 border-[#E0E0E0]/30 text-[#E0E0E0] font-mono text-xs uppercase mb-2"
                />

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredTracks.map((track) => (
                    <motion.button
                      key={track.id}
                      onClick={() => handleLoadDeckA(track)}
                      className={`w-full text-left p-2 border-2 transition-all ${
                        selectedTrackA?.id === track.id
                          ? "border-[#FFD700] bg-[#FFD700]/10"
                          : "border-[#E0E0E0]/20 bg-[#050505] hover:border-[#E0E0E0]/40"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        {track.coverArt.startsWith("/") ? (
                          <Image
                            src={track.coverArt}
                            alt={track.title}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 bg-gradient-to-r ${track.coverArt}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-mono text-[#E0E0E0] uppercase truncate">
                            {track.title}
                          </div>
                          <div className="text-[10px] font-mono text-[#E0E0E0]/60 uppercase truncate">
                            {track.artist}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Deck A Controls */}
              {deckA.audioBuffer && (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#E0E0E0]/60 uppercase">
                    LOADED: {deckA.trackName}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={deckA.isPlaying ? stopDeckA : playDeckA}
                      className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-mono font-bold text-xs uppercase border-2 border-black"
                      style={{ boxShadow: "4px 4px 0px rgba(0,0,0,1)" }}
                    >
                      {deckA.isPlaying ? "STOP" : "PLAY"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column: 3D Visualizer & CrossFader */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* 3D Canvas takes full height */}
            <div className="flex-1 relative">
              {/* Canvas is in background layer */}
            </div>

            {/* CrossFader - Prominently placed between decks */}
            <div className="bg-[#111] border-4 border-[#E0E0E0] p-4">
              <h3
                className="text-sm font-black italic uppercase text-[#FFD700] mb-3"
                style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
              >
                SIGNAL_SPLITTER
              </h3>
              <CrossFader position={crossfaderPosition} onPositionChange={setCrossfader} />
            </div>
          </div>

          {/* Right Column: Console B (Vault) & Master Console */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Console B: Signal Import */}
            <div className="bg-[#111] border-4 border-[#E0E0E0] p-4">
              <h2
                className="text-xl font-black italic uppercase text-[#FFD700] mb-4"
                style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
              >
                CONSOLE_B
              </h2>

              <SignalHatch
                onFileUpload={handleSignalImport}
                isProcessing={isProcessing}
                processingProgress={progress}
              />

              {/* Deck B Controls */}
              {deckB.audioBuffer && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-mono text-[#E0E0E0]/60 uppercase">
                    LOADED: {deckB.trackName}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={deckB.isPlaying ? stopDeckB : playDeckB}
                      className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-mono font-bold text-xs uppercase border-2 border-black"
                      style={{ boxShadow: "4px 4px 0px rgba(0,0,0,1)" }}
                    >
                      {deckB.isPlaying ? "STOP" : "PLAY"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Master Console Bar */}
            <div className="bg-[#111] border-4 border-[#E0E0E0] p-4 space-y-4">
              <h3
                className="text-sm font-black italic uppercase text-[#FFD700]"
                style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
              >
                MASTER_CONSOLE
              </h3>

              {/* Thermal Meter */}
              <ThermalMeter audioLevel={visualizerLevel} />

              {/* Studio Monitor */}
              <div>
                <StudioMonitor logs={logs} maxLines={6} className="text-xs" />
              </div>

              {/* Status & Stop */}
              <div className="flex items-center justify-between">
                <div
                  className={`px-3 py-1 border-2 font-mono text-[10px] uppercase ${
                    isPlaying
                      ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10"
                      : "border-[#E0E0E0]/30 text-[#E0E0E0]/60"
                  }`}
                >
                  {isPlaying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD700] animate-pulse" />
                      PLAYING
                    </span>
                  ) : (
                    "READY"
                  )}
                </div>

                {isPlaying && (
                  <button
                    onClick={handleStop}
                    className="px-4 py-2 bg-red-700 text-white font-mono font-bold text-xs uppercase border-2 border-black"
                    style={{ boxShadow: "4px 4px 0px rgba(0,0,0,1)" }}
                  >
                    STOP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Summary Popup */}
      <SessionSummary
        isOpen={showSessionSummary}
        onClose={() => setShowSessionSummary(false)}
        deckATrack={deckA.trackName}
        deckBTrack={deckB.trackName}
        sessionDuration={sessionDuration}
        remixIntensity={remixIntensity}
        onDownload={async () => {
          if (!audioContext || !deckA.audioBuffer && !deckB.audioBuffer) return;
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
          addLog("STUDIO_CORE: MIX_RENDERED: DOWNLOAD_COMPLETE");
        }}
        onShare={async () => {
          const trackName = deckA.trackName || deckB.trackName || "Track";
          const message = `Just remixed ${trackName} at the Piko Artist Studio. Own the master. 🔥 #PikoStudio #CommandTheMix`;
          if (navigator.share) {
            try {
              await navigator.share({ title: "Piko Studio Remix", text: message, url: window.location.href });
              addLog("STUDIO_CORE: SHARE_COMPLETE");
            } catch (error) {
              // User cancelled
            }
          } else {
            try {
              await navigator.clipboard.writeText(message);
              addLog("STUDIO_CORE: SHARE_LINK_COPIED");
            } catch (error) {
              console.error("[StudioPage] Clipboard copy failed:", error);
            }
          }
        }}
      />
    </div>
  );
}
