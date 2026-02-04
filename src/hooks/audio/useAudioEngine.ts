"use client";

/**
 * useAudioEngine.ts - High-Performance Audio Engine for Studio V3
 *
 * Phase 1.1 Days 3-4: Migrating to DeckEngine architecture
 *
 * Uses Tone.js with Master Bus chain:
 * Channel -> CrossFade -> Compressor -> Limiter -> Destination
 *
 * Equal Power crossfade logic prevents volume dips during transitions
 */

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useStore } from '@/store/useStore';
import { useStudioStore } from '@/store/useStudioStore';
import { useEssentiaAnalysis } from '@/hooks/analysis/useEssentiaAnalysis';
import { calculateNewBpm } from '@/lib/utils/audioMath';
import { applyCrossfaderCurve, normalizeCrossfaderValue } from '@/audio/mixer/crossfaderCurves';
import { deriveTrackKey } from '@/lib/trackKey'; // Phase S11.2
import { DeckEngine } from '@/audio/engines/DeckEngine'; // Phase 1.1: Engine-first architecture

type PlaybackRateParam = Tone.Param<"number"> & {
  value?: number;
  cancelScheduledValues?: (time: number) => void;
  setValueAtTime?: (value: number, time: number) => void;
  exponentialRampToValueAtTime?: (value: number, time: number) => void;
  rampTo?: (value: number, time: number) => void;
};

type StemSource = string | AudioBuffer;
type StemSourceMap = {
  vocals: StemSource | null;
  drums: StemSource | null;
  bass: StemSource | null;
  other: StemSource | null;
};

export interface AudioEngineControls {
  init: () => Promise<void>;
  isReady: boolean;
  loadTrack: (deck: 'A' | 'B', url: string, bpm: number, skipAnalysis?: boolean) => Promise<void>;
  loadStems: (deck: 'A' | 'B', stems: StemSourceMap) => Promise<void>;
  play: (deck: 'A' | 'B') => void;
  pause: (deck: 'A' | 'B') => void;
  stop: (deck: 'A' | 'B') => void;
  seekTo: (deck: 'A' | 'B', timeInSeconds: number) => void;
  syncToBpm: (deck: 'A' | 'B') => void;
  triggerTapeStop: (deck: 'A' | 'B') => void;
  setMasterGain: (value: number) => void;
  setCrossfade: (value: number) => void; // -1 to 1
  getPlaybackPosition: (deck: 'A' | 'B') => number;
  setDeckVolume: (deck: 'A' | 'B', volume: number) => void;
  setDeckEQ: (deck: 'A' | 'B', eq: { low: number; mid: number; high: number }) => void;
  setDeckFilter: (deck: 'A' | 'B', position: number) => void;
  setDelayWetMix: (amount: number) => void;
  setDelayFeedbackAmount: (amount: number) => void;
  setReverbWetMix: (amount: number) => void;
  setReverbDecayTime: (seconds: number) => void;
  toggleStem: (deck: 'A' | 'B', stem: 'vocals' | 'drums' | 'bass' | 'other') => void;
  setStemMute: (deck: 'A' | 'B', stem: 'vocals' | 'drums' | 'bass' | 'other', isMuted: boolean) => void;
  getStemMuteState: (deck: 'A' | 'B') => { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
  getMasterBus: () => { bus: Tone.Gain | null; postFx: Tone.Gain | null };
  getRecorderStream: () => MediaStream | null;
  getDeckDuration: (deck: 'A' | 'B') => number;
  getTransportSeconds: () => number;
  getDeckChannel: (deck: 'A' | 'B') => Tone.Channel | null;
  getMasterChannel: () => Tone.Gain | null;
  // Phase S9: Loop Controls
  setLoopPoints: (deck: 'A' | 'B', startSec: number, endSec: number) => void;
  clearLoopPoints: (deck: 'A' | 'B') => void;
  enableLoop: (deck: 'A' | 'B', enabled: boolean) => void;
}

type StemGainNodes = {
  vocals: Tone.Gain | null;
  drums: Tone.Gain | null;
  bass: Tone.Gain | null;
  other: Tone.Gain | null;
};

type EngineState = {
  // Phase 1.1: DeckEngine instances
  deckEngines: { current: { A: DeckEngine | null; B: DeckEngine | null } };
  players: { current: { A: Tone.Player | null; B: Tone.Player | null } };
  stemPlayers: {
    current: {
      A: { vocals: Tone.Player | null; drums: Tone.Player | null; bass: Tone.Player | null; other: Tone.Player | null };
      B: { vocals: Tone.Player | null; drums: Tone.Player | null; bass: Tone.Player | null; other: Tone.Player | null };
    };
  };
  stemGains: { current: { A: StemGainNodes; B: StemGainNodes } }; // Phase 3.3B: Per-stem gain nodes for smooth ramping
  stemMutes: {
    current: {
      A: { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
      B: { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
    };
  };
  userMuteState: { // Phase 3.3B: Track user toggles separately from solo state
    current: {
      A: { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
      B: { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
    };
  };
  channels: { current: { A: Tone.Channel | null; B: Tone.Channel | null } };
  eqs: { current: { A: Tone.EQ3 | null; B: Tone.EQ3 | null } };
  filters: { current: { A: Tone.Filter | null; B: Tone.Filter | null } };
  pitchShift: { current: { A: Tone.PitchShift | null; B: Tone.PitchShift | null } };
  crossFade: { current: Tone.CrossFade | null };
  masterBus: { current: Tone.Gain | null };
  postFxBus: { current: Tone.Gain | null };
  fxMerge: { current: Tone.Gain | null };
  dryFxGain: { current: Tone.Gain | null };
  delayNode: { current: Tone.FeedbackDelay | null };
  delaySend: { current: Tone.Gain | null };
  delayFeedbackRef: { current: number };
  reverbNode: { current: Tone.Reverb | null };
  reverbSend: { current: Tone.Gain | null };
  reverbDecayRef: { current: number };
  compressor: { current: Tone.Compressor | null };
  limiter: { current: Tone.Limiter | null };
  recorderStream: { current: MediaStream | null };
  isInitialized: { current: boolean };
  isInitializing: { current: boolean };
  isReady: { current: boolean };
  failedTracks: { current: Set<string> };
  stemMuteFxEnabled: { current: boolean }; // Phase 3.3B: Optional echo tail on mutes
};

const createEngineState = (): EngineState => ({
  // Phase 1.1: DeckEngine instances
  deckEngines: { current: { A: null, B: null } },
  players: { current: { A: null, B: null } },
  stemPlayers: {
    current: {
      A: { vocals: null, drums: null, bass: null, other: null },
      B: { vocals: null, drums: null, bass: null, other: null },
    },
  },
  stemGains: {
    current: {
      A: { vocals: null, drums: null, bass: null, other: null },
      B: { vocals: null, drums: null, bass: null, other: null },
    },
  },
  stemMutes: {
    current: {
      A: { vocals: false, drums: false, bass: false, other: false },
      B: { vocals: false, drums: false, bass: false, other: false },
    },
  },
  userMuteState: {
    current: {
      A: { vocals: false, drums: false, bass: false, other: false },
      B: { vocals: false, drums: false, bass: false, other: false },
    },
  },
  channels: { current: { A: null, B: null } },
  eqs: { current: { A: null, B: null } },
  filters: { current: { A: null, B: null } },
  pitchShift: { current: { A: null, B: null } },
  crossFade: { current: null },
  masterBus: { current: null },
  postFxBus: { current: null },
  fxMerge: { current: null },
  dryFxGain: { current: null },
  delayNode: { current: null },
  delaySend: { current: null },
  delayFeedbackRef: { current: 0.35 },
  reverbNode: { current: null },
  reverbSend: { current: null },
  reverbDecayRef: { current: 2.8 },
  compressor: { current: null },
  limiter: { current: null },
  recorderStream: { current: null },
  isInitialized: { current: false },
  isInitializing: { current: false },
  isReady: { current: false },
  failedTracks: { current: new Set() },
  stemMuteFxEnabled: { current: true }, // Phase 3.3B: Enabled by default in pro mode
});

const engineSingletonRef: { current: EngineState | null } = { current: null };
const engineRefCount = { current: 0 };

const disposeEngine = (engine: EngineState) => {
  const playersToDispose = { ...engine.players.current };
  const channelsToDispose = { ...engine.channels.current };
  const eqsToDispose = { ...engine.eqs.current };
  const filtersToDispose = { ...engine.filters.current };
  const pitchShiftToDispose = { ...engine.pitchShift.current };
  const crossFadeToDispose = engine.crossFade.current;
  const masterBusToDispose = engine.masterBus.current;
  const postFxBusToDispose = engine.postFxBus.current;
  const fxMergeToDispose = engine.fxMerge.current;
  const dryFxGainToDispose = engine.dryFxGain.current;
  const delayNodeToDispose = engine.delayNode.current;
  const delaySendToDispose = engine.delaySend.current;
  const reverbNodeToDispose = engine.reverbNode.current;
  const reverbSendToDispose = engine.reverbSend.current;
  const compressorToDispose = engine.compressor.current;
  const limiterToDispose = engine.limiter.current;
  const stemPlayersToDispose = engine.stemPlayers.current;
  const stemGainsToDispose = engine.stemGains.current; // Phase 3.3B

  playersToDispose.A?.dispose();
  playersToDispose.B?.dispose();
  channelsToDispose.A?.dispose();
  channelsToDispose.B?.dispose();
  eqsToDispose.A?.dispose();
  eqsToDispose.B?.dispose();
  filtersToDispose.A?.dispose();
  filtersToDispose.B?.dispose();
  pitchShiftToDispose.A?.dispose();
  pitchShiftToDispose.B?.dispose();
  crossFadeToDispose?.dispose();
  masterBusToDispose?.dispose();
  postFxBusToDispose?.dispose();
  fxMergeToDispose?.dispose();
  dryFxGainToDispose?.dispose();
  delayNodeToDispose?.dispose();
  delaySendToDispose?.dispose();
  reverbNodeToDispose?.dispose();
  reverbSendToDispose?.dispose();
  compressorToDispose?.dispose();
  limiterToDispose?.dispose();
  Object.values(stemPlayersToDispose.A).forEach((player) => player?.dispose());
  Object.values(stemPlayersToDispose.B).forEach((player) => player?.dispose());
  // Phase 3.3B: Dispose stem gain nodes
  Object.values(stemGainsToDispose.A).forEach((gain) => gain?.dispose());
  Object.values(stemGainsToDispose.B).forEach((gain) => gain?.dispose());

  engine.players.current = { A: null, B: null };
  engine.stemPlayers.current = {
    A: { vocals: null, drums: null, bass: null, other: null },
    B: { vocals: null, drums: null, bass: null, other: null },
  };
  engine.stemGains.current = {
    A: { vocals: null, drums: null, bass: null, other: null },
    B: { vocals: null, drums: null, bass: null, other: null },
  };
  engine.stemMutes.current = {
    A: { vocals: false, drums: false, bass: false, other: false },
    B: { vocals: false, drums: false, bass: false, other: false },
  };
  engine.userMuteState.current = {
    A: { vocals: false, drums: false, bass: false, other: false },
    B: { vocals: false, drums: false, bass: false, other: false },
  };
  engine.channels.current = { A: null, B: null };
  engine.eqs.current = { A: null, B: null };
  engine.filters.current = { A: null, B: null };
  engine.pitchShift.current = { A: null, B: null };
  engine.crossFade.current = null;
  engine.masterBus.current = null;
  engine.postFxBus.current = null;
  engine.fxMerge.current = null;
  engine.dryFxGain.current = null;
  engine.delayNode.current = null;
  engine.delaySend.current = null;
  engine.reverbNode.current = null;
  engine.reverbSend.current = null;
  engine.compressor.current = null;
  engine.limiter.current = null;
  engine.recorderStream.current = null;
  engine.isInitialized.current = false;
  engine.isInitializing.current = false;
  engine.isReady.current = false;
  engine.failedTracks.current.clear();
};

export const useAudioEngine = (): AudioEngineControls => {
  const { masterBpm, deckA, deckB, setAudioReady, setDeckTrack, setDeckRate, updateDeck } = useStore();
  const { analyzeTrack } = useEssentiaAnalysis();

  const engineRef = useRef<EngineState | null>(engineSingletonRef.current);
  if (!engineRef.current) {
    engineRef.current = engineSingletonRef.current ?? createEngineState();
    engineSingletonRef.current = engineRef.current;
  }
  const engine = engineRef.current;

  // Audio nodes - singleton shared across hook instances
  const players = engine.players;
  const stemPlayers = engine.stemPlayers;
  const stemGains = engine.stemGains; // Phase 3.3B: Per-stem gain nodes
  const stemMutes = engine.stemMutes;
  const userMuteState = engine.userMuteState; // Phase 3.3B: User toggle state
  const channels = engine.channels;
  const eqs = engine.eqs;
  const filters = engine.filters;
  const pitchShift = engine.pitchShift;
  const crossFade = engine.crossFade;
  const masterBus = engine.masterBus;
  const postFxBus = engine.postFxBus;
  const fxMerge = engine.fxMerge;
  const dryFxGain = engine.dryFxGain;
  const delayNode = engine.delayNode;
  const delaySend = engine.delaySend;
  const delayFeedbackRef = engine.delayFeedbackRef;
  const reverbNode = engine.reverbNode;
  const reverbSend = engine.reverbSend;
  const reverbDecayRef = engine.reverbDecayRef;
  const compressor = engine.compressor;
  const limiter = engine.limiter;
  const recorderStream = engine.recorderStream;
  const stemMuteFxEnabled = engine.stemMuteFxEnabled; // Phase 3.3B: Echo tail toggle

  const isInitialized = engine.isInitialized;
  const isInitializing = engine.isInitializing;
  const failedTracksRef = engine.failedTracks;
  const isReady = engine.isReady.current;

  useEffect(() => {
    engineRefCount.current += 1;
    return () => {
      engineRefCount.current -= 1;
      if (engineRefCount.current === 0) {
        disposeEngine(engine);
      }
    };
  }, [engine]);

  // Initialize audio context and master bus
  const init = useCallback(async () => {
    if (isInitialized.current || isInitializing.current) return;
    isInitializing.current = true;

    try {
      // Start Tone.js context (requires user gesture)
      await Tone.start();
      // Unlock hardware with a silent buffer (mobile fix)
      const rawCtx = Tone.getContext().rawContext;
      const buffer = rawCtx.createBuffer(1, 1, rawCtx.sampleRate);
      const source = rawCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(rawCtx.destination);
      source.start(0);
      console.log('[AudioEngine] Hardware Unlocked for Mobile');
      if (Tone.getContext().transport.state !== 'started') {
        // start transport and give a micro-safety delay
        Tone.getContext().transport.start();
        console.log('[AudioEngine] Transport started for scheduling');
      }

      // Create Master Bus chain
      const crossfade = new Tone.CrossFade(0.5);
      const initialCrossfaderPos = useStudioStore.getState().crossfaderPos;
      crossfade.fade.value = Math.max(0, Math.min(1, initialCrossfaderPos));
      const comp = new Tone.Compressor({
        threshold: -24,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
      });
      const lim = new Tone.Limiter(-1);
      const recorderTap = new Tone.Gain(1);
      const master = new Tone.Gain(1);
      const postFx = new Tone.Gain(1);
      const fxMergeNode = new Tone.Gain(1);
      const dryGain = new Tone.Gain(1);
      const delaySendNode = new Tone.Gain(0);
      const reverbSendNode = new Tone.Gain(0);
      const delay = new Tone.FeedbackDelay({
        delayTime: 0.25,
        feedback: delayFeedbackRef.current,
        wet: 0,
      });
      const reverb = new Tone.Reverb({
        decay: reverbDecayRef.current,
        wet: 0,
      });

      // Connect: CrossFade -> Master Bus -> Post-FX -> (Dry + FX) -> Compressor -> Limiter -> Destination
      crossfade.connect(master);
      master.connect(postFx);
      postFx.connect(dryGain);
      postFx.connect(delaySendNode);
      postFx.connect(reverbSendNode);

      delaySendNode.connect(delay);
      delay.connect(fxMergeNode);

      reverbSendNode.connect(reverb);
      reverb.connect(fxMergeNode);

      dryGain.connect(fxMergeNode);

      fxMergeNode.connect(comp);
      comp.connect(lim);
      lim.connect(recorderTap);
      recorderTap.toDestination();

      // MediaRecorder tap (for social export) - only in live browser contexts
      if (globalThis.window !== undefined && rawCtx instanceof AudioContext) {
        const mediaDest = rawCtx.createMediaStreamDestination();
        recorderTap.connect(mediaDest);
        engine.recorderStream.current = mediaDest.stream;
      }

      crossFade.current = crossfade;
      masterBus.current = master;
      postFxBus.current = postFx;
      fxMerge.current = fxMergeNode;
      dryFxGain.current = dryGain;
      delayNode.current = delay;
      delaySend.current = delaySendNode;
      reverbNode.current = reverb;
      reverbSend.current = reverbSendNode;
      compressor.current = comp;
      limiter.current = lim;

      // Initialize decks
      const channelA = new Tone.Channel({ volume: 0 });
      const channelB = new Tone.Channel({ volume: 0 });
      const eqA = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
      const eqB = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
      const filterA = new Tone.Filter({ type: 'lowpass', frequency: 20000 });
      const filterB = new Tone.Filter({ type: 'lowpass', frequency: 20000 });
      const pitchA = new Tone.PitchShift({ pitch: 0, wet: 0 });
      const pitchB = new Tone.PitchShift({ pitch: 0, wet: 0 });

      // Connect: Player -> EQ -> Filter -> Channel -> CrossFade
      pitchA.connect(eqA);
      pitchB.connect(eqB);
      eqA.connect(filterA);
      eqB.connect(filterB);
      filterA.connect(channelA);
      filterB.connect(channelB);
      channelA.connect(crossfade.a);
      channelB.connect(crossfade.b);

      channels.current = { A: channelA, B: channelB };
      eqs.current = { A: eqA, B: eqB };
      filters.current = { A: filterA, B: filterB };
      pitchShift.current = { A: pitchA, B: pitchB };

      // Phase 1.1: Create DeckEngine instances
      const deckEngineA = new DeckEngine({
        deckId: 'A',
        context: Tone.getContext(),
      });
      const deckEngineB = new DeckEngine({
        deckId: 'B',
        context: Tone.getContext(),
      });

      // Connect DeckEngine outputs to crossfader
      deckEngineA.getOutputNode().connect(crossfade.a);
      deckEngineB.getOutputNode().connect(crossfade.b);

      engine.deckEngines.current = { A: deckEngineA, B: deckEngineB };

      // Phase 1.1 Batch 4: Subscribe to DeckEngine events for state sync
      deckEngineA.on('trackLoaded', (event) => {
        const data = event.data as Partial<import('@/audio/engines/DeckEngine').DeckState>;
        if (data.duration !== undefined) {
          useStudioStore.getState().setDeckDuration('deckA', data.duration);
        }
      });

      deckEngineA.on('playbackStart', () => {
        useStudioStore.setState((state) => ({
          deckA: { ...state.deckA, isPlaying: true },
        }));
      });

      deckEngineA.on('playbackStop', () => {
        useStudioStore.setState((state) => ({
          deckA: { ...state.deckA, isPlaying: false },
        }));
      });

      deckEngineA.on('stateChange', (event) => {
        const data = event.data as Partial<import('@/audio/engines/DeckEngine').DeckState>;
        if (data.currentTime !== undefined) {
          useStudioStore.getState().updateDeckTime('deckA', data.currentTime);
        }
      });

      deckEngineB.on('trackLoaded', (event) => {
        const data = event.data as Partial<import('@/audio/engines/DeckEngine').DeckState>;
        if (data.duration !== undefined) {
          useStudioStore.getState().setDeckDuration('deckB', data.duration);
        }
      });

      deckEngineB.on('playbackStart', () => {
        useStudioStore.setState((state) => ({
          deckB: { ...state.deckB, isPlaying: true },
        }));
      });

      deckEngineB.on('playbackStop', () => {
        useStudioStore.setState((state) => ({
          deckB: { ...state.deckB, isPlaying: false },
        }));
      });

      deckEngineB.on('stateChange', (event) => {
        const data = event.data as Partial<import('@/audio/engines/DeckEngine').DeckState>;
        if (data.currentTime !== undefined) {
          useStudioStore.getState().updateDeckTime('deckB', data.currentTime);
        }
      });

      console.log('[AudioEngine] DeckEngine instances created and connected');
      console.log('[AudioEngine] Event subscriptions established for state sync');

      isInitialized.current = true;
      engine.isReady.current = true;
      setAudioReady(true);

      console.log('[AudioEngine] Initialized successfully');
    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
      throw error;
    } finally {
      isInitializing.current = false;
    }
  }, [
    setAudioReady,
    channels,
    compressor,
    crossFade,
    delayFeedbackRef,
    delayNode,
    delaySend,
    dryFxGain,
    engine,
    eqs,
    filters,
    fxMerge,
    isInitialized,
    isInitializing,
    limiter,
    masterBus,
    pitchShift,
    postFxBus,
    recorderStream,
    reverbDecayRef,
    reverbNode,
    reverbSend,
  ]);

  // Phase S7: Crossfade with configurable curves
  // Note: Tone.CrossFade has built-in equal-power curve.
  // For custom curves, we adjust the input position to achieve similar feel.
  const updateCrossfade = useCallback((value: number) => {
    if (!crossFade.current) return;

    const clamped = Math.max(-1, Math.min(1, value));
    const normalized = normalizeCrossfaderValue(clamped);

    // Get current mixer settings from store
    const mixerSettings = useStore.getState().mixerSettings;

    // Map normalized position through selected curve
    // Then extract the effective fade position for Tone.CrossFade
    const { gainA, gainB } = applyCrossfaderCurve(normalized, mixerSettings.crossfaderCurve);

    // Calculate effective fade value for Tone.CrossFade
    // This is an approximation that maps custom curves to Tone's internal curve
    const totalGain = gainA + gainB + 0.0001; // Avoid div by zero
    const effectiveFade = gainB / totalGain;

    if (crossFade.current.fade && typeof crossFade.current.fade.rampTo === 'function') {
      crossFade.current.fade.rampTo(effectiveFade, 0.05);
    }
  }, [crossFade]);

  useEffect(() => {
    return useStudioStore.subscribe(
      (state) => state.crossfaderPos,
      (pos) => {
        updateCrossfade(pos * 2 - 1);
      }
    );
  }, [updateCrossfade]);

  const updateKeyLockComp = useCallback(
    (deck: 'A' | 'B', rate: number) => {
      const node = pitchShift.current[deck];
      if (!node || !node.wet) return;
      const active = deck === 'A' ? deckA.isKeyLockActive : deckB.isKeyLockActive;
      const safeRate = Math.max(0.001, rate || 1);
      const semitoneComp = active ? -12 * Math.log2(safeRate) : 0;
      try {
        node.pitch = semitoneComp;
        if (typeof node.wet.rampTo === 'function') {
          node.wet.rampTo(active ? 1 : 0, 0.05);
        }
      } catch (error) {
        console.warn(`[AudioEngine] Key lock update failed on Deck ${deck}:`, error);
      }
    },
    [deckA.isKeyLockActive, deckB.isKeyLockActive, pitchShift]
  );

  // Helper: perform audio analysis and update deck metadata if needed
  const performTrackAnalysis = useCallback(async (deck: 'A' | 'B', url: string, bpm: number) => {
    try {
      // Fetch audio file for analysis
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
  const AudioContextCtor = typeof globalThis === 'undefined' ? null : globalThis.AudioContext;
      if (!AudioContextCtor) {
        throw new Error('AudioContext is not supported in this browser');
      }
      const decodeCtx = new AudioContextCtor();
      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);

      // Analyze in worker
  const analysisResult = await analyzeTrack(audioBuffer, url);

      // Update store with analyzed BPM/key if different
      if (analysisResult && analysisResult.bpm > 0 && Math.abs(analysisResult.bpm - bpm) > 2) {
        console.log(`[AudioEngine] Analyzed BPM: ${analysisResult.bpm} (was ${bpm})`);
        const currentDeck = useStore.getState()[deck === 'A' ? 'deckA' : 'deckB'];
        if (currentDeck.trackData) {
          setDeckTrack(deck, {
            ...currentDeck.trackData,
            bpm: analysisResult.bpm,
            key: analysisResult.key,
            scale: analysisResult.scale,
            energy: analysisResult.energy,
            danceability: analysisResult.danceability,
            beatGrid: analysisResult.beatGrid,
          });
        }
      }
    } catch (analysisError) {
      console.warn(`[AudioEngine] Analysis failed for Deck ${deck}:`, analysisError);
      // Don't fail track loading if analysis fails
    }
  }, [analyzeTrack, setDeckTrack]);

  // Phase 1.1: Load track on deck using DeckEngine
  const loadTrack = useCallback(async (deck: 'A' | 'B', url: string, bpm: number, skipAnalysis = false) => {
    if (!isInitialized.current) {
      await init();
    }

    if (failedTracksRef.current.has(url)) {
      throw new Error(`Track previously failed to load: ${url}`);
    }

    try {
      console.log(`[AudioEngine Phase 1.1] Loading track via DeckEngine to Deck ${deck}: ${url}`);

      // Get DeckEngine instance
      const deckEngine = engine.deckEngines.current[deck];
      if (!deckEngine) {
        throw new Error(`[AudioEngine] DeckEngine for Deck ${deck} not initialized`);
      }

      // Clear old stems (Phase 1.1: engines handle their own stems now)
      Object.values(stemPlayers.current[deck]).forEach((player) => {
        player?.dispose();
      });
      stemPlayers.current[deck] = { vocals: null, drums: null, bass: null, other: null };
      stemMutes.current[deck] = { vocals: false, drums: false, bass: false, other: false };

      // Load track into DeckEngine
      await deckEngine.loadTrack(url, bpm);

      // Update store with track data
      setDeckTrack(deck, {
        trackKey: deriveTrackKey({ url }), // Phase S11.2: Canonical track identity
        url,
        bpm,
        title: 'Loading...',
        artist: 'Unknown',
      });

      updateDeck(deck, { isLoaded: true });

      console.log(`[AudioEngine Phase 1.1] Track loaded on Deck ${deck} via DeckEngine`);

      // Perform Essentia.js analysis if not skipped
      if (!skipAnalysis) {
        await performTrackAnalysis(deck, url, bpm);
      }
    } catch (error) {
      console.error(`[AudioEngine] Failed to load track on Deck ${deck}:`, error);
      failedTracksRef.current.add(url);
      throw error;
    }
  }, [
     setDeckTrack,
     performTrackAnalysis,
     updateDeck,
     init,
     isInitialized,
     failedTracksRef,
     stemPlayers,
     stemMutes,
     engine,
   ]);

  // Phase 1.1: Seek to position using DeckEngine
  const seekTo = useCallback((deck: 'A' | 'B', timeInSeconds: number) => {
    const deckEngine = engine.deckEngines.current[deck];
    if (!deckEngine) {
      console.warn(`[AudioEngine] DeckEngine for Deck ${deck} not initialized`);
      return;
    }

    deckEngine.seekTo(timeInSeconds);
    console.log(`[AudioEngine Phase 1.1] Deck ${deck} seeked to ${timeInSeconds}s via DeckEngine`);
  }, [engine]);

  const syncToBpm = useCallback((deck: 'A' | 'B') => {
    const currentDeck = deck === 'A' ? deckA : deckB;
    const deckBpm = currentDeck.trackData?.bpm;
    if (!deckBpm || deckBpm <= 0) return;

    const pitchDelta = masterBpm / deckBpm - 1;
    const targetBpm = calculateNewBpm(deckBpm, pitchDelta);
    const syncRate = targetBpm / deckBpm;
    const rampPlaybackRate = (player: Tone.Player | null) => {
      if (!player) return;
      const param = player.playbackRate as unknown as Tone.Param<"number">;
      try {
        if (typeof param?.rampTo === 'function') {
          param.rampTo(syncRate, 0.05);
          return;
        }
      } catch (err) {
        console.warn('[AudioEngine] Failed to ramp playbackRate:', err);
      }
      player.playbackRate = syncRate;
    };

    const stemSet = stemPlayers.current[deck];
    const hasStems = Object.values(stemSet).some((player) => player !== null);
    if (hasStems) {
      Object.values(stemSet).forEach((player) => {
        if (player) {
          rampPlaybackRate(player);
        }
      });
    } else {
      const player = players.current[deck];
      if (player) {
        rampPlaybackRate(player);
      }
    }

    setDeckRate(deck, syncRate);
    console.log(`[AudioEngine] Deck ${deck} synced to BPM ${targetBpm.toFixed(2)} (rate ${syncRate.toFixed(2)})`);
  }, [deckA, deckB, masterBpm, setDeckRate, players, stemPlayers]);

  // Smoothly apply playbackRate changes coming from UI/store
  const applyPlaybackRate = useCallback((deck: 'A' | 'B', rate: number) => {
    const normalized = Math.max(0.001, rate || 1);
    const rampPlayer = (player: Tone.Player | null) => {
      if (!player) return;
      const param = player.playbackRate as unknown as PlaybackRateParam;
      const now = Tone.now();
      try {
        if (typeof param.cancelScheduledValues === 'function') {
          param.cancelScheduledValues(now);
        }
        const currentValue = typeof param.value === 'number' ? param.value : normalized;
        if (typeof param.setValueAtTime === 'function') {
          const value = Math.max(0.001, currentValue);
          param.setValueAtTime(value, now);
        }
        if (typeof param.exponentialRampToValueAtTime === 'function') {
          param.exponentialRampToValueAtTime(normalized, now + 0.05);
          return;
        }
        if (typeof param?.rampTo === 'function') {
          param.rampTo(normalized, 0.05);
          return;
        }
      } catch (err) {
        console.warn('[AudioEngine] playbackRate ramp failed:', err);
      }
      player.playbackRate = normalized;
    };

    const stemSet = stemPlayers.current[deck];
    const hasStems = Object.values(stemSet).some((p) => p !== null);
    if (hasStems) {
      Object.values(stemSet).forEach((player) => {
        if (player) rampPlayer(player);
      });
    } else {
      rampPlayer(players.current[deck]);
    }
    updateKeyLockComp(deck, normalized);
  }, [updateKeyLockComp, players, stemPlayers]);

  // Get playback position
  const getPlaybackPosition = useCallback((deck: 'A' | 'B'): number => {
    const stemSet = stemPlayers.current[deck];
    const hasStems = Object.values(stemSet).some((player) => player !== null);
    if (hasStems) {
      return Tone.getContext().transport.seconds || 0;
    }

    const player = players.current[deck];
    if (player?.loaded) {
      const rawPosition = (player as { position?: number | string }).position ?? 0;
      if (typeof rawPosition === 'number') {
        return rawPosition;
      }
      return typeof player.toSeconds === 'function' ? player.toSeconds(rawPosition) : 0;
    }
    return 0;
  }, [players, stemPlayers]);

  const getDeckDuration = useCallback((deck: 'A' | 'B'): number => {
    const stemSet = stemPlayers.current[deck];
    const stemDurations = Object.values(stemSet)
      .map((player) => player?.buffer?.duration ?? 0);
    const stemMax = stemDurations.length ? Math.max(...stemDurations) : 0;

    const player = players.current[deck];
    const playerDuration = player?.buffer?.duration ?? 0;

    return Math.max(stemMax, playerDuration);
  }, [players, stemPlayers]);

  const getTransportSeconds = useCallback(() => {
    return Tone.getContext().transport.seconds || 0;
  }, []);

  const setMasterGain = useCallback((value: number) => {
    const master = masterBus.current;
    if (!master || !master.gain) return;
    const clamped = Math.max(0, Math.min(1, value));
    if (typeof master.gain.rampTo === 'function') {
      master.gain.rampTo(clamped, 0.05);
    } else {
      master.gain.value = clamped;
    }
  }, [masterBus]);

  // Set deck volume
  const setDeckVolume = useCallback((deck: 'A' | 'B', volume: number) => {
    const channel = channels.current[deck];
    if (channel && channel.volume) {
      const volumeDb = volume > 0 ? 20 * Math.log10(volume) : -Infinity;
      if (typeof channel.volume.rampTo === 'function') {
        channel.volume.rampTo(volumeDb, 0.05);
      } else {
        channel.volume.value = volumeDb;
      }
    }
  }, [channels]);

  // Set deck EQ
  // Phase S7: Set Deck EQ with isolator mode support
  const setDeckEQ = useCallback((deck: 'A' | 'B', eq: { low: number; mid: number; high: number }) => {
    const eqNode = eqs.current[deck];
    if (!eqNode || !eqNode.low || !eqNode.mid || !eqNode.high) return;

    // Get current mixer settings from store
    const mixerSettings = useStore.getState().mixerSettings;
    const isIsolator = mixerSettings.eqType === 'isolator';

    // Map EQ values based on type
    const mapEQ = (value: number): number => {
      if (!isIsolator) return value; // Classic mode: pass through

      // Isolator mode: aggressive kill curve
      if (value < -20) {
        return -60; // Kill zone (-inf dB effectively)
      } else if (value < -10) {
        return value * 2; // Steeper slope in lower range
      } else {
        return value; // Normal boost range
      }
    };

    const lowDb = mapEQ(eq.low);
    const midDb = mapEQ(eq.mid);
    const highDb = mapEQ(eq.high);

    if (typeof eqNode.low.rampTo === 'function') {
      eqNode.low.rampTo(lowDb, 0.05);
      eqNode.mid.rampTo(midDb, 0.05);
      eqNode.high.rampTo(highDb, 0.05);
    } else {
      eqNode.low.value = lowDb;
      eqNode.mid.value = midDb;
      eqNode.high.value = highDb;
    }
  }, [eqs]);

  // Set deck filter
  const setDeckFilter = useCallback((deck: 'A' | 'B', position: number) => {
    const filter = filters.current[deck];
    if (!filter || !filter.frequency) return;
    const clamped = Math.max(0, Math.min(1, position));
    const lowPassRange = clamped < 0.48;
    const highPassRange = clamped > 0.52;

    if (!lowPassRange && !highPassRange) {
      filter.type = 'lowpass';
      filter.Q.value = 0;
      if (typeof filter.frequency.rampTo === 'function') {
        filter.frequency.rampTo(20000, 0.05);
      } else {
        filter.frequency.value = 20000;
      }
      return;
    }

    const normalized = lowPassRange
      ? clamped / 0.48
      : (clamped - 0.52) / 0.48;

    const min = 20;
    const max = 20000;
    const exp = Math.pow(max / min, Math.max(0, Math.min(1, normalized)));
    const frequency = min * exp;

    filter.type = lowPassRange ? 'lowpass' : 'highpass';
    filter.Q.value = 1;
    if (typeof filter.frequency.rampTo === 'function') {
      filter.frequency.rampTo(Math.max(20, Math.min(20000, frequency)), 0.05);
    } else {
      filter.frequency.value = Math.max(20, Math.min(20000, frequency));
    }
  }, [filters]);

  // FX Rack: Delay/Reverb controls
  const setDelayWetMix = useCallback((amount: number) => {
    const send = delaySend.current;
    const delay = delayNode.current;
    if (!send || !delay) return;
    const clamped = Math.max(0, Math.min(1, amount));
    const active = clamped > 0.001;
    send.gain.rampTo(active ? clamped : 0, 0.05);
    delay.wet.rampTo(active ? clamped : 0, 0.05);
    const targetFeedback = active ? delayFeedbackRef.current : 0;
    if (typeof delay.feedback.rampTo === 'function') {
      delay.feedback.rampTo(targetFeedback, 0.05);
    } else {
      delay.feedback.value = targetFeedback;
    }
  }, [delayNode, delaySend, delayFeedbackRef]);

  const setDelayFeedbackAmount = useCallback((amount: number) => {
    const delay = delayNode.current;
    if (!delay) return;
    const clamped = Math.max(0, Math.min(0.95, amount));
    delayFeedbackRef.current = clamped;
    if (delaySend.current?.gain.value === 0) {
      delay.feedback.value = 0;
      return;
    }
    if (typeof delay.feedback.rampTo === 'function') {
      delay.feedback.rampTo(clamped, 0.05);
    } else {
      delay.feedback.value = clamped;
    }
  }, [delayNode, delaySend, delayFeedbackRef]);

  const setReverbWetMix = useCallback((amount: number) => {
    const send = reverbSend.current;
    const reverb = reverbNode.current;
    if (!send || !reverb) return;
    const clamped = Math.max(0, Math.min(1, amount));
    const active = clamped > 0.001;
    send.gain.rampTo(active ? clamped : 0, 0.05);
    reverb.wet.rampTo(active ? clamped : 0, 0.05);
  }, [reverbNode, reverbSend]);

  const setReverbDecayTime = useCallback((seconds: number) => {
    if (reverbNode.current) {
      reverbNode.current.decay = seconds;
    }
  }, []);

  // Phase 3.3B: Smooth stem gain ramping with solo logic
  const applyStemMix = useCallback((deck: 'A' | 'B') => {
    const { mutedStems, soloStem } = useStudioStore.getState();
    const deckMutes = mutedStems[deck];
    const deckSolo = soloStem[deck];
    const rampTime = 0.020; // 20ms ramp to prevent clicks/pops

    (['vocals', 'drums', 'bass', 'other'] as const).forEach((stemType) => {
      const player = stemPlayers.current[deck][stemType];
      const gainNode = stemGains.current[deck][stemType];

      if (!player) return;

      // Calculate effective gain: solo takes priority over individual mutes
      let targetGain = 1;
      if (deckSolo) {
        // Solo mode: only the solo stem is audible
        targetGain = stemType === deckSolo ? 1 : 0;
      } else {
        // Normal mode: respect individual mute toggles
        targetGain = deckMutes[stemType] ? 0 : 1;
      }

      // Update internal mute state tracking
      const shouldMute = targetGain === 0;
      const wasAudible = !stemMutes.current[deck][stemType];
      stemMutes.current[deck][stemType] = shouldMute;

      // Apply gain ramp for smooth transition (no clicks/pops)
      if (gainNode && typeof gainNode.gain.rampTo === 'function') {
        gainNode.gain.rampTo(targetGain, rampTime);

        // Phase 3.3B STEP 4: Optional echo tail on mute
        if (stemMuteFxEnabled.current && wasAudible && shouldMute) {
          // Trigger brief echo tail when muting an audible stem
          const delay = delayNode.current;
          if (delay && delaySend.current) {
            // Store current delay settings
            const currentSend = delaySend.current.gain.value;
            const currentFeedback = delay.feedback.value;

            // Briefly boost delay send for this stem's mute
            const now = Tone.now();
            delaySend.current.gain.setValueAtTime(currentSend, now);
            delaySend.current.gain.linearRampToValueAtTime(
              Math.min(currentSend + 0.15, 0.3),
              now + 0.05
            );
            // Return to original after 300ms
            delaySend.current.gain.linearRampToValueAtTime(currentSend, now + 0.3);

            if (typeof delay.feedback.rampTo === 'function') {
              delay.feedback.setValueAtTime(currentFeedback, now);
              delay.feedback.linearRampToValueAtTime(
                Math.min(currentFeedback + 0.2, 0.5),
                now + 0.05
              );
              delay.feedback.linearRampToValueAtTime(currentFeedback, now + 0.4);
            }
          }
        }
      } else if (gainNode) {
        // Fallback: instant gain change
        gainNode.gain.value = targetGain;
      }

      // Keep legacy player.mute as fallback
      player.mute = shouldMute;
    });

    // Phase 3.3B STEP 2: Diagnostic logging (dev-only)
    if (process.env.NODE_ENV === 'development') {
      const gains = ['vocals', 'drums', 'bass', 'other'].map((stem) => {
        const gainNode = stemGains.current[deck][stem as keyof StemGainNodes];
        return `${stem}:${gainNode?.gain.value.toFixed(2) ?? 'N/A'}`;
      });
      console.log(`[StemMix:${deck}] ${deckSolo ? `SOLO=${deckSolo}` : 'NORMAL'} | ${gains.join(', ')}`);
    }
  }, [stemMutes, stemPlayers, stemGains, stemMuteFxEnabled, delayNode, delaySend]);

  useEffect(() => {
    const unsubscribeMutes = useStudioStore.subscribe(
      (state) => state.mutedStems,
      () => {
        applyStemMix('A');
        applyStemMix('B');
      }
    );
    const unsubscribeSolo = useStudioStore.subscribe(
      (state) => state.soloStem,
      () => {
        applyStemMix('A');
        applyStemMix('B');
      }
    );

    return () => {
      unsubscribeMutes();
      unsubscribeSolo();
    };
  }, [applyStemMix]);

  // Load stems (real stem separation)
  const loadStems = useCallback(async (
    deck: 'A' | 'B',
    stems: StemSourceMap
  ) => {
    if (!isInitialized.current) {
      await init();
    }

    try {
      const channel = channels.current[deck];
      const eq = eqs.current[deck];
      const filter = filters.current[deck];
      const pitchNode = pitchShift.current[deck];

      if (!channel || !eq || !filter) {
        throw new Error(`[AudioEngine] Deck ${deck} not initialized`);
      }

      // Dispose old stem players
      Object.values(stemPlayers.current[deck]).forEach(player => {
        player?.dispose();
      });
      // Phase 3.3B: Dispose old stem gain nodes
      Object.values(stemGains.current[deck]).forEach(gain => {
        gain?.dispose();
      });
      stemPlayers.current[deck] = { vocals: null, drums: null, bass: null, other: null };
      stemGains.current[deck] = { vocals: null, drums: null, bass: null, other: null };
      stemMutes.current[deck] = { vocals: false, drums: false, bass: false, other: false };
      userMuteState.current[deck] = { vocals: false, drums: false, bass: false, other: false }; // Phase 3.3B

      // Create players for each stem
      const stemTypes = ['vocals', 'drums', 'bass', 'other'] as const;
      const stemSources: (StemSource | null)[] = [stems.vocals, stems.drums, stems.bass, stems.other];

      for (let i = 0; i < stemTypes.length; i++) {
        const stemType = stemTypes[i];
        const source = stemSources[i];

        if (!source) continue;

        const player = new Tone.Player({
          url: source,
          autostart: false,
          onload: () => {
            console.log(`[AudioEngine] Stem ${stemType} loaded on Deck ${deck}`);
          },
          onerror: (error) => {
            console.error(`[AudioEngine] Error loading stem ${stemType} on Deck ${deck}:`, error);
          },
        });

        const currentRate = deck === 'A' ? deckA.playbackRate : deckB.playbackRate;
        player.playbackRate = Math.max(0.001, currentRate || 1);

        // Phase 3.3B: Create dedicated gain node for smooth ramping
        const gainNode = new Tone.Gain(1).toDestination(); // Start at full volume
        gainNode.disconnect(); // Remove default connection

        // Connect: Player -> Gain Node -> Pitch (optional) -> EQ chain
        player.connect(gainNode);
        if (pitchNode) {
          gainNode.connect(pitchNode);
        } else {
          gainNode.connect(eq);
        }
        player.sync();

        stemPlayers.current[deck][stemType] = player;
        stemGains.current[deck][stemType] = gainNode; // Phase 3.3B: Store gain node
        stemMutes.current[deck][stemType] = false; // All stems enabled by default
      }

      const hasLoadedStems = Object.values(stemPlayers.current[deck]).some((player) => player !== null);
      if (!hasLoadedStems) {
        console.warn(`[AudioEngine] No stems loaded for Deck ${deck}`);
        return;
      }

      // Dispose main player if exists (stems replace it)
      if (players.current[deck]) {
        players.current[deck]?.dispose();
        players.current[deck] = null;
      }

      applyStemMix(deck);
      console.log(`[AudioEngine] Stems loaded on Deck ${deck}`);
    } catch (error) {
      console.error(`[AudioEngine] Failed to load stems on Deck ${deck}:`, error);
      throw error;
    }
  }, [
    deckA.playbackRate,
    deckB.playbackRate,
    isInitialized,
    init,
    channels,
    eqs,
    filters,
    pitchShift,
    stemPlayers,
    stemGains, // Phase 3.3B
    stemMutes,
    userMuteState, // Phase 3.3B
    players,
    applyStemMix,
  ]);

  // Toggle stem mute/solo (real stems)
  const toggleStem = useCallback((deck: 'A' | 'B', stem: 'vocals' | 'drums' | 'bass' | 'other') => {
    const { mutedStems, setMutedStem, soloStem, setSoloStem } = useStudioStore.getState();
    if (soloStem[deck] === stem) {
      setSoloStem(deck, null);
      return;
    }
    const isMuted = mutedStems[deck][stem];
    setMutedStem(deck, stem, !isMuted);
  }, []);

  // Set stem mute state directly (Zero-Latency control for UI)
  const setStemMute = useCallback((deck: 'A' | 'B', stem: 'vocals' | 'drums' | 'bass' | 'other', isMuted: boolean) => {
    const player = stemPlayers.current[deck][stem];
    stemMutes.current[deck][stem] = isMuted;
    if (player) {
      player.mute = isMuted;
    }
    // Also update store for UI consistency
    useStudioStore.getState().setMutedStem(deck, stem, isMuted);
  }, [stemPlayers, stemMutes]);

  // Get stem mute state
  const getStemMuteState = useCallback((deck: 'A' | 'B') => {
    return { ...useStudioStore.getState().mutedStems[deck] };
  }, []);

  const getMasterBus = useCallback(() => ({
    bus: masterBus.current,
    postFx: postFxBus.current,
  }), [masterBus, postFxBus]);

  const getRecorderStream = useCallback(() => recorderStream.current, []);

  // Update deck volumes when store changes
  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckVolume('A', deckA.volume);
  }, [deckA.volume, isInitialized, setDeckVolume]);

  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckVolume('B', deckB.volume);
  }, [deckB.volume, isInitialized, setDeckVolume]);

  // Update deck EQs when store changes
  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckEQ('A', deckA.eq);
  }, [deckA.eq, isInitialized, setDeckEQ]);

  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckEQ('B', deckB.eq);
  }, [deckB.eq, isInitialized, setDeckEQ]);

  // Update deck filters when store changes
  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckFilter('A', deckA.filter ?? 0.5);
  }, [deckA.filter, isInitialized, setDeckFilter]);

  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckFilter('B', deckB.filter ?? 0.5);
  }, [deckB.filter, isInitialized, setDeckFilter]);

  // React to pitch fader / playbackRate changes from store
  useEffect(() => {
    if (!isInitialized.current) return;
    applyPlaybackRate('A', deckA.playbackRate || 1);
  }, [applyPlaybackRate, deckA.playbackRate, isInitialized]);

  useEffect(() => {
    if (!isInitialized.current) return;
    applyPlaybackRate('B', deckB.playbackRate || 1);
  }, [applyPlaybackRate, deckB.playbackRate, isInitialized]);

  useEffect(() => {
    if (!isInitialized.current) return;
    updateKeyLockComp('A', deckA.playbackRate || 1);
  }, [deckA.isKeyLockActive, deckA.playbackRate, isInitialized, updateKeyLockComp]);

  useEffect(() => {
    if (!isInitialized.current) return;
    updateKeyLockComp('B', deckB.playbackRate || 1);
  }, [deckB.isKeyLockActive, deckB.playbackRate, isInitialized, updateKeyLockComp]);

  // Tape Stop: exponential glide to near-zero then stop
  const triggerTapeStop = useCallback((deck: 'A' | 'B') => {
    const now = Tone.now();
    const deckState = deck === 'A' ? deckA : deckB;
    const restoreRate = Math.max(0.001, deckState.playbackRate || 1);

    const rampPlayerDown = (player: Tone.Player | null) => {
      if (!player?.loaded) return false;
      const param = player.playbackRate as unknown as PlaybackRateParam;
      try {
        if (typeof param.cancelScheduledValues === 'function') {
          param.cancelScheduledValues(now);
        }
        const currentValue = typeof param.value === 'number' ? param.value : restoreRate;
        if (typeof param.setValueAtTime === 'function') {
          param.setValueAtTime(Math.max(0.001, currentValue), now);
        }
        if (typeof param.exponentialRampToValueAtTime === 'function') {
          param.exponentialRampToValueAtTime(0.001, now + 1.2);
        } else if (typeof param?.rampTo === 'function') {
          param.rampTo(0.001, 1.2);
        } else {
          player.playbackRate = 0.001;
        }
        player.stop(now + 1.25);
        return true;
      } catch (error) {
        console.warn(`[AudioEngine] Tape stop failed on Deck ${deck}:`, error);
        return false;
      }
    };

    const stemSet = stemPlayers.current[deck];
    const hasStems = Object.values(stemSet).some((p) => p !== null);
    let triggered = false;
    if (hasStems) {
      Object.values(stemSet).forEach((player) => {
        if (rampPlayerDown(player)) {
          triggered = true;
        }
      });
    } else if (rampPlayerDown(players.current[deck])) {
      triggered = true;
    }

    if (triggered) {
      setTimeout(() => {
        applyPlaybackRate(deck, restoreRate);
        updateDeck(deck, { isPlaying: false });
      }, 1300);
    }
  }, [applyPlaybackRate, deckA, deckB, updateDeck, players, stemPlayers]);

  // Phase 1.1: Play deck using DeckEngine
  const play = useCallback((deck: 'A' | 'B') => {
    const deckEngine = engine.deckEngines.current[deck];
    if (!deckEngine) {
      console.warn(`[AudioEngine] DeckEngine for Deck ${deck} not initialized`);
      return;
    }

    deckEngine.play();
    console.log(`[AudioEngine Phase 1.1] Deck ${deck} playing via DeckEngine`);
  }, [engine]);

  // Phase 1.1: Pause deck using DeckEngine
  const pause = useCallback((deck: 'A' | 'B') => {
    const deckEngine = engine.deckEngines.current[deck];
    if (!deckEngine) {
      console.warn(`[AudioEngine] DeckEngine for Deck ${deck} not initialized`);
      return;
    }

    deckEngine.pause();
    console.log(`[AudioEngine Phase 1.1] Deck ${deck} paused via DeckEngine`);
  }, [engine]);

  // Phase 1.1: Stop deck using DeckEngine
  const stop = useCallback((deck: 'A' | 'B') => {
    const deckEngine = engine.deckEngines.current[deck];
    if (!deckEngine) {
      console.warn(`[AudioEngine] DeckEngine for Deck ${deck} not initialized`);
      return;
    }

    deckEngine.stop();
    console.log(`[AudioEngine Phase 1.1] Deck ${deck} stopped via DeckEngine`);
  }, [engine]);

  // Get deck channel for level metering
  const getDeckChannel = (deck: 'A' | 'B') => {
    return channels.current[deck] || null;
  };

  // Get master bus for level metering
  const getMasterChannel = useCallback(() => {
    return masterBus.current;
  }, [masterBus]);

  // Phase S9: Loop Controls
  const setLoopPoints = useCallback((deck: 'A' | 'B', startSec: number, endSec: number) => {
    const player = players.current[deck];
    if (!player) {
      console.warn(`[AudioEngine] No player for deck ${deck}`);
      return;
    }

    // Set loop boundaries on Tone.Player
    player.loopStart = startSec;
    player.loopEnd = endSec;
    console.log(`[AudioEngine] Deck ${deck} loop set: ${startSec.toFixed(2)}s - ${endSec.toFixed(2)}s`);
  }, [players]);

  const clearLoopPoints = useCallback((deck: 'A' | 'B') => {
    const player = players.current[deck];
    if (!player) return;

    player.loop = false;
    console.log(`[AudioEngine] Deck ${deck} loop cleared`);
  }, [players]);

  const enableLoop = useCallback((deck: 'A' | 'B', enabled: boolean) => {
    const player = players.current[deck];
    if (!player) {
      console.warn(`[AudioEngine] No player for deck ${deck}`);
      return;
    }

    player.loop = enabled;
    console.log(`[AudioEngine] Deck ${deck} loop ${enabled ? 'enabled' : 'disabled'}`);
  }, [players]);

  return {
    init,
    isReady,
    loadTrack,
    loadStems,
    play,
    pause,
    stop,
    seekTo,
    syncToBpm,
    setCrossfade: updateCrossfade,
    getPlaybackPosition,
    setDeckVolume,
    setDeckEQ,
    setDeckFilter,
    setMasterGain,
    // setMasterGainLocal is intentionally not exported; use setMasterGain for external control
    setDelayWetMix,
    setDelayFeedbackAmount,
    setReverbWetMix,
    setReverbDecayTime,
    toggleStem,
    setStemMute,
    getStemMuteState,
    getMasterBus,
    getRecorderStream,
    getDeckDuration,
    getTransportSeconds,
    triggerTapeStop,
    getDeckChannel,
    getMasterChannel,
    // Phase S9: Loop Controls
    setLoopPoints,
    clearLoopPoints,
    enableLoop,
  };
};
