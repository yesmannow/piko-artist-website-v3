"use client";

import { useState, useEffect, useRef } from "react";
import { DJDeck, DJDeckRef } from "./DJDeck";
import { DJMixer } from "./DJMixer";
import { FXUnit } from "./FXUnit";
import { tracks } from "@/lib/data";
import { HelpCircle } from "lucide-react";
import { useHelp } from "@/context/HelpContext";
import { ConsoleTour } from "./dj-ui/ConsoleTour";

// Distortion scaling controls for WaveShaper intensity
const DISTORTION_SCALE = 400;
const DISTORTION_DEFAULT_K = 0; // Clean fallback when drive is invalid
// WaveShaper curve shape (matches common MDN example)
const DISTORTION_CURVE_BASE = 3;
const DISTORTION_CURVE_MULTIPLIER = 20;
const DISTORTION_CURVE_SAMPLES = 44100;
// Safety cap for feedback loop stability
const FX_DELAY_FEEDBACK_MAX = 0.9;

export function DJInterface() {
  const { isHelpMode, toggleHelp, triggerTour } = useHelp();

  // Deck A state
  const [deckAData, setDeckAData] = useState<typeof tracks[0] | null>(null);
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckAVolume, setDeckAVolume] = useState(0.7);
  const [deckASpeed, setDeckASpeed] = useState(1.0); // 1.0 = 0%, range 0.92-1.08 for +/- 8%
  const [deckAHigh, setDeckAHigh] = useState(0);
  const [deckAMid, setDeckAMid] = useState(0);
  const [deckALow, setDeckALow] = useState(0);

  // Deck B state
  const [deckBData, setDeckBData] = useState<typeof tracks[0] | null>(null);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [deckBVolume, setDeckBVolume] = useState(0.7);
  const [deckBSpeed, setDeckBSpeed] = useState(1.0); // 1.0 = 0%, range 0.92-1.08 for +/- 8%
  const [deckBHigh, setDeckBHigh] = useState(0);
  const [deckBMid, setDeckBMid] = useState(0);
  const [deckBLow, setDeckBLow] = useState(0);

  // Mixer state
  const [crossfader, setCrossfader] = useState(0.5);

  // Active deck for FX control
  const [activeDeck, setActiveDeck] = useState<"A" | "B">("A");

  // FX state for Deck A
  const [filterFreqA, setFilterFreqA] = useState(1000);
  const [filterTypeA, setFilterTypeA] = useState<"lowpass" | "highpass">("lowpass");
  const [reverbDryWetA, setReverbDryWetA] = useState(0);
  const [delayTimeA, setDelayTimeA] = useState(0);
  const [delayFeedbackA, setDelayFeedbackA] = useState(0);
  const [distortionAmountA, setDistortionAmountA] = useState(0);

  // FX state for Deck B
  const [filterFreqB, setFilterFreqB] = useState(1000);
  const [filterTypeB, setFilterTypeB] = useState<"lowpass" | "highpass">("lowpass");
  const [reverbDryWetB, setReverbDryWetB] = useState(0);
  const [delayTimeB, setDelayTimeB] = useState(0);
  const [delayFeedbackB, setDelayFeedbackB] = useState(0);
  const [distortionAmountB, setDistortionAmountB] = useState(0);

  const clampDelayFeedback = (value: number) => Math.min(Math.max(value, 0), FX_DELAY_FEEDBACK_MAX);
  const clampDistortionAmount = (value: number) => Math.min(Math.max(value, 0), 1);

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

  // FX nodes for Deck A
  const fxFilterARef = useRef<BiquadFilterNode | null>(null);
  const fxReverbARef = useRef<ConvolverNode | null>(null);
  const fxReverbGainARef = useRef<GainNode | null>(null);
  const fxDelayARef = useRef<DelayNode | null>(null);
  const fxDelayGainARef = useRef<GainNode | null>(null);
  const fxDelayFeedbackARef = useRef<GainNode | null>(null);
  const fxDistortionARef = useRef<WaveShaperNode | null>(null);
  const preFxGainARef = useRef<GainNode | null>(null);

  // FX nodes for Deck B
  const fxFilterBRef = useRef<BiquadFilterNode | null>(null);
  const fxReverbBRef = useRef<ConvolverNode | null>(null);
  const fxReverbGainBRef = useRef<GainNode | null>(null);
  const fxDelayBRef = useRef<DelayNode | null>(null);
  const fxDelayGainBRef = useRef<GainNode | null>(null);
  const fxDelayFeedbackBRef = useRef<GainNode | null>(null);
  const fxDistortionBRef = useRef<WaveShaperNode | null>(null);
  const preFxGainBRef = useRef<GainNode | null>(null);

  // 1. INITIALIZATION (Run ONCE - Empty dependency array)
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

    // Deck A gain (initial value will be set by volume update useEffect)
    const deckAGain = ctx.createGain();
    deckAGain.gain.value = 0.7; // Initial default
    deckAGainRef.current = deckAGain;

    // Deck B gain (initial value will be set by volume update useEffect)
    const deckBGain = ctx.createGain();
    deckBGain.gain.value = 0.7; // Initial default
    deckBGainRef.current = deckBGain;

    // Helper function to create reverb impulse response
    const createReverbImpulse = () => {
      const impulseLength = ctx.sampleRate * 2; // 2 seconds
      const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
      const impulseL = impulse.getChannelData(0);
      const impulseR = impulse.getChannelData(1);

      for (let i = 0; i < impulseLength; i++) {
        const n = impulseLength - i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / impulseLength, 2);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / impulseLength, 2);
      }
      return impulse;
    };

    // ========== DECK A FX CHAIN ==========
    // Pre-FX Mix node for Deck A
    const preFxGainA = ctx.createGain();
    preFxGainA.gain.value = 1.0;
    preFxGainARef.current = preFxGainA;

    // Distortion (Grit) Effect for Deck A
    const fxDistortionA = ctx.createWaveShaper();
    fxDistortionA.curve = makeDistortionCurve(0);
    fxDistortionA.oversample = "4x";
    fxDistortionARef.current = fxDistortionA;

    // Filter for Deck A
    const fxFilterA = ctx.createBiquadFilter();
    fxFilterA.type = "lowpass";
    fxFilterA.frequency.value = 1000;
    fxFilterA.Q.value = 1;
    fxFilterARef.current = fxFilterA;

    // Reverb for Deck A
    const reverbGainA = ctx.createGain();
    reverbGainA.gain.value = 0;
    fxReverbGainARef.current = reverbGainA;

    const reverbConvolverA = ctx.createConvolver();
    reverbConvolverA.buffer = createReverbImpulse();
    reverbConvolverA.normalize = true;
    fxReverbARef.current = reverbConvolverA;

    // Delay for Deck A
    const delayA = ctx.createDelay(1.0);
    delayA.delayTime.value = 0;
    fxDelayARef.current = delayA;

    const delayGainA = ctx.createGain();
    delayGainA.gain.value = 0.5;
    fxDelayGainARef.current = delayGainA;

    const delayFeedbackGainA = ctx.createGain();
    delayFeedbackGainA.gain.value = 0;
    fxDelayFeedbackARef.current = delayFeedbackGainA;

    // Connect delay feedback loop for Deck A
    delayA.connect(delayFeedbackGainA);
    delayFeedbackGainA.connect(delayA);

    // ========== DECK B FX CHAIN ==========
    // Pre-FX Mix node for Deck B
    const preFxGainB = ctx.createGain();
    preFxGainB.gain.value = 1.0;
    preFxGainBRef.current = preFxGainB;

    // Distortion (Grit) Effect for Deck B
    const fxDistortionB = ctx.createWaveShaper();
    fxDistortionB.curve = makeDistortionCurve(0);
    fxDistortionB.oversample = "4x";
    fxDistortionBRef.current = fxDistortionB;

    // Filter for Deck B
    const fxFilterB = ctx.createBiquadFilter();
    fxFilterB.type = "lowpass";
    fxFilterB.frequency.value = 1000;
    fxFilterB.Q.value = 1;
    fxFilterBRef.current = fxFilterB;

    // Reverb for Deck B
    const reverbGainB = ctx.createGain();
    reverbGainB.gain.value = 0;
    fxReverbGainBRef.current = reverbGainB;

    const reverbConvolverB = ctx.createConvolver();
    reverbConvolverB.buffer = createReverbImpulse();
    reverbConvolverB.normalize = true;
    fxReverbBRef.current = reverbConvolverB;

    // Delay for Deck B
    const delayB = ctx.createDelay(1.0);
    delayB.delayTime.value = 0;
    fxDelayBRef.current = delayB;

    const delayGainB = ctx.createGain();
    delayGainB.gain.value = 0.5;
    fxDelayGainBRef.current = delayGainB;

    const delayFeedbackGainB = ctx.createGain();
    delayFeedbackGainB.gain.value = 0;
    fxDelayFeedbackBRef.current = delayFeedbackGainB;

    // Connect delay feedback loop for Deck B
    delayB.connect(delayFeedbackGainB);
    delayFeedbackGainB.connect(delayB);

    // Connect filter chains: Low -> Mid -> High -> Gain (Volume)
    deckALowFilter.connect(deckAMidFilter);
    deckAMidFilter.connect(deckAHighFilter);
    deckAHighFilter.connect(deckAGain);

    deckBLowFilter.connect(deckBMidFilter);
    deckBMidFilter.connect(deckBHighFilter);
    deckBHighFilter.connect(deckBGain);

    // Audio routing: Each deck has its own FX chain
    // Deck A: Deck A Gain -> Pre-FX A -> Distortion A -> Filter A -> (Dry/Delay/Reverb A) -> Master
    // Deck B: Deck B Gain -> Pre-FX B -> Distortion B -> Filter B -> (Dry/Delay/Reverb B) -> Master

    // ========== DECK A ROUTING ==========
    // Connect Deck A to its Pre-FX Mix
    deckAGain.connect(preFxGainA);

    // Connect Pre-FX A -> Distortion A -> Filter A
    preFxGainA.connect(fxDistortionA);
    fxDistortionA.connect(fxFilterA);

    // Dry Signal Path: Filter A -> Master
    fxFilterA.connect(masterGain);

    // Wet Signal Path (Delay A): Filter A -> Delay A -> DelayGain A -> Master
    fxFilterA.connect(delayA);
    delayA.connect(delayGainA);
    delayGainA.connect(masterGain);

    // Wet Signal Path (Reverb A): Filter A -> Reverb A -> ReverbGain A -> Master
    fxFilterA.connect(reverbConvolverA);
    reverbConvolverA.connect(reverbGainA);
    reverbGainA.connect(masterGain);

    // ========== DECK B ROUTING ==========
    // Connect Deck B to its Pre-FX Mix
    deckBGain.connect(preFxGainB);

    // Connect Pre-FX B -> Distortion B -> Filter B
    preFxGainB.connect(fxDistortionB);
    fxDistortionB.connect(fxFilterB);

    // Dry Signal Path: Filter B -> Master
    fxFilterB.connect(masterGain);

    // Wet Signal Path (Delay B): Filter B -> Delay B -> DelayGain B -> Master
    fxFilterB.connect(delayB);
    delayB.connect(delayGainB);
    delayGainB.connect(masterGain);

    // Wet Signal Path (Reverb B): Filter B -> Reverb B -> ReverbGain B -> Master
    fxFilterB.connect(reverbConvolverB);
    reverbConvolverB.connect(reverbGainB);
    reverbGainB.connect(masterGain);

    // ========== MASTER OUTPUT ==========
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    return () => {
      // Cleanup ONLY on unmount
      if (audioContextRef.current) {
        try {
          audioContextRef.current.suspend();
          audioContextRef.current.close();
        } catch (error) {
          // Ignore errors if context is already closed
          console.warn("Error closing audio context:", error);
        }
      }
    };
  }, []); // <--- EMPTY DEPENDENCY ARRAY (Crucial!)

  // 2. VOLUME UPDATES
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

  // 3. FX UPDATES (Real-time, no reboot) - Deck A
  useEffect(() => {
    if (fxFilterARef.current) {
      fxFilterARef.current.type = filterTypeA;
      fxFilterARef.current.frequency.value = filterFreqA;
    }
  }, [filterFreqA, filterTypeA]);

  useEffect(() => {
    if (fxReverbGainARef.current) {
      fxReverbGainARef.current.gain.value = reverbDryWetA;
    }
  }, [reverbDryWetA]);

  useEffect(() => {
    if (fxDelayARef.current && fxDelayFeedbackARef.current) {
      fxDelayARef.current.delayTime.value = delayTimeA;
      fxDelayFeedbackARef.current.gain.value = delayFeedbackA;
    }
  }, [delayTimeA, delayFeedbackA]);

  useEffect(() => {
    if (fxDistortionARef.current) {
      const drive = clampDistortionAmount(distortionAmountA);
      fxDistortionARef.current.curve = makeDistortionCurve(drive * DISTORTION_SCALE);
    }
  }, [distortionAmountA]);

  // 3. FX UPDATES (Real-time, no reboot) - Deck B
  useEffect(() => {
    if (fxFilterBRef.current) {
      fxFilterBRef.current.type = filterTypeB;
      fxFilterBRef.current.frequency.value = filterFreqB;
    }
  }, [filterFreqB, filterTypeB]);

  useEffect(() => {
    if (fxReverbGainBRef.current) {
      fxReverbGainBRef.current.gain.value = reverbDryWetB;
    }
  }, [reverbDryWetB]);

  useEffect(() => {
    if (fxDelayBRef.current && fxDelayFeedbackBRef.current) {
      fxDelayBRef.current.delayTime.value = delayTimeB;
      fxDelayFeedbackBRef.current.gain.value = delayFeedbackB;
    }
  }, [delayTimeB, delayFeedbackB]);

  useEffect(() => {
    if (fxDistortionBRef.current) {
      const drive = clampDistortionAmount(distortionAmountB);
      fxDistortionBRef.current.curve = makeDistortionCurve(drive * DISTORTION_SCALE);
    }
  }, [distortionAmountB]);

  // 4. EQ FILTER UPDATES
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

  // Remove old master level meter (now using spectrum analyzer)

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile landscape hint state
  const [showLandscapeHint, setShowLandscapeHint] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before accessing window
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for mobile portrait orientation
  useEffect(() => {
    if (!isMounted) return;

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
  }, [isMounted]);

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
      setDeckAData(track);
      setDeckAPlaying(false);
    }
  };

  const loadTrackToDeckB = (track: typeof tracks[0]) => {
    if (track.type === "audio") {
      setDeckBData(track);
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
      {showLandscapeHint && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 mb-6 border-2 border-[#ccff00] rounded-lg animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">
            Rotate Device
          </h2>
          <p className="text-zinc-400 max-w-xs mx-auto">
            The Studio requires landscape mode for the full mixing console experience.
          </p>
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
              <div className="flex items-center gap-2">
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
                <button
                  onClick={triggerTour}
                  className="px-3 py-2 text-xs font-barlow uppercase tracking-wider rounded border-2 border-gray-700 text-gray-400 hover:border-[#00ff00] hover:text-[#00ff00] transition-all"
                  title="Replay Onboarding Tour"
                  aria-label="Replay tour"
                >
                  Replay Tour
                </button>
              </div>
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
          // Deck A FX
          filterFreqA={filterFreqA}
          filterTypeA={filterTypeA}
          onFilterFreqChangeA={setFilterFreqA}
          onFilterTypeChangeA={setFilterTypeA}
          reverbDryWetA={reverbDryWetA}
          onReverbDryWetChangeA={setReverbDryWetA}
          delayTimeA={delayTimeA}
          delayFeedbackA={delayFeedbackA}
          onDelayTimeChangeA={setDelayTimeA}
          onDelayFeedbackChangeA={(val) => setDelayFeedbackA(clampDelayFeedback(val))}
          distortionAmountA={distortionAmountA}
          onDistortionChangeA={(val) => setDistortionAmountA(clampDistortionAmount(val))}
          // Deck B FX
          filterFreqB={filterFreqB}
          filterTypeB={filterTypeB}
          onFilterFreqChangeB={setFilterFreqB}
          onFilterTypeChangeB={setFilterTypeB}
          reverbDryWetB={reverbDryWetB}
          onReverbDryWetChangeB={setReverbDryWetB}
          delayTimeB={delayTimeB}
          delayFeedbackB={delayFeedbackB}
          onDelayTimeChangeB={setDelayTimeB}
          onDelayFeedbackChangeB={(val) => setDelayFeedbackB(clampDelayFeedback(val))}
          distortionAmountB={distortionAmountB}
          onDistortionChangeB={(val) => setDistortionAmountB(clampDistortionAmount(val))}
          // Active deck toggle
          activeDeck={activeDeck}
          onActiveDeckChange={setActiveDeck}
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
              trackUrl={deckAData?.src || null}
              isPlaying={deckAPlaying}
              speed={deckASpeed}
              deckColor="#4a90e2"
              deckLabel="DECK A"
              onPlayPause={() => setDeckAPlaying(!deckAPlaying)}
              onSync={handleDeckASync}
              onSpeedChange={handleDeckASpeedChange}
              isSynced={deckASynced}
              audioContext={audioContextRef.current || undefined}
              outputNode={deckAFiltersRef.current?.low || undefined}
              title={deckAData?.title}
              coverArt={deckAData?.coverArt}
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
              trackUrl={deckBData?.src || null}
              isPlaying={deckBPlaying}
              speed={deckBSpeed}
              deckColor="#e24a4a"
              deckLabel="DECK B"
              onPlayPause={() => setDeckBPlaying(!deckBPlaying)}
              onSync={handleDeckBSync}
              onSpeedChange={handleDeckBSpeedChange}
              isSynced={deckBSynced}
              audioContext={audioContextRef.current || undefined}
              outputNode={deckBFiltersRef.current?.low || undefined}
              title={deckBData?.title}
              coverArt={deckBData?.coverArt}
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

/**
 * Generate a symmetrical soft-clipping curve for WaveShaperNode.
 * Based on the classic arctangent-inspired formula from MDN:
 *   y = ((a + k) * x * b * deg) / (π + k * |x|)
 * where k is drive amount, a/b tune the curve shape, and x spans -1..1.
 * @param amount Drive amount (0..DISTORTION_SCALE) controlling curve intensity.
 */
function makeDistortionCurve(amount: number) {
  const k = Number.isFinite(amount) ? amount : DISTORTION_DEFAULT_K;
  const curve = new Float32Array(DISTORTION_CURVE_SAMPLES);
  const deg = Math.PI / 180;
  for (let i = 0; i < DISTORTION_CURVE_SAMPLES; ++i) {
    const x = (i * 2) / DISTORTION_CURVE_SAMPLES - 1;
    curve[i] =
      ((DISTORTION_CURVE_BASE + k) * x * DISTORTION_CURVE_MULTIPLIER * deg) /
      (Math.PI + k * Math.abs(x));
  }
  return curve;
}
