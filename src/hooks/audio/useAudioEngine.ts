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
  // Phase 1: Performance Pads
  getPlayer: (deck: 'A' | 'B') => Tone.Player | null;
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
  const deckEnginesToDispose = { ...engine.deckEngines.current };
  const crossFadeToDispose = engine.crossFade.current;

  deckEnginesToDispose.A?.dispose();
  deckEnginesToDispose.B?.dispose();

  engine.deckEngines.current = { A: null, B: null };
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

      limiter.current = lim;

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
    const storeState = useStore.getState();
    const mixerSettings = storeState.mixerSettings;
    const mode = storeState.crossfaderMode || 'normal';

    // Map normalized position through selected curve
    // Then extract the effective fade position for Tone.CrossFade
    const { gainA, gainB } = applyCrossfaderCurve(normalized, mixerSettings.crossfaderCurve);

    // Calculate effective fade value for Tone.CrossFade
    // This is an approximation that maps custom curves to Tone's internal curve
    const totalGain = gainA + gainB + 0.0001; // Avoid div by zero
    const effectiveFade = gainB / totalGain;

    if (mode === 'stem-balance') {
      // CROSSFADER FUSION LOGIC:
      // When entering stem-balance mode, we prioritize preserving beats (drums+bass)
      // or vocals based on proximity to the center or edges.
      // E.g., at crossfader center, duck vocals of Deck B slightly while keeping beat synced.
      
      const stemSetsA = stemGains.current.A;
      const stemSetsB = stemGains.current.B;

      if (stemSetsA && stemSetsB) {
        // Simple Fusion math:
        // Deck A vocals fade out slightly faster than drums.
        // Deck B drums fade in faster than vocals.
        const fusionGainA_Vocals = gainA * (1 - normalized * 0.5);
        const fusionGainA_Drums = gainA * (1 + normalized * 0.2);
        
        const fusionGainB_Vocals = gainB * (1 - (1 - normalized) * 0.5);
        const fusionGainB_Drums = gainB * (1 + (1 - normalized) * 0.2);

        // Apply ramps if nodes exist (stemGains exist in `applyStemMix` pattern)
        if (stemSetsA.vocals) stemSetsA.vocals.gain.rampTo(Math.max(0, Math.min(1, fusionGainA_Vocals)), 0.05);
        if (stemSetsA.drums) stemSetsA.drums.gain.rampTo(Math.max(0, Math.min(1, fusionGainA_Drums)), 0.05);
        
        if (stemSetsB.vocals) stemSetsB.vocals.gain.rampTo(Math.max(0, Math.min(1, fusionGainB_Vocals)), 0.05);
        if (stemSetsB.drums) stemSetsB.drums.gain.rampTo(Math.max(0, Math.min(1, fusionGainB_Drums)), 0.05);
      }
    }

    if (crossFade.current.fade && typeof crossFade.current.fade.rampTo === 'function') {
      crossFade.current.fade.rampTo(effectiveFade, 0.05);
    }
  }, [crossFade, stemGains]);

  useEffect(() => {
    return useStudioStore.subscribe(
      (state) => state.crossfaderPos,
      (pos) => {
        updateCrossfade(pos * 2 - 1);
      }
    );
  }, [updateCrossfade]);

  const updateKeyLockComp = useCallback(
    (deck: 'A' | 'B', _rate: number) => {
      const deckEngine = engine.deckEngines.current[deck];
      if (!deckEngine) return;
      const active = deck === 'A' ? deckA.isKeyLockActive : deckB.isKeyLockActive;
      deckEngine.setKeyLock(active);
    },
    [deckA.isKeyLockActive, deckB.isKeyLockActive, engine]
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
    const deckEngine = engine.deckEngines.current[deck];
    if (!deckEngine) return;
    deckEngine.setPitch(rate);
    updateKeyLockComp(deck, rate);
  }, [updateKeyLockComp, engine]);

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
    const deckEngine = engine.deckEngines.current[deck];
    if (deckEngine) {
      deckEngine.setVolume(volume);
    }
  }, [engine]);

  // Set deck EQ
  const setDeckEQ = useCallback((deck: 'A' | 'B', eq: { low: number; mid: number; high: number }) => {
    const deckEngine = engine.deckEngines.current[deck];
    if (deckEngine) {
      deckEngine.setEQ(eq);
    }
  }, [engine]);

  // Set deck filter
  const setDeckFilter = useCallback((deck: 'A' | 'B', position: number) => {
    const deckEngine = engine.deckEngines.current[deck];
    if (deckEngine) {
      // Map 0-1 to 20-20000 Hz for the engine
      const min = 20;
      const max = 20000;
      const frequency = min * Math.pow(max / min, position);
      deckEngine.setFilter(frequency);
    }
  }, [engine]);

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
      const deckEngine = engine.deckEngines.current[deck];

      if (!deckEngine) {
        throw new Error(`[AudioEngine] Deck ${deck} not initialized`);
      }

      console.log(`[AudioEngine] Loading stems for Deck ${deck}:`, Object.keys(stems));

      // Separate logic for stems vs single track
      // Delegate to DeckEngine
      await deckEngine.loadStems(stems);

      updateDeck(deck, { isLoaded: true, hasStems: true });
      applyStemMix(deck); // Initial apply of current mute/solo states
      
      console.log(`[AudioEngine] Stems loaded for Deck ${deck} via DeckEngine`);
    } catch (error) {
      console.error(`[AudioEngine] Failed to load stems on Deck ${deck}:`, error);
      throw error;
    }
  }, [engine, updateDeck, applyStemMix, init, isInitialized]);

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
  const play = useCallback(async (deck: 'A' | 'B') => {
    // Ensure Tone.js context is started (requires user gesture, which play button is)
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
      console.log('[AudioEngine] Tone started via Play gesture');
    }

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
    return engine.deckEngines.current[deck]?.getChannel() || null;
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

  // Phase 1: Performance Pads - Get player for pad controls
  const getPlayer = useCallback((deck: 'A' | 'B'): Tone.Player | null => {
    return players.current[deck];
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
    // Phase 1: Performance Pads
    getPlayer,
  };
};
