"use client";

/**
 * useAudioEngine.ts - High-Performance Audio Engine for Studio V3
 * 
 * Uses Tone.js with Master Bus chain:
 * Channel -> CrossFade -> Compressor -> Limiter -> Destination
 * 
 * Equal Power crossfade logic prevents volume dips during transitions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { useStore } from '@/store/useStore';
import { useEssentiaAnalysis } from './useEssentiaAnalysis';

export interface AudioEngineControls {
  init: () => Promise<void>;
  isReady: boolean;
  loadTrack: (deck: 'A' | 'B', url: string, bpm: number, skipAnalysis?: boolean) => Promise<void>;
  loadStems: (deck: 'A' | 'B', stems: { vocals: string; drums: string; bass: string; other: string }) => Promise<void>;
  play: (deck: 'A' | 'B') => void;
  pause: (deck: 'A' | 'B') => void;
  stop: (deck: 'A' | 'B') => void;
  seekTo: (deck: 'A' | 'B', timeInSeconds: number) => void;
  syncToBpm: (deck: 'A' | 'B') => void;
  setCrossfade: (value: number) => void; // -1 to 1
  getPlaybackPosition: (deck: 'A' | 'B') => number;
  setDeckVolume: (deck: 'A' | 'B', volume: number) => void;
  setDeckEQ: (deck: 'A' | 'B', eq: { low: number; mid: number; high: number }) => void;
  setDeckFilter: (deck: 'A' | 'B', position: number) => void;
  toggleStem: (deck: 'A' | 'B', stem: 'vocals' | 'drums' | 'bass' | 'other') => void;
  getStemMuteState: (deck: 'A' | 'B') => { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
  getMasterBus: () => { bus: Tone.Gain | null; postFx: Tone.Gain | null };
  getDeckDuration: (deck: 'A' | 'B') => number;
  getTransportSeconds: () => number;
}

export const useAudioEngine = (): AudioEngineControls => {
  const { masterBpm, crossfadeValue, deckA, deckB, setAudioReady, setDeckTrack, setDeckRate, updateDeck } = useStore();
  const { analyzeTrack } = useEssentiaAnalysis();
  
  // Audio nodes - persisted across renders
  const players = useRef<{ A: Tone.Player | null; B: Tone.Player | null }>({ A: null, B: null });
  const stemPlayers = useRef<{
    A: { vocals: Tone.Player | null; drums: Tone.Player | null; bass: Tone.Player | null; other: Tone.Player | null };
    B: { vocals: Tone.Player | null; drums: Tone.Player | null; bass: Tone.Player | null; other: Tone.Player | null };
  }>({
    A: { vocals: null, drums: null, bass: null, other: null },
    B: { vocals: null, drums: null, bass: null, other: null },
  });
  const stemMutes = useRef<{
    A: { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
    B: { vocals: boolean; drums: boolean; bass: boolean; other: boolean };
  }>({
    A: { vocals: false, drums: false, bass: false, other: false },
    B: { vocals: false, drums: false, bass: false, other: false },
  });
  const channels = useRef<{ A: Tone.Channel | null; B: Tone.Channel | null }>({ A: null, B: null });
  const eqs = useRef<{ A: Tone.EQ3 | null; B: Tone.EQ3 | null }>({ A: null, B: null });
  const filters = useRef<{ A: Tone.Filter | null; B: Tone.Filter | null }>({ A: null, B: null });
  const crossFade = useRef<Tone.CrossFade | null>(null);
  const masterBus = useRef<Tone.Gain | null>(null);
  const postFxBus = useRef<Tone.Gain | null>(null);
  const compressor = useRef<Tone.Compressor | null>(null);
  const limiter = useRef<Tone.Limiter | null>(null);

  const isInitialized = useRef(false);
  const isInitializing = useRef(false);
  const [isReady, setIsReady] = useState(false);

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

      // Create Master Bus chain
      const crossfade = new Tone.CrossFade(0.5);
      const comp = new Tone.Compressor({
        threshold: -18,
        ratio: 2,
        attack: 0.01,
        release: 0.15,
      });
      const lim = new Tone.Limiter(-0.1);
      const recorderTap = new Tone.Gain(1);
      const master = new Tone.Gain(1);
      const postFx = new Tone.Gain(1);

      // Connect: CrossFade -> Master Bus -> Post-FX -> Compressor -> Limiter -> Destination
      crossfade.connect(master);
      master.connect(postFx);
      postFx.connect(comp);
      comp.connect(lim);
      lim.connect(recorderTap);
      recorderTap.toDestination();

      crossFade.current = crossfade;
      masterBus.current = master;
      postFxBus.current = postFx;
      compressor.current = comp;
      limiter.current = lim;

      // Initialize decks
      const channelA = new Tone.Channel({ volume: 0 });
      const channelB = new Tone.Channel({ volume: 0 });
      const eqA = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
      const eqB = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
      const filterA = new Tone.Filter({ type: 'lowpass', frequency: 20000 });
      const filterB = new Tone.Filter({ type: 'lowpass', frequency: 20000 });

      // Connect: Player -> EQ -> Filter -> Channel -> CrossFade
      channelA.connect(crossfade.a);
      channelB.connect(crossfade.b);

      channels.current = { A: channelA, B: channelB };
      eqs.current = { A: eqA, B: eqB };
      filters.current = { A: filterA, B: filterB };

      isInitialized.current = true;
      setIsReady(true);
      setAudioReady(true);

      console.log('[AudioEngine] Initialized successfully');
    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
      throw error;
    } finally {
      isInitializing.current = false;
    }
  }, [setAudioReady]);

  // Equal Power Crossfade: prevents volume dips
  // Uses cosine/sine curves for smooth transitions
  const updateCrossfade = useCallback((value: number) => {
    if (!crossFade.current) return;
    
    // Normalize -1 to 1 range to 0 to 1 for crossfade
    const normalized = (value + 1) / 2; // -1 -> 0, 0 -> 0.5, 1 -> 1
    
    // Equal power: use cosine/sine curves
    // Note: aGain and bGain are calculated but not used directly
    // The crossfade.fade value handles the mixing
    
    // Update crossfade mix (0 = A only, 1 = B only)
    crossFade.current.fade.rampTo(normalized, 0.05);
  }, []);

  // Update crossfade when value changes
  useEffect(() => {
    if (isInitialized.current) {
      updateCrossfade(crossfadeValue);
    }
  }, [crossfadeValue, updateCrossfade]);

  // Load track on deck
  const loadTrack = useCallback(async (deck: 'A' | 'B', url: string, bpm: number, skipAnalysis = false) => {
    if (!isInitialized.current) {
      await init();
    }

    try {
      console.log(`[AudioEngine] Loading track to Deck ${deck}: ${url}`);
      const player = new Tone.Player({
        url,
        autostart: false,
        onload: () => {
          console.log(`[AudioEngine] Track loaded on Deck ${deck}`);
          updateDeck(deck, { isLoaded: true });
        },
        onerror: (error) => {
          console.error(`[AudioEngine] Error loading track on Deck ${deck}:`, error);
        },
      } as Tone.PlayerOptions);

      // Connect player to processing chain
      const channel = channels.current[deck];
      const eq = eqs.current[deck];
      const filter = filters.current[deck];
      
      if (!channel || !eq || !filter) {
        throw new Error(`[AudioEngine] Deck ${deck} not initialized`);
      }

      // Disconnect old player if exists
      if (players.current[deck]) {
        players.current[deck]?.dispose();
      }

      // Connect: Player -> EQ -> Filter -> Channel
      player.connect(eq);
      eq.connect(filter);
      filter.connect(channel);

      // Calculate sync rate based on master BPM
      const syncRate = masterBpm / bpm;
      player.playbackRate = syncRate;

      players.current[deck] = player;
      
      // Update store with track data
      setDeckTrack(deck, {
        url,
        bpm,
        title: 'Loading...',
        artist: 'Unknown',
      });

      console.log(`[AudioEngine] Track loaded on Deck ${deck}, sync rate: ${syncRate.toFixed(2)}`);

      // Perform Essentia.js analysis if not skipped
      if (!skipAnalysis) {
        try {
          // Fetch audio file for analysis
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          
          // Decode audio data
          const AudioContextCtor =
            window.AudioContext ??
            (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AudioContextCtor) {
            throw new Error('AudioContext is not supported in this browser');
          }
          const audioBuffer = await new AudioContextCtor().decodeAudioData(arrayBuffer);
          
          // Analyze in worker
          const analysisResult = await analyzeTrack(audioBuffer, url);
          
          // Update store with analyzed BPM/key if different
          if (analysisResult && analysisResult.bpm > 0 && Math.abs(analysisResult.bpm - bpm) > 2) {
            console.log(`[AudioEngine] Analyzed BPM: ${analysisResult.bpm} (was ${bpm})`);
            // Update deck with analyzed data
            const currentDeck = deck === 'A' ? deckA : deckB;
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
      }
    } catch (error) {
      console.error(`[AudioEngine] Failed to load track on Deck ${deck}:`, error);
      throw error;
    }
  }, [masterBpm, setDeckTrack, analyzeTrack, deckA, deckB, updateDeck, init]);

  // Seek to position
  const seekTo = useCallback((deck: 'A' | 'B', timeInSeconds: number) => {
    const player = players.current[deck];
    if (player && player.loaded) {
      player.seek(timeInSeconds);
      console.log(`[AudioEngine] Deck ${deck} seeked to ${timeInSeconds}s`);
    }
  }, []);

  const syncToBpm = useCallback((deck: 'A' | 'B') => {
    const currentDeck = deck === 'A' ? deckA : deckB;
    const deckBpm = currentDeck.trackData?.bpm;
    if (!deckBpm || deckBpm <= 0) return;

    const syncRate = masterBpm / deckBpm;

    const stemSet = stemPlayers.current[deck];
    const hasStems = Object.values(stemSet).some((player) => player !== null);
    if (hasStems) {
      Object.values(stemSet).forEach((player) => {
        if (player) {
          player.playbackRate = syncRate;
        }
      });
    } else {
      const player = players.current[deck];
      if (player) {
        player.playbackRate = syncRate;
      }
    }

    setDeckRate(deck, syncRate);
    console.log(`[AudioEngine] Deck ${deck} synced to BPM ${masterBpm} (rate ${syncRate.toFixed(2)})`);
  }, [deckA, deckB, masterBpm, setDeckRate]);

  // Get playback position
  const getPlaybackPosition = useCallback((deck: 'A' | 'B'): number => {
    const player = players.current[deck];
    if (player && player.loaded) {
      const rawPosition = (player as { position?: number | string }).position ?? 0;
      if (typeof rawPosition === 'number') {
        return rawPosition;
      }
      return typeof player.toSeconds === 'function' ? player.toSeconds(rawPosition) : 0;
    }
    return 0;
  }, []);

  const getDeckDuration = useCallback((deck: 'A' | 'B'): number => {
    const stemSet = stemPlayers.current[deck];
    const stemDurations = Object.values(stemSet)
      .map((player) => player?.buffer?.duration ?? 0);
    const stemMax = stemDurations.length ? Math.max(...stemDurations) : 0;

    const player = players.current[deck];
    const playerDuration = player?.buffer?.duration ?? 0;

    return Math.max(stemMax, playerDuration);
  }, []);

  const getTransportSeconds = useCallback(() => {
    return Tone.Transport.seconds || 0;
  }, []);

  // Set deck volume
  const setDeckVolume = useCallback((deck: 'A' | 'B', volume: number) => {
    const channel = channels.current[deck];
    if (channel) {
      const volumeDb = volume > 0 ? 20 * Math.log10(volume) : -Infinity;
      channel.volume.rampTo(volumeDb, 0.05);
    }
  }, []);

  // Set deck EQ
  const setDeckEQ = useCallback((deck: 'A' | 'B', eq: { low: number; mid: number; high: number }) => {
    const eqNode = eqs.current[deck];
    if (eqNode) {
      eqNode.low.rampTo(eq.low, 0.05);
      eqNode.mid.rampTo(eq.mid, 0.05);
      eqNode.high.rampTo(eq.high, 0.05);
    }
  }, []);

  // Set deck filter
  const setDeckFilter = useCallback((deck: 'A' | 'B', position: number) => {
    const filter = filters.current[deck];
    if (filter) {
      const clamped = Math.max(0, Math.min(1, position));
      const lowPassRange = clamped < 0.48;
      const highPassRange = clamped > 0.52;

      if (!lowPassRange && !highPassRange) {
        filter.type = 'lowpass';
        filter.Q.value = 0;
        filter.frequency.rampTo(20000, 0.05);
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
      filter.frequency.rampTo(Math.max(20, Math.min(20000, frequency)), 0.05);
    }
  }, []);

  // Load stems (real stem separation)
  const loadStems = useCallback(async (
    deck: 'A' | 'B',
    stems: { vocals: string; drums: string; bass: string; other: string }
  ) => {
    if (!isInitialized.current) {
      throw new Error('[AudioEngine] init() must be called before loading stems');
    }

    try {
      const channel = channels.current[deck];
      const eq = eqs.current[deck];
      const filter = filters.current[deck];
      
      if (!channel || !eq || !filter) {
        throw new Error(`[AudioEngine] Deck ${deck} not initialized`);
      }

      // Dispose old stem players
      Object.values(stemPlayers.current[deck]).forEach(player => {
        player?.dispose();
      });

      // Create players for each stem
      const stemTypes = ['vocals', 'drums', 'bass', 'other'] as const;
      const stemUrls = [stems.vocals, stems.drums, stems.bass, stems.other];

      for (let i = 0; i < stemTypes.length; i++) {
        const stemType = stemTypes[i];
        const url = stemUrls[i];

        if (!url) continue;

        const player = new Tone.Player({
          url,
          autostart: false,
          onload: () => {
            console.log(`[AudioEngine] Stem ${stemType} loaded on Deck ${deck}`);
          },
          onerror: (error) => {
            console.error(`[AudioEngine] Error loading stem ${stemType} on Deck ${deck}:`, error);
          },
        });

        // Connect: Player -> EQ -> Filter -> Channel
        player.connect(eq);
        eq.connect(filter);
        filter.connect(channel);

        stemPlayers.current[deck][stemType] = player;
        stemMutes.current[deck][stemType] = false; // All stems enabled by default
      }

      // Dispose main player if exists (stems replace it)
      if (players.current[deck]) {
        players.current[deck]?.dispose();
        players.current[deck] = null;
      }

      console.log(`[AudioEngine] Stems loaded on Deck ${deck}`);
    } catch (error) {
      console.error(`[AudioEngine] Failed to load stems on Deck ${deck}:`, error);
      throw error;
    }
  }, []);

  // Toggle stem mute/solo (real stems)
  const toggleStem = useCallback((deck: 'A' | 'B', stem: 'vocals' | 'drums' | 'bass' | 'other') => {
    const player = stemPlayers.current[deck][stem];
    if (!player) {
      // Fallback to EQ-based approximation if stems not loaded
      const eq = eqs.current[deck];
      const filter = filters.current[deck];
      if (!eq || !filter) return;

      if (stem === 'vocals') {
        const isMuted = stemMutes.current[deck].vocals;
        eq.mid.value = isMuted ? 0 : -12;
        eq.high.value = isMuted ? 0 : -6;
        stemMutes.current[deck].vocals = !isMuted;
        console.log(`[AudioEngine] Deck ${deck}: Vocals ${isMuted ? 'enabled' : 'killed'} (EQ-based)`);
      } else if (stem === 'drums') {
        const isMuted = stemMutes.current[deck].drums;
        filter.type = isMuted ? 'lowpass' : 'highpass';
        filter.frequency.value = isMuted ? 20000 : 150;
        stemMutes.current[deck].drums = !isMuted;
        console.log(`[AudioEngine] Deck ${deck}: Drums ${isMuted ? 'enabled' : 'killed'} (EQ-based)`);
      }
      return;
    }

    // Toggle mute for real stem
    const isMuted = stemMutes.current[deck][stem];
    stemMutes.current[deck][stem] = !isMuted;

    // Set volume to 0 if muted, 1 if unmuted
    const targetVolume = isMuted ? 1 : 0; // Inverted: if currently muted, unmute (set to 1)
    player.volume.rampTo(targetVolume, 0.05);

    console.log(`[AudioEngine] Deck ${deck}: ${stem} ${isMuted ? 'unmuted' : 'muted'}`);
  }, []);

  // Get stem mute state
  const getStemMuteState = useCallback((deck: 'A' | 'B') => {
    return { ...stemMutes.current[deck] };
  }, []);

  const getMasterBus = useCallback(() => ({
    bus: masterBus.current,
    postFx: postFxBus.current,
  }), []);

  // Update deck volumes when store changes
  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckVolume('A', deckA.volume);
  }, [deckA.volume, setDeckVolume]);

  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckVolume('B', deckB.volume);
  }, [deckB.volume, setDeckVolume]);

  // Update deck EQs when store changes
  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckEQ('A', deckA.eq);
  }, [deckA.eq, setDeckEQ]);

  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckEQ('B', deckB.eq);
  }, [deckB.eq, setDeckEQ]);

  // Update deck filters when store changes
  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckFilter('A', deckA.filter ?? 0.5);
  }, [deckA.filter, setDeckFilter]);

  useEffect(() => {
    if (!isInitialized.current) return;
    setDeckFilter('B', deckB.filter ?? 0.5);
  }, [deckB.filter, setDeckFilter]);

  // Cleanup on unmount
  useEffect(() => {
    const playersToDispose = { ...players.current };
    const channelsToDispose = { ...channels.current };
    const eqsToDispose = { ...eqs.current };
    const filtersToDispose = { ...filters.current };
    const crossFadeToDispose = crossFade.current;
    const masterBusToDispose = masterBus.current;
    const postFxBusToDispose = postFxBus.current;
    const compressorToDispose = compressor.current;
    const limiterToDispose = limiter.current;
    
    return () => {
      playersToDispose.A?.dispose();
      playersToDispose.B?.dispose();
      channelsToDispose.A?.dispose();
      channelsToDispose.B?.dispose();
      eqsToDispose.A?.dispose();
      eqsToDispose.B?.dispose();
      filtersToDispose.A?.dispose();
      filtersToDispose.B?.dispose();
      crossFadeToDispose?.dispose();
      masterBusToDispose?.dispose();
      postFxBusToDispose?.dispose();
      compressorToDispose?.dispose();
      limiterToDispose?.dispose();
    };
  }, []);

  // Play deck (handles both regular tracks and stems)
  const play = useCallback((deck: 'A' | 'B') => {
    const stateDeck = deck === 'A' ? deckA : deckB;
    const player = players.current[deck];
    const beatGrid = stateDeck.trackData?.beatGrid;

    // If quantization possible, schedule to next beat using Tone.Transport
    if (player && player.loaded && beatGrid && beatGrid.length > 0) {
      const secondsPerBeat = 60 / masterBpm;
      const currentTime = Tone.Transport.seconds;
      const nextBeatOffset = secondsPerBeat - (currentTime % secondsPerBeat);
      const startAt = Tone.now() + nextBeatOffset;
      player.start(startAt);
      console.log(`[AudioEngine] Deck ${deck} quantized start in ${nextBeatOffset.toFixed(3)}s`);
      return;
    }

    // Check if stems are loaded
    const hasStems = Object.values(stemPlayers.current[deck]).some(p => p !== null);
    
    if (hasStems) {
      // Play all unmuted stems
      Object.entries(stemPlayers.current[deck]).forEach(([stemType, player]) => {
        if (player && player.loaded && !stemMutes.current[deck][stemType as keyof typeof stemMutes.current['A']]) {
          player.start();
        }
      });
      console.log(`[AudioEngine] Deck ${deck} playing (stems)`);
    } else {
      // Fallback to main player
      const player = players.current[deck];
      if (player && player.loaded) {
        player.start();
        console.log(`[AudioEngine] Deck ${deck} playing`);
      } else {
        console.warn(`[AudioEngine] Cannot play Deck ${deck} - track not loaded`);
      }
    }
  }, [deckA, deckB, masterBpm]);

  // Pause deck (handles both regular tracks and stems)
  const pause = useCallback((deck: 'A' | 'B') => {
    // Check if stems are loaded
    const hasStems = Object.values(stemPlayers.current[deck]).some(p => p !== null);
    
    if (hasStems) {
      // Stop all stem players
      Object.values(stemPlayers.current[deck]).forEach(player => {
        player?.stop();
      });
      console.log(`[AudioEngine] Deck ${deck} paused (stems)`);
    } else {
      // Fallback to main player
      const player = players.current[deck];
      if (player) {
        player.stop();
        console.log(`[AudioEngine] Deck ${deck} paused`);
      }
    }
  }, []);

  // Stop deck (handles both regular tracks and stems)
  const stop = useCallback((deck: 'A' | 'B') => {
    // Check if stems are loaded
    const hasStems = Object.values(stemPlayers.current[deck]).some(p => p !== null);
    
    if (hasStems) {
      // Stop and seek all stem players
      Object.values(stemPlayers.current[deck]).forEach(player => {
        if (player) {
          player.stop();
          player.seek(0);
        }
      });
      console.log(`[AudioEngine] Deck ${deck} stopped (stems)`);
    } else {
      // Fallback to main player
      const player = players.current[deck];
      if (player) {
        player.stop();
        player.seek(0);
        console.log(`[AudioEngine] Deck ${deck} stopped`);
      }
    }
  }, []);

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
    toggleStem,
    getStemMuteState,
    getMasterBus,
    getDeckDuration,
    getTransportSeconds,
  };
};
