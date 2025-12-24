"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { DJDeck, DJDeckRef } from "./DJDeck";
import { DJMixer } from "./DJMixer";
import { FXUnit } from "./FXUnit";
import { tracks } from "@/lib/data";
import { HelpCircle, ArrowUpDown, Filter, X, ExternalLink } from "lucide-react";
import { useHelp } from "@/context/HelpContext";
import { ConsoleTour } from "./dj-ui/ConsoleTour";
import Image from "next/image";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { useHaptic } from "@/hooks/useHaptic";
import { Knob } from "./dj-ui/Knob";
import { DrawerAudioMeters } from "./dj-ui/DrawerAudioMeters";
import { useMixRecorder } from "@/hooks/useMixRecorder";
import { useVoiceTag } from "@/hooks/useVoiceTag";
import { VoiceTagPanel } from "./VoiceTagPanel";
import { MicInput } from "./MicInput";
import { OverlayShell } from "./ui/OverlayShell";

// Distortion scaling controls for WaveShaper intensity
const DISTORTION_SCALE = 400;
const DISTORTION_DEFAULT_K = 0; // Clean fallback when drive is invalid
// WaveShaper curve shape (matches common MDN example)
const DISTORTION_CURVE_BASE = 3;
const DISTORTION_CURVE_MULTIPLIER = 20;
const DISTORTION_CURVE_SAMPLES = 44100;
// Safety cap for feedback loop stability
const FX_DELAY_FEEDBACK_MAX = 0.9;

// Helper function to check if coverArt is an image path
const isImagePath = (coverArt: string): boolean => {
  return coverArt.startsWith("/");
};

// Track-specific settings interface
interface TrackSettings {
  volume: number; // 0-100, default 100
  loop: boolean; // default false
  fxPreset: {
    filter: number; // 0-1
    delay: number; // 0-1
    reverb: number; // 0-1
  };
}

export function DJInterface() {
  const { isHelpMode, toggleHelp, triggerTour } = useHelp();
  const triggerHaptic = useHaptic();
  const pathname = usePathname();

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
  const [crossfaderCurve, setCrossfaderCurve] = useState<"linear" | "sharp" | "smooth">("smooth");

  // Active deck for FX control
  const [activeDeck, setActiveDeck] = useState<"A" | "B">("A");

  // FX state for Deck A
  const [filterFreqA, setFilterFreqA] = useState(1000);
  const [filterTypeA, setFilterTypeA] = useState<"lowpass" | "highpass" | "bandpass">("lowpass");
  const [reverbDryWetA, setReverbDryWetA] = useState(0);
  const [delayTimeA, setDelayTimeA] = useState(0);
  const [delayFeedbackA, setDelayFeedbackA] = useState(0);
  const [distortionAmountA, setDistortionAmountA] = useState(0);

  // FX bypass state for Deck A
  const [filterBypassA, setFilterBypassA] = useState(false);
  const [reverbBypassA, setReverbBypassA] = useState(false);
  const [delayBypassA, setDelayBypassA] = useState(false);
  const [distortionBypassA, setDistortionBypassA] = useState(false);

  // FX state for Deck B
  const [filterFreqB, setFilterFreqB] = useState(1000);
  const [filterTypeB, setFilterTypeB] = useState<"lowpass" | "highpass" | "bandpass">("lowpass");
  const [reverbDryWetB, setReverbDryWetB] = useState(0);
  const [delayTimeB, setDelayTimeB] = useState(0);
  const [delayFeedbackB, setDelayFeedbackB] = useState(0);
  const [distortionAmountB, setDistortionAmountB] = useState(0);

  // FX bypass state for Deck B
  const [filterBypassB, setFilterBypassB] = useState(false);
  const [reverbBypassB, setReverbBypassB] = useState(false);
  const [delayBypassB, setDelayBypassB] = useState(false);
  const [distortionBypassB, setDistortionBypassB] = useState(false);

  // Clear All FX handlers
  const handleClearAllFXA = () => {
    setFilterFreqA(1000);
    setFilterTypeA("lowpass");
    setReverbDryWetA(0);
    setDelayTimeA(0);
    setDelayFeedbackA(0);
    setDistortionAmountA(0);
  };

  const handleClearAllFXB = () => {
    setFilterFreqB(1000);
    setFilterTypeB("lowpass");
    setReverbDryWetB(0);
    setDelayTimeB(0);
    setDelayFeedbackB(0);
    setDistortionAmountB(0);
  };

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
  const masterLimiterRef = useRef<DynamicsCompressorNode | null>(null);
  const vuAnalyserLeftRef = useRef<AnalyserNode | null>(null);
  const vuAnalyserRightRef = useRef<AnalyserNode | null>(null);
  const [limiterThreshold, setLimiterThreshold] = useState(-3); // dB threshold

  // Recording hook - records from limiter output (post-master FX, what listener hears)
  const mixRecorder = useMixRecorder(
    audioContextRef.current,
    masterLimiterRef.current
  );

  // Voice tag hook - records and plays voice tags from microphone
  const voiceTag = useVoiceTag(
    audioContextRef.current,
    masterGainRef.current
  );

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

    // Create master limiter (DynamicsCompressorNode) to prevent clipping
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3; // dB
    limiter.knee.value = 0; // Hard knee
    limiter.ratio.value = 20; // High ratio for limiting
    limiter.attack.value = 0.003; // Fast attack (3ms)
    limiter.release.value = 0.1; // Fast release (100ms)
    masterLimiterRef.current = limiter;

    // Create analyser for master level meter
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Create stereo analysers for VU meters
    const vuAnalyserLeft = ctx.createAnalyser();
    vuAnalyserLeft.fftSize = 256;
    vuAnalyserLeftRef.current = vuAnalyserLeft;

    const vuAnalyserRight = ctx.createAnalyser();
    vuAnalyserRight.fftSize = 256;
    vuAnalyserRightRef.current = vuAnalyserRight;

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
    // Connect: masterGain -> limiter -> analyser -> destination
    // Recording is handled by useMixRecorder hook (connects to limiter output)
    masterGain.connect(limiter);
    limiter.connect(analyser);
    // Connect VU analysers (for stereo metering, using same signal for both channels)
    limiter.connect(vuAnalyserLeft);
    limiter.connect(vuAnalyserRight);
    analyser.connect(ctx.destination);

    return () => {
      // Cleanup ONLY on unmount
      if (audioContextRef.current) {
        try {
          audioContextRef.current.suspend();
          audioContextRef.current.close();
        } catch (error) {
          // Ignore errors if context is already closed
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn("Error closing audio context:", error);
          }
        }
      }
    };
  }, []); // <--- EMPTY DEPENDENCY ARRAY (Crucial!)

  // 2. VOLUME UPDATES
  // Calculate crossfader curve
  const calculateCrossfaderGain = useCallback((value: number, curve: "linear" | "sharp" | "smooth"): number => {
    switch (curve) {
      case "linear":
        return value;
      case "sharp":
        // Exponential curve for sharp transitions
        return Math.pow(value, 3);
      case "smooth":
        // Equal power (cosine) curve for smooth transitions
        return Math.cos((1 - value) * 0.5 * Math.PI);
      default:
        return value;
    }
  }, []);

  useEffect(() => {
    if (deckAGainRef.current) {
      // Calculate gain based on curve type
      const gainA = calculateCrossfaderGain(1 - crossfader, crossfaderCurve);
      deckAGainRef.current.gain.value = deckAVolume * gainA;
    }
  }, [deckAVolume, crossfader, crossfaderCurve, calculateCrossfaderGain]);

  useEffect(() => {
    if (deckBGainRef.current) {
      // Calculate gain based on curve type
      const gainB = calculateCrossfaderGain(crossfader, crossfaderCurve);
      deckBGainRef.current.gain.value = deckBVolume * gainB;
    }
  }, [deckBVolume, crossfader, crossfaderCurve, calculateCrossfaderGain]);

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

  // Update limiter threshold
  useEffect(() => {
    if (masterLimiterRef.current) {
      masterLimiterRef.current.threshold.value = limiterThreshold;
    }
  }, [limiterThreshold]);

  // 4. EQ FILTER UPDATES (with kill switches)
  useEffect(() => {
    if (deckAFiltersRef.current) {
      // Apply kill switches: if kill is enabled, set gain to -100dB (effectively silent)
      deckAFiltersRef.current.high.gain.value = deckAKillHigh ? -100 : deckAHigh;
      deckAFiltersRef.current.mid.gain.value = deckAKillMid ? -100 : deckAMid;
      deckAFiltersRef.current.low.gain.value = deckAKillLow ? -100 : deckALow;
    }
  }, [deckAHigh, deckAMid, deckALow, deckAKillHigh, deckAKillMid, deckAKillLow]);

  useEffect(() => {
    if (deckBFiltersRef.current) {
      // Apply kill switches: if kill is enabled, set gain to -100dB (effectively silent)
      deckBFiltersRef.current.high.gain.value = deckBKillHigh ? -100 : deckBHigh;
      deckBFiltersRef.current.mid.gain.value = deckBKillMid ? -100 : deckBMid;
      deckBFiltersRef.current.low.gain.value = deckBKillLow ? -100 : deckBLow;
    }
  }, [deckBHigh, deckBMid, deckBLow, deckBKillHigh, deckBKillMid, deckBKillLow]);

  // Drag and drop state
  const [draggedTrack, setDraggedTrack] = useState<typeof tracks[0] | null>(null);
  const [dragOverDeck, setDragOverDeck] = useState<"A" | "B" | null>(null);

  // Track drawer state
  const [selectedTrack, setSelectedTrack] = useState<typeof tracks[0] | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Track-specific settings (per-track UI state)
  const [trackSettings, setTrackSettings] = useState<Map<string, TrackSettings>>(new Map());

  // Get or create default settings for a track
  const getTrackSettings = useCallback((trackId: string): TrackSettings => {
    if (!trackSettings.has(trackId)) {
      const defaultSettings: TrackSettings = {
        volume: 100,
        loop: false,
        fxPreset: {
          filter: 0,
          delay: 0,
          reverb: 0,
        },
      };
      setTrackSettings((prev) => new Map(prev).set(trackId, defaultSettings));
      return defaultSettings;
    }
    return trackSettings.get(trackId)!;
  }, [trackSettings]);

  // Update track settings
  const updateTrackSettings = useCallback((trackId: string, updates: Partial<TrackSettings>) => {
    setTrackSettings((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(trackId) || {
        volume: 100,
        loop: false,
        fxPreset: { filter: 0, delay: 0, reverb: 0 },
      };
      newMap.set(trackId, { ...current, ...updates });
      return newMap;
    });
  }, []);

  // Artwork lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Recording handlers (using hook)
  const handleStartRecording = useCallback(async () => {
    await mixRecorder.start();
  }, [mixRecorder]);

  const handleStopRecording = useCallback(async () => {
    await mixRecorder.stop();
  }, [mixRecorder]);

  const handleDownloadRecording = useCallback(() => {
    if (mixRecorder.recordingUrl) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const a = document.createElement("a");
      a.href = mixRecorder.recordingUrl;
      a.download = `piko-mix-${timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [mixRecorder.recordingUrl]);

  // Voice tag handlers
  const handleDownloadTag = useCallback(() => {
    if (voiceTag.tagUrl && voiceTag.tagBlob) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const extension = voiceTag.tagBlob.type.includes("mp4") ? "mp4" : "webm";
      const a = document.createElement("a");
      a.href = voiceTag.tagUrl;
      a.download = `piko-voice-tag-${timestamp}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [voiceTag.tagUrl, voiceTag.tagBlob]);

  const [tagVolume, setTagVolume] = useState(0.7);
  const handleTagVolumeChange = useCallback((v: number) => {
    setTagVolume(v);
    voiceTag.setTagVolume(v);
  }, [voiceTag]);

  // Cleanup recording on route change
  useEffect(() => {
    return () => {
      // Hook handles cleanup, but ensure we stop if recording
      if (mixRecorder.isRecording) {
        mixRecorder.stop();
      }
    };
  }, [pathname, mixRecorder]);

  // Close lightbox on route change to prevent overlays persisting
  useEffect(() => {
    if (isLightboxOpen) {
      setIsLightboxOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only depend on pathname to avoid infinite loops

  // ESC key handling is now done by OverlayShell

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "artist" | "vibe">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [vibeFilter, setVibeFilter] = useState<"all" | "chill" | "hype" | "storytelling" | "classic">("all");

  // Mobile landscape hint state
  const [showLandscapeHint, setShowLandscapeHint] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before accessing window
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Memoize audio tracks filtering and sorting for performance
  const audioTracks = useMemo(() => {
    return tracks
      .filter((t) => t.type === "audio")
      .filter((t) =>
        debouncedSearchQuery === "" ||
        t.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      .filter((t) => vibeFilter === "all" || t.vibe === vibeFilter)
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "artist":
            comparison = a.artist.localeCompare(b.artist);
            break;
          case "vibe":
            comparison = a.vibe.localeCompare(b.vibe);
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [debouncedSearchQuery, vibeFilter, sortBy, sortOrder]);

  // Memoize track loading handlers to prevent unnecessary re-renders
  const loadTrackToDeckA = useCallback((track: typeof tracks[0]) => {
    if (track.type === "audio") {
      setDeckAData(track);
      setDeckAPlaying(false);
    }
  }, []);

  const loadTrackToDeckB = useCallback((track: typeof tracks[0]) => {
    if (track.type === "audio") {
      setDeckBData(track);
      setDeckBPlaying(false);
    }
  }, []);

  // Handle sync - syncs the other deck to this deck's speed
  const handleDeckASync = useCallback(() => {
    if (deckARef.current && deckBRef.current) {
      const deckARate = deckARef.current.getPlaybackRate();
      deckBRef.current.setPlaybackRate(deckARate);
      setDeckBSpeed(deckARate);
      setDeckBSynced(true);
      setDeckASynced(false);
    }
  }, []);

  const handleDeckBSync = useCallback(() => {
    if (deckARef.current && deckBRef.current) {
      const deckBRate = deckBRef.current.getPlaybackRate();
      deckARef.current.setPlaybackRate(deckBRate);
      setDeckASpeed(deckBRate);
      setDeckASynced(true);
      setDeckBSynced(false);
    }
  }, []);

  // Handle speed changes
  const handleDeckASpeedChange = useCallback((speed: number) => {
    setDeckASpeed(speed);
    if (deckASynced && deckBRef.current) {
      deckBRef.current.setPlaybackRate(speed);
      setDeckBSpeed(speed);
    }
    if (deckBSynced) {
      setDeckBSynced(false);
    }
  }, [deckASynced, deckBSynced]);

  const handleDeckBSpeedChange = useCallback((speed: number) => {
    setDeckBSpeed(speed);
    if (deckBSynced && deckARef.current) {
      deckARef.current.setPlaybackRate(speed);
      setDeckASpeed(speed);
    }
    if (deckASynced) {
      setDeckASynced(false);
    }
  }, [deckBSynced, deckASynced]);

  // Memoize drag handlers for better performance
  const handleDragStart = useCallback((track: typeof tracks[0]) => (e: React.DragEvent) => {
    if (!isMounted) return;
    setDraggedTrack(track);
    e.dataTransfer.setData("track", JSON.stringify(track));
    e.dataTransfer.effectAllowed = "move";
    // Create a custom drag image with cover art
    const dragImage = document.createElement("div");
    dragImage.style.width = "120px";
    dragImage.style.height = "120px";
    dragImage.style.borderRadius = "8px";
    dragImage.style.overflow = "hidden";
    dragImage.style.border = "2px solid #00ff00";
    dragImage.style.transform = "rotate(5deg)";
    dragImage.style.opacity = "0.9";
    dragImage.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.5)";
    dragImage.style.background = "#1a1a1a";
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";

    // Add cover art to drag image
    if (isImagePath(track.coverArt)) {
      const img = document.createElement("img");
      img.src = track.coverArt;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      dragImage.appendChild(img);
    } else {
      // Gradient fallback
      const gradientParts = track.coverArt.replace("from-", "").replace("to-", "").split("-to-");
      if (gradientParts.length === 2) {
        dragImage.style.background = `linear-gradient(to right, var(--tw-gradient-stops))`;
      } else {
        dragImage.style.background = "#1a1a1a";
      }
    }

    // Add track title overlay
    const titleOverlay = document.createElement("div");
    titleOverlay.style.position = "absolute";
    titleOverlay.style.bottom = "0";
    titleOverlay.style.left = "0";
    titleOverlay.style.right = "0";
    titleOverlay.style.background = "linear-gradient(to top, rgba(0,0,0,0.8), transparent)";
    titleOverlay.style.padding = "8px";
    titleOverlay.style.fontSize = "10px";
    titleOverlay.style.fontWeight = "bold";
    titleOverlay.style.color = "#fff";
    titleOverlay.style.textTransform = "uppercase";
    titleOverlay.style.textAlign = "center";
    titleOverlay.style.whiteSpace = "nowrap";
    titleOverlay.style.overflow = "hidden";
    titleOverlay.style.textOverflow = "ellipsis";
    titleOverlay.textContent = track.title;
    dragImage.appendChild(titleOverlay);

    document.body.appendChild(dragImage);

    // Set drag image offset to center
    const offsetX = 60; // Half of drag image width
    const offsetY = 60; // Half of drag image height
    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  }, [isMounted]);

  const handleDragEnd = useCallback(() => {
    setDraggedTrack(null);
    setDragOverDeck(null);
  }, []);

  const handleDeckADragOver = useCallback((e: React.DragEvent) => {
    if (!isMounted) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDeck("A");
    const dropZone = document.getElementById("deck-a-drop-zone");
    if (dropZone) dropZone.style.opacity = "1";
  }, [isMounted]);

  const handleDeckADragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDeck(null);
      const dropZone = document.getElementById("deck-a-drop-zone");
      if (dropZone) dropZone.style.opacity = "0";
    }
  }, []);

  const handleDeckADrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeck(null);
    setDraggedTrack(null);
    const dropZone = document.getElementById("deck-a-drop-zone");
    if (dropZone) dropZone.style.opacity = "0";
    try {
      const trackData = e.dataTransfer.getData("track");
      if (trackData) {
        const track = JSON.parse(trackData);
        loadTrackToDeckA(track);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error loading track:", error);
      }
    }
  }, [loadTrackToDeckA]);

  const handleDeckBDragOver = useCallback((e: React.DragEvent) => {
    if (!isMounted) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDeck("B");
    const dropZone = document.getElementById("deck-b-drop-zone");
    if (dropZone) dropZone.style.opacity = "1";
  }, [isMounted]);

  const handleDeckBDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDeck(null);
      const dropZone = document.getElementById("deck-b-drop-zone");
      if (dropZone) dropZone.style.opacity = "0";
    }
  }, []);

  const handleDeckBDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeck(null);
    setDraggedTrack(null);
    const dropZone = document.getElementById("deck-b-drop-zone");
    if (dropZone) dropZone.style.opacity = "0";
    try {
      const trackData = e.dataTransfer.getData("track");
      if (trackData) {
        const track = JSON.parse(trackData);
        loadTrackToDeckB(track);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error loading track:", error);
      }
    }
  }, [loadTrackToDeckB]);

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
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search tracks"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white placeholder-gray-500 font-barlow text-sm focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-[#00ff00] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff00] focus-visible:ring-offset-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Vibe Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={vibeFilter}
                  onChange={(e) => setVibeFilter(e.target.value as typeof vibeFilter)}
                  className="px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white font-barlow text-xs focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-[#00ff00] transition-colors"
                  aria-label="Filter by vibe"
                >
                  <option value="all">All Vibes</option>
                  <option value="chill">Chill</option>
                  <option value="hype">Hype</option>
                  <option value="storytelling">Storytelling</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white font-barlow text-xs focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-[#00ff00] transition-colors"
                  aria-label="Sort by"
                >
                  <option value="title">Title</option>
                  <option value="artist">Artist</option>
                  <option value="vibe">Vibe</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-2 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white font-barlow text-xs hover:border-gray-600 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff00] focus-visible:ring-offset-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                  title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 max-h-60 md:max-h-80 overflow-y-auto scrollbar-hide">
            {audioTracks.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 font-barlow py-8">
                No tracks found
              </div>
            ) : (
              audioTracks.map((track) => (
                <motion.div
                  key={track.id}
                  draggable={isMounted}
                  onDragStart={(e) => {
                    const dragEvent = e as unknown as React.DragEvent;
                    handleDragStart(track)(dragEvent);
                  }}
                  onDragEnd={() => {
                    handleDragEnd();
                  }}
                  onClick={(e) => {
                    // Only open drawer if clicking the card body, not A/B buttons
                    if ((e.target as HTMLElement).closest('button') === null) {
                      triggerHaptic();
                      setSelectedTrack(track);
                      setIsDrawerOpen(true);
                    }
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileFocus={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`group relative flex flex-col gap-2.5 p-2.5 bg-[#1a1a1a] rounded-lg border transition-all cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-[#00ff00] focus-within:ring-offset-2 focus-within:ring-offset-[#0a0a0a] ${
                    draggedTrack?.id === track.id
                      ? "opacity-50 scale-95 border-[#00ff00] cursor-grabbing"
                      : "border-gray-800 hover:border-gray-600 hover:shadow-[0_0_12px_rgba(0,255,0,0.15)]"
                  }`}
                  style={{ cursor: draggedTrack?.id === track.id ? 'grabbing' : 'pointer' }}
                  tabIndex={0}
                >
                  {/* Cover Art Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden rounded bg-[#0a0a0a]">
                    {isImagePath(track.coverArt) ? (
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
                    )}
                  </div>

                  {/* Track Title */}
                  <div className="text-xs font-barlow uppercase text-gray-400 truncate px-0.5" title={track.title}>
                    {track.title}
                  </div>

                  {/* Hover/Focus Reveal Panel */}
                  <div className="absolute inset-0 bg-[#1a1a1a]/95 backdrop-blur-sm rounded-lg border border-gray-700 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                    <div className="flex flex-col gap-1">
                      {/* Artist Name */}
                      <div className="text-[10px] font-barlow text-gray-300 truncate" title={track.artist}>
                        {track.artist}
                      </div>

                      {/* Track Length (placeholder - not in data) */}
                      <div className="text-[9px] font-barlow text-gray-500">
                        —
                      </div>
                    </div>

                    {/* External Link Button */}
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(track.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic();
                      }}
                      className="self-end p-2 rounded bg-[#2a2a2a] hover:bg-[#00ff00] text-gray-400 hover:text-black transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                      aria-label={`Open external link for ${track.title}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* A/B Load Buttons */}
                  <div className="flex gap-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic();
                        loadTrackToDeckA(track);
                      }}
                      aria-label={`Load ${track.title} to Deck A`}
                      className="flex-1 px-2 py-1.5 text-xs font-barlow uppercase bg-[#2a2a2a] hover:bg-[#00d9ff] text-gray-400 hover:text-white rounded transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] min-h-[44px] active:scale-95"
                    >
                      A
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic();
                        loadTrackToDeckB(track);
                      }}
                      aria-label={`Load ${track.title} to Deck B`}
                      className="flex-1 px-2 py-1.5 text-xs font-barlow uppercase bg-[#2a2a2a] hover:bg-[#ff00d9] text-gray-400 hover:text-white rounded transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00d9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] min-h-[44px] active:scale-95"
                    >
                      B
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          <div className="mt-2 text-xs font-barlow text-gray-500 text-center">
            {audioTracks.length} track{audioTracks.length !== 1 ? "s" : ""}
            {vibeFilter !== "all" && ` • Filtered: ${vibeFilter}`}
            {debouncedSearchQuery && ` • Searching: "${debouncedSearchQuery}"`}
            {" • Drag tracks to decks or click A/B buttons"}
          </div>
        </div>

        {/* Track Drawer */}
        <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300" />
            <Drawer.Content
              className="border-t-2 border-[#00ff00] flex flex-col rounded-t-[10px] h-[85vh] md:h-[70vh] mt-24 fixed bottom-0 left-0 right-0 z-50 focus:outline-none bg-[#0a0a0a] transition-transform duration-300 ease-out"
              style={{
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
              {/* Drag Handle */}
              <div className="relative w-12 h-1.5 mx-auto mb-6 mt-4">
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #00ff00 0%, #00ff00 25%, #000 25%, #000 50%, #00ff00 50%, #00ff00 75%, #000 75%, #000 100%)",
                    boxShadow: "0 0 8px rgba(0, 255, 0, 0.5)",
                  }}
                />
              </div>

              {selectedTrack && (() => {
                const settings = getTrackSettings(selectedTrack.id);
                return (
                  <div className="flex-1 overflow-y-auto px-6 pb-8">
                    {/* Draggable Track Header (Cover + Title + Artist) */}
                    <div
                      draggable={isMounted && selectedTrack.type === "audio"}
                      onDragStart={(e) => {
                        if (selectedTrack.type === "audio") {
                          handleDragStart(selectedTrack)(e as unknown as React.DragEvent);
                        }
                      }}
                      onDragEnd={handleDragEnd}
                      className={`mb-6 cursor-grab active:cursor-grabbing transition-all ${
                        draggedTrack?.id === selectedTrack.id ? "opacity-50" : ""
                      }`}
                    >
                      {/* Large Cover Art - Clickable for Lightbox */}
                      <div
                        className="relative aspect-square w-full max-w-sm mx-auto mb-4 rounded-lg overflow-hidden border-2 border-gray-800 cursor-pointer hover:border-[#00ff00] transition-colors"
                        onClick={() => {
                          // Only open lightbox if not dragging
                          if (!draggedTrack && isImagePath(selectedTrack.coverArt)) {
                            triggerHaptic();
                            setIsLightboxOpen(true);
                          }
                        }}
                        role={isImagePath(selectedTrack.coverArt) ? "button" : undefined}
                        tabIndex={isImagePath(selectedTrack.coverArt) ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (isImagePath(selectedTrack.coverArt) && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            triggerHaptic();
                            setIsLightboxOpen(true);
                          }
                        }}
                        aria-label={isImagePath(selectedTrack.coverArt) ? "Click to view full-size artwork" : undefined}
                      >
                        {isImagePath(selectedTrack.coverArt) ? (
                          <>
                            <Image
                              src={selectedTrack.coverArt}
                              alt={selectedTrack.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 400px"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="opacity-0 hover:opacity-100 transition-opacity text-white text-sm font-barlow uppercase tracking-wider">
                                Click to Zoom
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-r ${selectedTrack.coverArt}`} />
                        )}
                      </div>

                      {/* Track Title */}
                      <h2 className="font-barlow text-2xl md:text-3xl font-bold text-white mb-2 text-center uppercase tracking-wider px-4">
                        {selectedTrack.title}
                      </h2>

                      {/* Artist */}
                      <p className="font-barlow uppercase tracking-wider text-base md:text-lg text-gray-400 mb-8 text-center px-4">
                        {selectedTrack.artist}
                      </p>

                      {/* Drag Hint */}
                      {isMounted && selectedTrack.type === "audio" && (
                        <p className="text-xs font-barlow text-gray-500 text-center mt-2">
                          Drag to Deck A or B
                        </p>
                      )}
                    </div>

                    {/* Track-Specific Controls */}
                    <div className="max-w-2xl mx-auto space-y-4 mb-8">
                      {/* Track Volume */}
                      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-barlow uppercase text-gray-300 tracking-wider">
                            Track Volume
                          </label>
                          <span className="text-sm font-barlow text-[#00ff00] font-bold">
                            {Math.round(settings.volume)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={settings.volume}
                              onChange={(e) => {
                                updateTrackSettings(selectedTrack.id, {
                                  volume: parseInt(e.target.value, 10),
                                });
                              }}
                              className="w-full h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-[#00ff00]"
                              style={{
                                background: `linear-gradient(to right, #00ff00 0%, #00ff00 ${settings.volume}%, #0a0a0a ${settings.volume}%, #0a0a0a 100%)`,
                              }}
                              aria-label="Track volume"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Loop Toggle */}
                      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-barlow uppercase text-gray-300 tracking-wider">
                            Loop
                          </label>
                          <button
                            onClick={() => {
                              triggerHaptic();
                              updateTrackSettings(selectedTrack.id, {
                                loop: !settings.loop,
                              });
                            }}
                            className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff00] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                              settings.loop ? "bg-[#00ff00]" : "bg-gray-700"
                            }`}
                            aria-label={settings.loop ? "Disable loop" : "Enable loop"}
                          >
                            <motion.div
                              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                              animate={{
                                x: settings.loop ? 28 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Audio Levels */}
                      <DrawerAudioMeters analyser={analyserRef.current} />

                      {/* Track FX Preset */}
                      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4">
                        <div className="mb-3">
                          <label className="text-sm font-barlow uppercase text-gray-300 tracking-wider">
                            Track FX Preset
                          </label>
                          <p className="text-xs font-barlow text-gray-500 mt-1">
                            Applies when loaded to a deck
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <Knob
                              value={settings.fxPreset.filter}
                              onChange={(value) => {
                                updateTrackSettings(selectedTrack.id, {
                                  fxPreset: {
                                    ...settings.fxPreset,
                                    filter: value,
                                  },
                                });
                              }}
                              label="FILTER"
                              min={0}
                              max={1}
                              size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <Knob
                              value={settings.fxPreset.delay}
                              onChange={(value) => {
                                updateTrackSettings(selectedTrack.id, {
                                  fxPreset: {
                                    ...settings.fxPreset,
                                    delay: value,
                                  },
                                });
                              }}
                              label="DELAY"
                              min={0}
                              max={1}
                              size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <Knob
                              value={settings.fxPreset.reverb}
                              onChange={(value) => {
                                updateTrackSettings(selectedTrack.id, {
                                  fxPreset: {
                                    ...settings.fxPreset,
                                    reverb: value,
                                  },
                                });
                              }}
                              label="REVERB"
                              min={0}
                              max={1}
                              size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Action Buttons */}
                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Load to Deck A Button */}
                    <Drawer.Close asChild>
                      <button
                        onClick={() => {
                          triggerHaptic();
                          loadTrackToDeckA(selectedTrack);
                        }}
                        className="w-full px-6 py-4 bg-[#00d9ff] text-black font-barlow font-bold text-lg uppercase tracking-wider rounded-lg border-2 border-[#00d9ff] shadow-[0_0_20px_rgba(0,217,255,0.3)] flex items-center justify-center gap-3 hover:bg-[#00d9ff]/90 hover:shadow-[0_0_25px_rgba(0,217,255,0.4)] transition-all duration-200 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] active:scale-95"
                        aria-label={`Load ${selectedTrack.title} to Deck A`}
                      >
                        Load to Deck A
                      </button>
                    </Drawer.Close>

                    {/* Load to Deck B Button */}
                    <Drawer.Close asChild>
                      <button
                        onClick={() => {
                          triggerHaptic();
                          loadTrackToDeckB(selectedTrack);
                        }}
                        className="w-full px-6 py-4 bg-[#ff00d9] text-black font-barlow font-bold text-lg uppercase tracking-wider rounded-lg border-2 border-[#ff00d9] shadow-[0_0_20px_rgba(255,0,217,0.3)] flex items-center justify-center gap-3 hover:bg-[#ff00d9]/90 hover:shadow-[0_0_25px_rgba(255,0,217,0.4)] transition-all duration-200 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00d9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] active:scale-95"
                        aria-label={`Load ${selectedTrack.title} to Deck B`}
                      >
                        Load to Deck B
                      </button>
                    </Drawer.Close>

                    {/* External Link Button */}
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(selectedTrack.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => triggerHaptic()}
                      className="w-full px-6 py-4 bg-[#2a2a2a] text-white font-barlow font-bold text-lg uppercase tracking-wider rounded-lg border-2 border-gray-700 flex items-center justify-center gap-3 hover:bg-[#1a1a1a] hover:border-gray-600 transition-all duration-200 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] active:scale-95"
                      aria-label={`Open external link for ${selectedTrack.title}`}
                    >
                      <ExternalLink className="w-5 h-5" />
                      Stream on Spotify
                    </a>
                  </div>
                  </div>
                );
              })()}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Artwork Lightbox */}
        <OverlayShell
          open={isLightboxOpen && selectedTrack !== null && isImagePath(selectedTrack?.coverArt || "")}
          onClose={() => {
            triggerHaptic();
            setIsLightboxOpen(false);
          }}
          z="modal"
          backdropClassName="backdrop-blur-sm"
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              setIsLightboxOpen(false);
            }}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff00] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Container */}
          {selectedTrack && isImagePath(selectedTrack.coverArt) && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-[min(92vw,900px)] max-h-[70vh] md:max-h-[80vh] w-full"
            >
              <div className="relative w-full h-full">
                <Image
                  src={selectedTrack.coverArt}
                  alt={selectedTrack.title}
                  fill
                  className="object-contain rounded-lg shadow-2xl border border-gray-800"
                  sizes="(max-width: 768px) 92vw, 900px"
                  priority
                />
              </div>
              {/* Caption */}
              <div className="mt-4 text-center">
                <p className="text-white font-barlow text-lg md:text-xl uppercase tracking-wider">
                  {selectedTrack.title}
                </p>
                {selectedTrack.artist && (
                  <p className="text-gray-400 font-barlow text-sm md:text-base mt-1">
                    {selectedTrack.artist}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </OverlayShell>

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
          // Clear All handlers
          onClearAllA={handleClearAllFXA}
          onClearAllB={handleClearAllFXB}
          // Bypass states
          filterBypassA={filterBypassA}
          filterBypassB={filterBypassB}
          reverbBypassA={reverbBypassA}
          reverbBypassB={reverbBypassB}
          delayBypassA={delayBypassA}
          delayBypassB={delayBypassB}
          distortionBypassA={distortionBypassA}
          distortionBypassB={distortionBypassB}
          onFilterBypassChangeA={(bypass) => {
            setFilterBypassA(bypass);
            if (bypass) setFilterFreqA(1000); // Reset to neutral
          }}
          onFilterBypassChangeB={(bypass) => {
            setFilterBypassB(bypass);
            if (bypass) setFilterFreqB(1000); // Reset to neutral
          }}
          onReverbBypassChangeA={(bypass) => {
            setReverbBypassA(bypass);
            if (bypass) setReverbDryWetA(0);
          }}
          onReverbBypassChangeB={(bypass) => {
            setReverbBypassB(bypass);
            if (bypass) setReverbDryWetB(0);
          }}
          onDelayBypassChangeA={(bypass) => {
            setDelayBypassA(bypass);
            if (bypass) {
              setDelayTimeA(0);
              setDelayFeedbackA(0);
            }
          }}
          onDelayBypassChangeB={(bypass) => {
            setDelayBypassB(bypass);
            if (bypass) {
              setDelayTimeB(0);
              setDelayFeedbackB(0);
            }
          }}
          onDistortionBypassChangeA={(bypass) => {
            setDistortionBypassA(bypass);
            if (bypass) setDistortionAmountA(0);
          }}
          onDistortionBypassChangeB={(bypass) => {
            setDistortionBypassB(bypass);
            if (bypass) setDistortionAmountB(0);
          }}
        />
        </div>

        {/* Main Console */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Deck A */}
          <div
            data-tour="deck-a"
            onDragOver={handleDeckADragOver}
            onDragLeave={handleDeckADragLeave}
            onDrop={handleDeckADrop}
            className={`relative transition-all ${
              dragOverDeck === "A" ? "scale-105" : ""
            }`}
          >
            <DJDeck
              ref={deckARef}
              trackUrl={deckAData?.src || null}
              isPlaying={deckAPlaying}
              speed={deckASpeed}
              deckColor="#00d9ff"
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
            {/* Enhanced Drop indicator */}
            <div
              className="absolute inset-0 border-2 border-dashed border-[#00d9ff] rounded-lg pointer-events-none opacity-0 transition-all bg-[#00d9ff]/10 backdrop-blur-sm"
              id="deck-a-drop-zone"
              style={{
                boxShadow: dragOverDeck === "A" ? "0 0 20px rgba(0, 217, 255, 0.5)" : "none",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[#00d9ff] font-barlow uppercase text-sm font-bold">
                  DROP TO DECK A
                </div>
              </div>
            </div>
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
            crossfaderCurve={crossfaderCurve}
            onCrossfaderCurveChange={setCrossfaderCurve}
            audioContext={audioContextRef.current || undefined}
            masterGainNode={masterGainRef.current || undefined}
            vuAnalyserLeft={vuAnalyserLeftRef.current || undefined}
            vuAnalyserRight={vuAnalyserRightRef.current || undefined}
            isRecording={mixRecorder.isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onDownloadRecording={handleDownloadRecording}
            hasRecording={mixRecorder.recordingUrl !== null}
            recordingDuration={mixRecorder.recordingDuration}
            recordingError={mixRecorder.error}
            onClearRecording={mixRecorder.clear}
            limiterThreshold={limiterThreshold}
            onLimiterThresholdChange={setLimiterThreshold}
          />
          </div>

          {/* Deck B */}
          <div
            onDragOver={handleDeckBDragOver}
            onDragLeave={handleDeckBDragLeave}
            onDrop={handleDeckBDrop}
            className={`relative transition-all ${
              dragOverDeck === "B" ? "scale-105" : ""
            }`}
          >
            <DJDeck
              ref={deckBRef}
              trackUrl={deckBData?.src || null}
              isPlaying={deckBPlaying}
              speed={deckBSpeed}
              deckColor="#ff00d9"
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
            {/* Enhanced Drop indicator */}
            <div
              className="absolute inset-0 border-2 border-dashed border-[#ff00d9] rounded-lg pointer-events-none opacity-0 transition-all bg-[#ff00d9]/10 backdrop-blur-sm"
              id="deck-b-drop-zone"
              style={{
                boxShadow: dragOverDeck === "B" ? "0 0 20px rgba(255, 0, 217, 0.5)" : "none",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[#ff00d9] font-barlow uppercase text-sm font-bold">
                  DROP TO DECK B
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mic Input - Monitor Only */}
        <div className="mt-4 md:mt-6">
          <MicInput
            audioContext={audioContextRef.current || undefined}
            masterGainNode={masterGainRef.current || undefined}
          />
        </div>

        {/* Voice Tag Panel - Moved outside grid */}
        <div className="mt-4 md:mt-6">
          <VoiceTagPanel
            micEnabled={voiceTag.micEnabled}
            isRecording={voiceTag.isRecording}
            tagUrl={voiceTag.tagUrl}
            tagDurationMs={voiceTag.tagDurationMs}
            level={voiceTag.level}
            error={voiceTag.error}
            tagVolume={tagVolume}
            onEnableMic={voiceTag.enableMic}
            onDisableMic={voiceTag.disableMic}
            onStartRecording={voiceTag.startTagRecording}
            onStopRecording={voiceTag.stopTagRecording}
            onPlayTag={voiceTag.playTag}
            onDownloadTag={handleDownloadTag}
            onClearTag={voiceTag.clearTag}
            onTagVolumeChange={handleTagVolumeChange}
          />
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
