"use client";

import { useState, useEffect, useRef } from "react";
import { DJDeck, DJDeckRef } from "./DJDeck";
import { DJMixer } from "./DJMixer";
import { FXUnit } from "./FXUnit";
import { tracks } from "@/lib/data";
import { X, HelpCircle } from "lucide-react";
import { useHelp } from "@/context/HelpContext";
import { ConsoleTour } from "./dj-ui/ConsoleTour";

export function DJInterface() {
  const { isHelpMode, toggleHelp } = useHelp();

  // Deck A state
  const [deckATrack, setDeckATrack] = useState<string | null>(null);
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckAVolume, setDeckAVolume] = useState(0.7);
  const [deckASpeed, setDeckASpeed] = useState(1.0); // 1.0 = 0%, range 0.92-1.08 for +/- 8%
  const [deckAHigh, setDeckAHigh] = useState(0);
  const [deckAMid, setDeckAMid] = useState(0);
  const [deckALow, setDeckALow] = useState(0);

  // Deck B state
  const [deckBTrack, setDeckBTrack] = useState<string | null>(null);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [deckBVolume, setDeckBVolume] = useState(0.7);
  const [deckBSpeed, setDeckBSpeed] = useState(1.0); // 1.0 = 0%, range 0.92-1.08 for +/- 8%
  const [deckBHigh, setDeckBHigh] = useState(0);
  const [deckBMid, setDeckBMid] = useState(0);
  const [deckBLow, setDeckBLow] = useState(0);

  // Mixer state
  const [crossfader, setCrossfader] = useState(0.5);

  // FX state
  const [filterFreq, setFilterFreq] = useState(1000);
  const [filterType, setFilterType] = useState<"lowpass" | "highpass">("lowpass");
  const [reverbDryWet, setReverbDryWet] = useState(0);
  const [delayTime, setDelayTime] = useState(0);
  const [delayFeedback, setDelayFeedback] = useState(0);

  // Kill switches
  const [deckAKillHigh, setDeckAKillHigh] = useState(false);
  const [deckAKillMid, setDeckAKillMid] = useState(false);
  const [deckAKillLow, setDeckAKillLow] = useState(false);
  const [deckBKillHigh, setDeckBKillHigh] = useState(false);
  const [deckBKillMid, setDeckBKillMid] = useState(false);
  const [deckBKillLow, setDeckBKillLow] = useState(false);

  // Sync state
  const [deckASynced, setDeckASynced] = useState(false);
  const [deckBSynced, setDeckBSynced] = useState(false);

  // Refs
  const deckARef = useRef<DJDeckRef>(null);
  const deckBRef = useRef<DJDeckRef>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const deckAGainRef = useRef<GainNode | null>(null);
  const deckBGainRef = useRef<GainNode | null>(null);
  const deckAFiltersRef = useRef<{
    high: BiquadFilterNode;
    mid: BiquadFilterNode;
    low: BiquadFilterNode;
  } | null>(null);
  const deckBFiltersRef = useRef<{
    high: BiquadFilterNode;
    mid: BiquadFilterNode;
    low: BiquadFilterNode;
  } | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // FX nodes (shared between decks)
  const fxFilterRef = useRef<BiquadFilterNode | null>(null);
  const fxReverbRef = useRef<ConvolverNode | null>(null);
  const fxReverbGainRef = useRef<GainNode | null>(null);
  const fxDelayRef = useRef<DelayNode | null>(null);
  const fxDelayGainRef = useRef<GainNode | null>(null);
  const fxDelayFeedbackRef = useRef<GainNode | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    // Create master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGainRef.current = masterGain;

    // Create analyser for master level meter
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Deck A filters
    const deckAHighFilter = ctx.createBiquadFilter();
    deckAHighFilter.type = "highshelf";
    deckAHighFilter.frequency.value = 5000;
    deckAHighFilter.gain.value = 0;

    const deckAMidFilter = ctx.createBiquadFilter();
    deckAMidFilter.type = "peaking";
    deckAMidFilter.frequency.value = 1000;
    deckAMidFilter.Q.value = 1;
    deckAMidFilter.gain.value = 0;

    const deckALowFilter = ctx.createBiquadFilter();
    deckALowFilter.type = "lowshelf";
    deckALowFilter.frequency.value = 200;
    deckALowFilter.gain.value = 0;

    deckAFiltersRef.current = {
      high: deckAHighFilter,
      mid: deckAMidFilter,
      low: deckALowFilter,
    };

    // Deck B filters
    const deckBHighFilter = ctx.createBiquadFilter();
    deckBHighFilter.type = "highshelf";
    deckBHighFilter.frequency.value = 5000;
    deckBHighFilter.gain.value = 0;

    const deckBMidFilter = ctx.createBiquadFilter();
    deckBMidFilter.type = "peaking";
    deckBMidFilter.frequency.value = 1000;
    deckBMidFilter.Q.value = 1;
    deckBMidFilter.gain.value = 0;

    const deckBLowFilter = ctx.createBiquadFilter();
    deckBLowFilter.type = "lowshelf";
    deckBLowFilter.frequency.value = 200;
    deckBLowFilter.gain.value = 0;

    deckBFiltersRef.current = {
      high: deckBHighFilter,
      mid: deckBMidFilter,
      low: deckBLowFilter,
    };

    // Deck A gain
    const deckAGain = ctx.createGain();
    deckAGain.gain.value = deckAVolume;
    deckAGainRef.current = deckAGain;

    // Deck B gain
    const deckBGain = ctx.createGain();
    deckBGain.gain.value = deckBVolume;
    deckBGainRef.current = deckBGain;

    // Create FX nodes
    // Filter
    const fxFilter = ctx.createBiquadFilter();
    fxFilter.type = filterType;
    fxFilter.frequency.value = filterFreq;
    fxFilter.Q.value = 1;
    fxFilterRef.current = fxFilter;

    // Reverb (using ConvolverNode with impulse response)
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = reverbDryWet;
    fxReverbGainRef.current = reverbGain;

    // Create a simple reverb impulse (we'll use a delay-based approach for simplicity)
    const reverbConvolver = ctx.createConvolver();
    // For now, we'll use a simple delay-based reverb
    fxReverbRef.current = reverbConvolver;

    // Delay
    const delay = ctx.createDelay(1.0); // Max 1 second delay
    delay.delayTime.value = delayTime;
    fxDelayRef.current = delay;

    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.5; // Output gain
    fxDelayGainRef.current = delayGain;

    const delayFeedbackGain = ctx.createGain();
    delayFeedbackGain.gain.value = delayFeedback;
    fxDelayFeedbackRef.current = delayFeedbackGain;

    // Connect delay feedback loop
    delay.connect(delayGain);
    delay.connect(delayFeedbackGain);
    delayFeedbackGain.connect(delay);

    // Connect filter chains: Low -> Mid -> High -> Gain (Volume)
    deckALowFilter.connect(deckAMidFilter);
    deckAMidFilter.connect(deckAHighFilter);
    deckAHighFilter.connect(deckAGain);

    deckBLowFilter.connect(deckBMidFilter);
    deckBMidFilter.connect(deckBHighFilter);
    deckBHighFilter.connect(deckBGain);

    // Audio routing: Source -> FX -> EQ -> Volume -> Crossfader -> Master -> Analyzer -> Destination
    // Note: FX will be connected in DJDeck when media source is created
    // For now, connect decks directly to master (FX will be inserted in the chain)
    deckAGain.connect(masterGain);
    deckBGain.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    return () => {
      ctx.close();
    };
  }, [deckAVolume, deckBVolume, delayFeedback, delayTime, filterFreq, filterType, reverbDryWet]);

  // Update EQ filters
  useEffect(() => {
    if (deckAFiltersRef.current) {
      deckAFiltersRef.current.high.gain.value = deckAHigh;
      deckAFiltersRef.current.mid.gain.value = deckAMid;
      deckAFiltersRef.current.low.gain.value = deckALow;
    }
  }, [deckAHigh, deckAMid, deckALow]);

  useEffect(() => {
    if (deckBFiltersRef.current) {
      deckBFiltersRef.current.high.gain.value = deckBHigh;
      deckBFiltersRef.current.mid.gain.value = deckBMid;
      deckBFiltersRef.current.low.gain.value = deckBLow;
    }
  }, [deckBHigh, deckBMid, deckBLow]);

  // Update volume gains with Equal Power Crossfading
  useEffect(() => {
    if (deckAGainRef.current) {
      // Equal Power Crossfading: Gain A = cos(crossfaderValue * 0.5 * π)
      const equalPowerGainA = Math.cos(crossfader * 0.5 * Math.PI);
      deckAGainRef.current.gain.value = deckAVolume * equalPowerGainA;
    }
  }, [deckAVolume, crossfader]);

  useEffect(() => {
    if (deckBGainRef.current) {
      // Equal Power Crossfading: Gain B = cos((1 - crossfaderValue) * 0.5 * π)
      const equalPowerGainB = Math.cos((1 - crossfader) * 0.5 * Math.PI);
      deckBGainRef.current.gain.value = deckBVolume * equalPowerGainB;
    }
  }, [deckBVolume, crossfader]);

  // Remove old master level meter (now using spectrum analyzer)

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile landscape hint state
  const [showLandscapeHint, setShowLandscapeHint] = useState(false);
  const [landscapeHintDismissed, setLandscapeHintDismissed] = useState(false);

  // Check for mobile portrait orientation
  useEffect(() => {
    if (landscapeHintDismissed) return;

    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowLandscapeHint(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, [landscapeHintDismissed]);

  // Get audio tracks only and filter by search
  const audioTracks = tracks
    .filter((t) => t.type === "audio")
    .filter((t) =>
      searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const loadTrackToDeckA = (track: typeof tracks[0]) => {
    if (track.type === "audio") {
      setDeckATrack(track.src);
      setDeckAPlaying(false);
    }
  };

  const loadTrackToDeckB = (track: typeof tracks[0]) => {
    if (track.type === "audio") {
      setDeckBTrack(track.src);
      setDeckBPlaying(false);
    }
  };

  // Handle sync - syncs the other deck to this deck's speed
  const handleDeckASync = () => {
    if (deckARef.current && deckBRef.current) {
      const deckARate = deckARef.current.getPlaybackRate();
      deckBRef.current.setPlaybackRate(deckARate);
      setDeckBSpeed(deckARate);
      setDeckBSynced(true);
      setDeckASynced(false);
    }
  };

  const handleDeckBSync = () => {
    if (deckARef.current && deckBRef.current) {
      const deckBRate = deckBRef.current.getPlaybackRate();
      deckARef.current.setPlaybackRate(deckBRate);
      setDeckASpeed(deckBRate);
      setDeckASynced(true);
      setDeckBSynced(false);
    }
  };

  // Handle speed changes
  const handleDeckASpeedChange = (speed: number) => {
    setDeckASpeed(speed);
    if (deckASynced && deckBRef.current) {
      deckBRef.current.setPlaybackRate(speed);
      setDeckBSpeed(speed);
    }
    if (deckBSynced) {
      setDeckBSynced(false);
    }
  };

  const handleDeckBSpeedChange = (speed: number) => {
    setDeckBSpeed(speed);
    if (deckBSynced && deckARef.current) {
      deckARef.current.setPlaybackRate(speed);
      setDeckASpeed(speed);
    }
    if (deckASynced) {
      setDeckASynced(false);
    }
  };

  return (
    <>
      {/* Mobile Landscape Hint */}
      {showLandscapeHint && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] border-2 border-gray-700 rounded-lg px-4 py-3 shadow-lg max-w-sm mx-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-barlow text-gray-300">
              For the best DJ experience, rotate your phone to Landscape.
            </p>
          </div>
          <button
            onClick={() => {
              setShowLandscapeHint(false);
              setLandscapeHintDismissed(true);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      <ConsoleTour />
      <div
        className="min-h-screen p-3 md:p-6"
        style={{
        background: "#121212",
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          )
        `,
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Library/Browser */}
        <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 p-4" data-tour="library">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-barlow uppercase tracking-wider text-gray-300">
                TRACK LIBRARY
              </h2>
              <button
                onClick={toggleHelp}
                className={`p-2 rounded border-2 transition-all ${
                  isHelpMode
                    ? "border-[#00ff00] bg-[#00ff00]/10 text-[#00ff00]"
                    : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                }`}
                title={isHelpMode ? "Exit Help Mode" : "Enable Help Mode"}
                aria-label="Toggle help mode"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white placeholder-gray-500 font-barlow text-sm focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 md:max-h-80 overflow-y-auto scrollbar-hide">
            {audioTracks.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 font-barlow py-8">
                No tracks found
              </div>
            ) : (
              audioTracks.map((track) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("track", JSON.stringify(track));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex flex-col gap-2 p-2 bg-[#1a1a1a] rounded border border-gray-800 hover:border-gray-600 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <div className="text-xs font-barlow uppercase text-gray-400 truncate" title={track.title}>
                    {track.title}
                  </div>
                  <div className="text-[10px] font-barlow text-gray-500 truncate" title={track.artist}>
                    {track.artist}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadTrackToDeckA(track)}
                      className="flex-1 px-2 py-1 text-xs font-barlow uppercase bg-[#2a2a2a] hover:bg-[#4a90e2] text-gray-400 hover:text-white rounded transition-colors"
                    >
                      A
                    </button>
                    <button
                      onClick={() => loadTrackToDeckB(track)}
                      className="flex-1 px-2 py-1 text-xs font-barlow uppercase bg-[#2a2a2a] hover:bg-[#e24a4a] text-gray-400 hover:text-white rounded transition-colors"
                    >
                      B
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 text-xs font-barlow text-gray-500 text-center">
            {audioTracks.length} track{audioTracks.length !== 1 ? "s" : ""} • Drag tracks to decks or click A/B buttons
          </div>
        </div>

        {/* FX Rack */}
        <div data-tour="fx-unit">
        <FXUnit
          filterFreq={filterFreq}
          filterType={filterType}
          onFilterFreqChange={setFilterFreq}
          onFilterTypeChange={setFilterType}
          reverbDryWet={reverbDryWet}
          onReverbDryWetChange={setReverbDryWet}
          delayTime={delayTime}
          delayFeedback={delayFeedback}
          onDelayTimeChange={setDelayTime}
          onDelayFeedbackChange={setDelayFeedback}
        />
        </div>

        {/* Main Console */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Deck A */}
          <div
            data-tour="deck-a"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const dropZone = document.getElementById("deck-a-drop-zone");
              if (dropZone) dropZone.style.opacity = "1";
            }}
            onDragLeave={(e) => {
              const dropZone = document.getElementById("deck-a-drop-zone");
              if (dropZone && !e.currentTarget.contains(e.relatedTarget as Node)) {
                dropZone.style.opacity = "0";
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dropZone = document.getElementById("deck-a-drop-zone");
              if (dropZone) dropZone.style.opacity = "0";
              try {
                const trackData = e.dataTransfer.getData("track");
                if (trackData) {
                  const track = JSON.parse(trackData);
                  loadTrackToDeckA(track);
                }
              } catch (error) {
                console.error("Error loading track:", error);
              }
            }}
            className="relative"
          >
            <DJDeck
              ref={deckARef}
              trackUrl={deckATrack}
              isPlaying={deckAPlaying}
              volume={deckAVolume}
              speed={deckASpeed}
              deckColor="#4a90e2"
              deckLabel="DECK A"
              onPlayPause={() => setDeckAPlaying(!deckAPlaying)}
              onSync={handleDeckASync}
              onSpeedChange={handleDeckASpeedChange}
              isSynced={deckASynced}
              audioContext={audioContextRef.current || undefined}
              gainNode={deckAGainRef.current || undefined}
              filterNodes={deckAFiltersRef.current || undefined}
            />
            {/* Drop indicator */}
            <div className="absolute inset-0 border-2 border-dashed border-[#4a90e2] rounded-lg pointer-events-none opacity-0 transition-opacity" id="deck-a-drop-zone" />
          </div>

          {/* Mixer */}
          <div data-tour="mixer">
          <DJMixer
            deckAVolume={deckAVolume}
            deckAHigh={deckAHigh}
            deckAMid={deckAMid}
            deckALow={deckALow}
            onDeckAVolumeChange={setDeckAVolume}
            onDeckAHighChange={setDeckAHigh}
            onDeckAMidChange={setDeckAMid}
            onDeckALowChange={setDeckALow}
            deckAKillHigh={deckAKillHigh}
            deckAKillMid={deckAKillMid}
            deckAKillLow={deckAKillLow}
            onDeckAKillHighChange={setDeckAKillHigh}
            onDeckAKillMidChange={setDeckAKillMid}
            onDeckAKillLowChange={setDeckAKillLow}
            deckBVolume={deckBVolume}
            deckBHigh={deckBHigh}
            deckBMid={deckBMid}
            deckBLow={deckBLow}
            onDeckBVolumeChange={setDeckBVolume}
            onDeckBHighChange={setDeckBHigh}
            onDeckBMidChange={setDeckBMid}
            onDeckBLowChange={setDeckBLow}
            deckBKillHigh={deckBKillHigh}
            deckBKillMid={deckBKillMid}
            deckBKillLow={deckBKillLow}
            onDeckBKillHighChange={setDeckBKillHigh}
            onDeckBKillMidChange={setDeckBKillMid}
            onDeckBKillLowChange={setDeckBKillLow}
            crossfader={crossfader}
            onCrossfaderChange={setCrossfader}
            audioContext={audioContextRef.current || undefined}
            masterGainNode={masterGainRef.current || undefined}
          />
          </div>

          {/* Deck B */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const dropZone = document.getElementById("deck-b-drop-zone");
              if (dropZone) dropZone.style.opacity = "1";
            }}
            onDragLeave={(e) => {
              const dropZone = document.getElementById("deck-b-drop-zone");
              if (dropZone && !e.currentTarget.contains(e.relatedTarget as Node)) {
                dropZone.style.opacity = "0";
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dropZone = document.getElementById("deck-b-drop-zone");
              if (dropZone) dropZone.style.opacity = "0";
              try {
                const trackData = e.dataTransfer.getData("track");
                if (trackData) {
                  const track = JSON.parse(trackData);
                  loadTrackToDeckB(track);
                }
              } catch (error) {
                console.error("Error loading track:", error);
              }
            }}
            className="relative"
          >
            <DJDeck
              ref={deckBRef}
              trackUrl={deckBTrack}
              isPlaying={deckBPlaying}
              volume={deckBVolume}
              speed={deckBSpeed}
              deckColor="#e24a4a"
              deckLabel="DECK B"
              onPlayPause={() => setDeckBPlaying(!deckBPlaying)}
              onSync={handleDeckBSync}
              onSpeedChange={handleDeckBSpeedChange}
              isSynced={deckBSynced}
              audioContext={audioContextRef.current || undefined}
              gainNode={deckBGainRef.current || undefined}
              filterNodes={deckBFiltersRef.current || undefined}
            />
            {/* Drop indicator */}
            <div className="absolute inset-0 border-2 border-dashed border-[#e24a4a] rounded-lg pointer-events-none opacity-0 transition-opacity" id="deck-b-drop-zone" />
          </div>
        </div>

      </div>
    </div>
    </>
  );
}

