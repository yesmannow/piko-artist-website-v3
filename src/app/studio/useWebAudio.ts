'use client';

import { useRef, useCallback, useState } from 'react';
import { isHarmonicMatch as checkHarmonicMatch } from '@/lib/camelot';
import type { StemKey, TrackMeta } from './tracks';

export type DeckId = 'A' | 'B';

interface DeckNodes {
  source: AudioBufferSourceNode | null;
  gainVol: GainNode;
  gainCross: GainNode;
  eqHigh: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqLow: BiquadFilterNode;
  analyser: AnalyserNode;
}

interface StemNodes {
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  muted: boolean;
  __buffer?: AudioBuffer; 
}

interface DeckState {
  isPlaying: boolean;
  currentTime: number;
  buffer: AudioBuffer | null;
  startedAt: number;
  pausedAt: number;
  stems: Partial<Record<StemKey, StemNodes>>;
  hasStemsLoaded: boolean;
  usingStemsMode: boolean;
  camelotKey: string | null;
}

export interface WebAudioState {
  deckA: DeckState;
  deckB: DeckState;
  crossfade: number; // 0 = full A, 1 = full B
  isHarmonicMatch: boolean;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_DECK: DeckState = {
  isPlaying: false,
  currentTime: 0,
  buffer: null,
  startedAt: 0,
  pausedAt: 0,
  stems: {},
  hasStemsLoaded: false,
  usingStemsMode: false,
  camelotKey: null,
};

export function useWebAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ A: DeckNodes | null; B: DeckNodes | null }>({ A: null, B: null });
  const crossfadeRef = useRef(0.5);

  const [state, setState] = useState<WebAudioState>({
    deckA: { ...DEFAULT_DECK },
    deckB: { ...DEFAULT_DECK },
    crossfade: 0.5,
    isHarmonicMatch: false,
    isLoading: false,
    error: null,
  });

  /** Get or create AudioContext (requires user gesture) */
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext({ sampleRate: 44100 });
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  /** Build the audio graph for one deck */
  const buildDeckNodes = useCallback((ctx: AudioContext, side: DeckId): DeckNodes => {
    const gainVol = ctx.createGain();
    gainVol.gain.value = 0.8;

    const gainCross = ctx.createGain();
    gainCross.gain.value = side === 'A' ? 1 : 0;

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 10000;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 0.8;

    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 200;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    gainVol.connect(eqHigh);
    eqHigh.connect(eqMid);
    eqMid.connect(eqLow);
    eqLow.connect(gainCross);
    gainCross.connect(analyser);
    analyser.connect(ctx.destination);

    return { source: null, gainVol, gainCross, eqHigh, eqMid, eqLow, analyser };
  }, []);

  /** Initialize audio context and graph */
  const init = useCallback(() => {
    const ctx = getCtx();
    if (!nodesRef.current.A) {
      nodesRef.current.A = buildDeckNodes(ctx, 'A');
    }
    if (!nodesRef.current.B) {
      nodesRef.current.B = buildDeckNodes(ctx, 'B');
    }
  }, [getCtx, buildDeckNodes]);

  /** Fetch and decode an audio file */
  const decodeUrl = useCallback(async (url: string): Promise<AudioBuffer> => {
    const ctx = getCtx();
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    return ctx.decodeAudioData(arrayBuffer);
  }, [getCtx]);

  /** Update Fusion FX based on crossfader position */
  const updateFusionFX = useCallback((cf: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const nodes = nodesRef.current;
    
    // Crossfader Fusion™ Logic:
    // Outgoing Deck A (if moving A->B, CF > 0.4)
    // Incoming Deck B (if moving A->B, CF > 0.4)
    // Low Shelf -6dB for Drums/Bass, +2dB Boost for Vocals
    
    const applyFusion = (deckId: DeckId, active: boolean) => {
      const dNodes = nodes[deckId];
      if (!dNodes) return;
      
      const targetLow = active ? -6 : 0;
      dNodes.eqLow.gain.setTargetAtTime(targetLow, ctx.currentTime, 0.1);
      
      // Also apply to stems if loaded
      const stateKey = deckId === 'A' ? 'deckA' : 'deckB';
      const deckState = state[stateKey];
      if (deckState.hasStemsLoaded) {
        // Boost vocals +2dB (1.25 gain)
        const vStem = deckState.stems.vocals;
        if (vStem) {
          vStem.gain.gain.setTargetAtTime(active ? 1.25 : 1.0, ctx.currentTime, 0.1);
        }
        // Cut drums/bass -6dB (0.5 gain)
        ['drums', 'bass'].forEach(s => {
          const stem = deckState.stems[s as StemKey];
          if (stem) {
            stem.gain.gain.setTargetAtTime(active ? 0.5 : 1.0, ctx.currentTime, 0.1);
          }
        });
      }
    };

    // If CF > 0.4, Deck A is "outgoing"
    applyFusion('A', cf > 0.4);
    // If CF < 0.6, Deck B is "incoming" (but only if we are actually mixing)
    // Actually, usually you want the incoming deck to have bass cut until the swap
    applyFusion('B', cf < 0.6);
  }, [state]);

  /** Load a track into a deck */
  const loadTrack = useCallback(async (deckId: DeckId, track: TrackMeta) => {
    init();
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const buffer = await decodeUrl(track.url);
      const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
      // Stop existing source
      const nodes = nodesRef.current[deckId];
      if (nodes?.source) {
        try { nodes.source.stop(); } catch { /* ignore */ }
        nodes.source.disconnect();
        nodes.source = null;
      }
      setState(s => {
        const otherDeckKey = deckId === 'A' ? 'deckB' : 'deckA';
        const otherKey = s[otherDeckKey].camelotKey;
        const harmonMatch = track.key && otherKey ? checkHarmonicMatch(track.key, otherKey) : false;
        
        return {
          ...s,
          isLoading: false,
          isHarmonicMatch: harmonMatch,
          [deckKey]: {
            ...DEFAULT_DECK,
            buffer,
            camelotKey: track.key,
            stems: s[deckKey].stems,
            hasStemsLoaded: s[deckKey].hasStemsLoaded,
          },
        };
      });
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: String(e) }));
    }
  }, [init, decodeUrl]);

  /** Start playback of a deck */
  const play = useCallback((deckId: DeckId) => {
    const ctx = getCtx();
    init();
    const nodes = nodesRef.current[deckId];
    if (!nodes) return;
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';

    setState(s => {
      const deck = s[deckKey];
      if (!deck.buffer || deck.isPlaying) return s;

      // Stop old source
      if (nodes.source) {
        try { nodes.source.stop(); } catch { /* ignore */ }
        nodes.source.disconnect();
      }

      const source = ctx.createBufferSource();
      source.buffer = deck.buffer;
      source.loop = false;
      source.connect(nodes.gainVol);
      source.start(0, deck.pausedAt);
      nodes.source = source;

      const startedAt = ctx.currentTime - deck.pausedAt;
      return { ...s, [deckKey]: { ...deck, isPlaying: true, startedAt, pausedAt: 0 } };
    });
  }, [getCtx, init]);

  /** Pause a deck */
  const pause = useCallback((deckId: DeckId) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const nodes = nodesRef.current[deckId];
    if (!nodes) return;
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';

    setState(s => {
      const deck = s[deckKey];
      if (!deck.isPlaying) return s;
      const pausedAt = ctx.currentTime - deck.startedAt;
      if (nodes.source) {
        try { nodes.source.stop(); } catch { /* ignore */ }
        nodes.source.disconnect();
        nodes.source = null;
      }
      return { ...s, [deckKey]: { ...deck, isPlaying: false, pausedAt } };
    });
  }, []);

  /** Set crossfader position 0–1 */
  const setCrossfade = useCallback((value: number) => {
    crossfadeRef.current = value;
    const nodes = nodesRef.current;
    if (nodes.A) nodes.A.gainCross.gain.value = 1 - value;
    if (nodes.B) nodes.B.gainCross.gain.value = value;
    
    updateFusionFX(value);
    
    setState(s => ({ ...s, crossfade: value }));
  }, [updateFusionFX]);


  /** Set volume 0–1 for a deck */
  const setVolume = useCallback((deckId: DeckId, value: number) => {
    const nodes = nodesRef.current[deckId];
    if (nodes) nodes.gainVol.gain.value = value;
  }, []);

  /** Set EQ gain in dB (band: high | mid | low) */
  const setEQ = useCallback((deckId: DeckId, band: 'high' | 'mid' | 'low', dbGain: number) => {
    const nodes = nodesRef.current[deckId];
    if (!nodes) return;
    if (band === 'high') nodes.eqHigh.gain.value = dbGain;
    else if (band === 'mid') nodes.eqMid.gain.value = dbGain;
    else nodes.eqLow.gain.value = dbGain;
  }, []);

  /** Load stems for a deck (pre-fetch all 4 stems) */
  const loadStems = useCallback(async (deckId: DeckId, stemUrls: Record<StemKey, string>) => {
    init();
    const ctx = getCtx();
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    const nodes = nodesRef.current[deckId];
    if (!nodes) return;

    const stemKeys: StemKey[] = ['vocals', 'drums', 'bass', 'other'];
    const stemNodes: Partial<Record<StemKey, StemNodes>> = {};

    await Promise.all(stemKeys.map(async (stem) => {
      const url = stemUrls[stem];
      const res = await fetch(url);
      const ab = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(ab);
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1;
      gainNode.connect(nodes.gainVol);
      stemNodes[stem] = { source: null, gain: gainNode, muted: false, __buffer: buffer };
    }));

    setState(s => ({
      ...s,
      [deckKey]: { ...s[deckKey], stems: stemNodes, hasStemsLoaded: true },
    }));
  }, [init, getCtx]);

  /** Toggle stem mute */
  const toggleStem = useCallback((deckId: DeckId, stem: StemKey) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    setState(s => {
      const deck = s[deckKey];
      const stemNode = deck.stems[stem];
      if (!stemNode) return s;
      const muted = !stemNode.muted;
      stemNode.gain.gain.value = muted ? 0 : 1;
      return {
        ...s,
        [deckKey]: {
          ...deck,
          stems: { ...deck.stems, [stem]: { ...stemNode, muted } },
        },
      };
    });
  }, []);

  /** Get the AnalyserNode for a deck (for waveform drawing) */
  const getAnalyser = useCallback((deckId: DeckId): AnalyserNode | null => {
    return nodesRef.current[deckId]?.analyser ?? null;
  }, []);

  /** Get current playback time for a deck */
  const getPlaybackTime = useCallback((_deckId: DeckId): number => {
    const ctx = ctxRef.current;
    // We need to read state directly for this — expose a ref-based approach
    return ctx ? ctx.currentTime : 0;
  }, []);

  return {
    state,
    init,
    loadTrack,
    play,
    pause,
    setCrossfade,
    setVolume,
    setEQ,
    loadStems,
    toggleStem,
    getAnalyser,
    getPlaybackTime,
  };
}
