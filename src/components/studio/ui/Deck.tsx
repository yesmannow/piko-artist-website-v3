"use client";

/**
 * Deck Component
 *
 * Displays track information, transport controls, and deck status
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useStore, type DeckState } from '@/store/useStore';
import { useCyaniteRecommendations, type Recommendation } from '@/hooks/useCyaniteRecommendations';
import { useStemWorker } from '@/hooks/useStemWorker';
import { Play, Pause, Square, SkipBack, SkipForward, Wand2, Loader2, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { RecommendationsPopover } from './RecommendationsPopover';
import { StemRack } from './StemRack';
import { JogWheel } from './JogWheel';
import { WaveformMini } from './WaveformMini';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { calculateNewBpm } from '@/lib/utils/audioMath';
import { useStudioStore } from '@/store/useStudioStore';
import { decodeStemsToAudioBuffers } from '@/utils/stems/decodeStems';
import type { PikoTestHelpers } from '@/utils/testHelpers';
import { StateBadge } from '@/components/ui/StateBadge';

// complexity mode is passed as a prop; keep the prop shape immutable
interface DeckProps {
  readonly deckId: 'A' | 'B';
  readonly showMiniWaveform?: boolean;
  readonly complexityMode?: 'simple' | 'pro';
}

const UI_UPDATE_INTERVAL_MS = 50;
const STORE_UPDATE_INTERVAL_MS = 33;
const PROGRESS_EPSILON = 0.005;

type StemKey = 'vocals' | 'drums' | 'bass' | 'other';
type StemBufferMap = Record<StemKey, AudioBuffer | null>;

type DeckWindow = Window & {
  __PIKO_TEST_HELPERS__?: PikoTestHelpers;
};


export function Deck({ deckId, showMiniWaveform = true, complexityMode = 'pro' }: DeckProps) {
  const { play, pause, stop, seekTo, getPlaybackPosition, getDeckDuration, loadStems, syncToBpm, triggerTapeStop } = useAudioEngine();
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]) as DeckState;
  const isAppActive = useStore((state) => state.isAppActive);
  const masterBpm = useStore((state) => state.masterBpm);
  const setDeckPlaying = useStore((state) => state.setDeckPlaying);
  const setKeyLock = useStore((state) => state.setKeyLock);
  const updateDeckTime = useStudioStore((state) => state.updateDeckTime);
  const setDeckDurationStore = useStudioStore((state) => state.setDeckDuration);
  const stemsForDeck = useStudioStore((state) => state.stems[deckId]);
  const setStems = useStudioStore((state) => state.setStems);
  const markStemsReady = useStudioStore((state) => state.markStemsReady);
  const focusedDeckId = useStudioStore((state) => state.focusedDeckId);
  const stemGenerationRequest = useStudioStore((state) => state.stemGenerationRequest);
  const autoStem = useStudioStore((state) => state.autoStem);
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);
  const { getRecommendations, loading: recommendationsLoading } = useCyaniteRecommendations();
  const stemModelUrl = process.env.NEXT_PUBLIC_STEM_MODEL_URL ?? '/models/stems.onnx';
  const {
    init: initStemWorker,
    initializing: stemInitializing,
    error: stemWorkerError,
    separate: separateStems,
  } = useStemWorker(stemModelUrl);

  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGeneratingStems, setIsGeneratingStems] = useState(false);
  const [stemError, setStemError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [deckDuration, setDeckDuration] = useState(0);
  const [deckReady, setDeckReady] = useState(false);
  const lastUiUpdateRef = useRef(0);
  const lastStoreUpdateRef = useRef(0);
  const progressRef = useRef(0);
  const durationRef = useRef(0);
  const decodeContextRef = useRef<AudioContext | null>(null);
  const autoStemRef = useRef(false);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const deckReadyRef = useRef(false);
  const scratchState = useRef<{
    centerX: number;
    centerY: number;
    lastAngle: number;
    wasPlaying: boolean;
    position: number;
  } | null>(null);

  const deckColor = deckId === 'A' ? 'bg-studio-cyan' : 'bg-studio-purple';
  const jogAccent = deckId === 'A' ? '#22d3ee' : '#a855f7';
  const deckLabel = `DECK ${deckId}`;
  const trackData = deck.trackData ?? null;
  const pitchDelta = (deck.playbackRate || 1) - 1;
  const currentBpm = trackData ? calculateNewBpm(trackData.bpm, pitchDelta) : null;
  const isSynced =
    currentBpm !== null && Math.abs(currentBpm - masterBpm) < 0.5;
  const isKeyLockActive = deck.isKeyLockActive;
  const energy = trackData?.energy ?? 0;
  const energyLevel = Math.min(1, Math.max(0, energy / 1.2));
  const isLoaded = deck.isLoaded;
  const fallbackBpm = trackData ? trackData.bpm : undefined;
  const hasStems = Object.values(stemsForDeck).some(Boolean);
  const canGenerateStems = Boolean(trackData?.url) && !isGeneratingStems && !hasStems && !stemInitializing;
  const isFocused = focusedDeckId === deckId;
  const showInlineStemControls = hasStems && !stemModeEnabled;

  useEffect(() => {
    // guard for SSR / missing browser APIs
  const Global = typeof globalThis === 'undefined' ? undefined : (globalThis as unknown as Window & { ResizeObserver?: typeof ResizeObserver });
    if (Global?.ResizeObserver === undefined) return;
    const el = deckRef.current;
    if (!el) return;

    const updateReady = (ready: boolean, width?: number, height?: number) => {
      if (deckReadyRef.current === ready) return;
      if (ready) {
        console.info(`[Deck:${deckId}] ready (w:${width ?? 'n/a'}, h:${height ?? 'n/a'})`);
      } else {
        console.warn(`[Deck:${deckId}] became not-ready (w:${width ?? 'n/a'}, h:${height ?? 'n/a'})`);
      }
      deckReadyRef.current = ready;
      setDeckReady(ready);
      // prefer dataset for data-* attributes
      el.dataset.deckReady = ready ? 'true' : 'false';
    };

    const testHelpers = (globalThis as unknown as DeckWindow).__PIKO_TEST_HELPERS__;
    if (testHelpers?.forceDeckLayout) {
      testHelpers.forceDeckLayout(deckId);
    }

    const ro = new Global.ResizeObserver((entries: ReadonlyArray<ResizeObserverEntry>) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        updateReady(width > 8 && height > 8, width, height);
      }
    });

    ro.observe(el);

    const rect = el.getBoundingClientRect();
    updateReady(rect.width > 8 && rect.height > 8, rect.width, rect.height);

    return () => {
      ro.disconnect();
    };
  }, [deckId]);

  const handleMagicWand = async () => {
    if (!trackData) return;

    try {
      const recs = await getRecommendations(trackData.bpm, trackData.energy || 0.5);
      setRecommendations(recs);
      setShowRecommendations(true);
    } catch (error) {
      console.error('[Deck] Failed to get recommendations:', error);
    }
  };

  const handleLoadRecommendation = async (targetDeck: 'A' | 'B', rec: { id: string; title: string; artist: string; bpm: number; key: string; mood: { aggressive: number; chill: number } }) => {
    // For now, we'll just show a message since we don't have the actual track URL
    // In a real implementation, you'd need to map Cyanite IDs to your track URLs
    console.log(`[Deck] Would load recommendation: ${rec.title} to Deck ${targetDeck}`);
  // Mapping Cyanite recommendation to an actual track URL requires backend support.
  };

  const handleSplitStems = useCallback(async () => {
    if (!trackData?.url) return;
    setStemError(null);
    setIsGeneratingStems(true);

    try {
      await initStemWorker();

      const response = await fetch(trackData.url);
      const arrayBuffer = await response.arrayBuffer();
    const LocalGlobal = globalThis as any;
    const AudioContextCtor = LocalGlobal.AudioContext ?? LocalGlobal.webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error('AudioContext is not supported in this browser');
      }
      const decodeContext = decodeContextRef.current ?? new AudioContextCtor();
      decodeContextRef.current = decodeContext;
      const decoded = await decodeContext.decodeAudioData(arrayBuffer.slice(0));

      const channels = Math.min(decoded.numberOfChannels, 2);
      const length = decoded.length;
      const mono = new Float32Array(new ArrayBuffer(length * Float32Array.BYTES_PER_ELEMENT));
      for (let ch = 0; ch < channels; ch++) {
        const data = decoded.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          mono[i] += data[i] / channels;
        }
      }

      const stemJobId = deck.trackId ?? trackData.url;
      const stems = await separateStems(stemJobId, mono.buffer, 1);
      if (!stems || Object.keys(stems).length === 0) {
        throw new Error('Stem separation returned no data');
      }

      const decodedBuffers = decodeStemsToAudioBuffers(stems, decodeContext);
      const stemBuffers: StemBufferMap = {
        vocals: decodedBuffers.vocals ?? null,
        drums: decodedBuffers.drums ?? null,
        bass: decodedBuffers.bass ?? null,
        other: decodedBuffers.other ?? null,
      };

      if (!stemBuffers || Object.keys(stemBuffers).length === 0 || !Object.values(stemBuffers).some(Boolean)) {
        console.warn('[Deck] No stem buffers available, skipping loadStems');
      } else {
        await loadStems(deckId, stemBuffers);
        setStems(deckId, stemBuffers);
        if (trackData?.trackId) {
          markStemsReady(trackData.trackId, true);
        }
        console.log('[Deck] Stems loaded into audio engine');
      }
    } catch (error) {
      console.error('[Deck] Failed to generate stems:', error);
      setStemError(error instanceof Error ? error.message : 'Stem generation failed');
    } finally {
      setIsGeneratingStems(false);
    }
  }, [
    deck.trackId,
    deckId,
    initStemWorker,
    loadStems,
    markStemsReady,
    separateStems,
    setStems,
    trackData?.trackId,
    trackData?.url,
  ]);

  useEffect(() => {
    // prefer optional chain for concision
    if (stemGenerationRequest?.deck !== deckId) return;
    if (canGenerateStems) {
      handleSplitStems();
    }
  }, [canGenerateStems, deckId, handleSplitStems, stemGenerationRequest]);

  useEffect(() => {
    if (!autoStem || !trackData?.url || !deck.isLoaded) {
      autoStemRef.current = false;
      return;
    }
    if (autoStemRef.current || hasStems || !canGenerateStems) return;
    autoStemRef.current = true;
    handleSplitStems();
  }, [autoStem, canGenerateStems, deck.isLoaded, handleSplitStems, hasStems, trackData?.url]);

  const handlePlay = () => {
    play(deckId);
    setDeckPlaying(deckId, true);
  };

  const handlePause = () => {
    pause(deckId);
    setDeckPlaying(deckId, false);
  };

  const handleStop = () => {
    stop(deckId);
    setDeckPlaying(deckId, false);
  };

  const handleSeek = (seconds: number) => {
    const currentPos = getPlaybackPosition(deckId);
    seekTo(deckId, Math.max(0, currentPos + seconds));
  };

  const handleScratchStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!trackData) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

    scratchState.current = {
      centerX,
      centerY,
      lastAngle: angle,
      wasPlaying: deck.isPlaying,
      position: getPlaybackPosition(deckId),
    };

    if (deck.isPlaying) {
      pause(deckId);
      setDeckPlaying(deckId, false);
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleScratchMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scratchState.current) return;
    const { centerX, centerY } = scratchState.current;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    let delta = angle - scratchState.current.lastAngle;

    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    scratchState.current.lastAngle = angle;

    const duration = getDeckDuration(deckId);
    const scratchScale = 0.6; // seconds per radian of platter travel
    const nextPosition = Math.max(
      0,
      Math.min(duration, scratchState.current.position + delta * scratchScale)
    );

    scratchState.current.position = nextPosition;
    seekTo(deckId, nextPosition);
  };

  const handleScratchEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = scratchState.current;
    if (!state) return;
    scratchState.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (state.wasPlaying) {
      play(deckId);
      setDeckPlaying(deckId, true);
    }
  };

  useEffect(() => {
    let frameId: number;
    const Global = globalThis as any;
    const studioDeckKey = deckId === 'A' ? 'deckA' : 'deckB';
    const tick = (time: number) => {
      if (!isAppActive) {
        frameId = Global.requestAnimationFrame(tick);
        return;
      }
      const duration = getDeckDuration(deckId);
      const position = getPlaybackPosition(deckId);
      const nextProgress = duration > 0 ? Math.min(1, position / duration) : 0;

      if (time - lastStoreUpdateRef.current >= STORE_UPDATE_INTERVAL_MS) {
        updateDeckTime(studioDeckKey, position);
        if (Math.abs(duration - durationRef.current) > 0.1) {
          setDeckDurationStore(studioDeckKey, duration);
        }
        lastStoreUpdateRef.current = time;
      }

      const progressDelta = Math.abs(nextProgress - progressRef.current);
      const durationDelta = Math.abs(duration - durationRef.current);
      if (
        time - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS ||
        progressDelta >= PROGRESS_EPSILON ||
        durationDelta >= 0.1
      ) {
        progressRef.current = nextProgress;
        durationRef.current = duration;
        setProgress(nextProgress);
        setDeckDuration(duration);
        lastUiUpdateRef.current = time;
      }

        frameId = Global.requestAnimationFrame(tick);
    };
    frameId = Global.requestAnimationFrame(tick);
    return () => {
      Global.cancelAnimationFrame(frameId);
    };
  }, [deckId, getDeckDuration, getPlaybackPosition, isAppActive, setDeckDurationStore, updateDeckTime]);

  // compute a few derived classNames/titles to avoid nested ternaries in JSX
  const keyLockClass = (() => {
    if (isKeyLockActive) {
      if (deckId === 'A') return 'bg-studio-cyan/20 border-studio-cyan text-studio-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]';
      return 'bg-studio-purple/20 border-studio-purple text-studio-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]';
    }
    return 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white';
  })();

  const energyFilledClass = (filled: boolean) => {
    if (!filled) return 'bg-white/10';
    return deckId === 'A' ? 'bg-studio-cyan shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-studio-purple shadow-[0_0_8px_rgba(168,85,247,0.6)]';
  };

  let stemButtonTitle = 'Split track into stems';
  if (stemWorkerError) stemButtonTitle = `Stem worker error: ${stemWorkerError}`;
  else if (stemInitializing) stemButtonTitle = 'Loading stem model...';

  return (
    <div
      ref={deckRef}
      className={`deck deck-full h-full ${isFocused ? 'deck-focused' : ''}`}
      data-stems-ready={hasStems ? 'true' : 'false'}
      data-deck-id={deckId}
      data-deck-ready={deckReady ? 'true' : 'false'}
    >
      <GlassPanel
        depth="deck"
        intensity="high"
        accentColor={deckId === 'A' ? '#22d3ee' : '#a855f7'}
        className="h-full flex flex-col bg-obsidian-900/80 rounded-lg p-6"
      >
      {/* Deck Header */}
          <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${deckColor}`} />
          <h2 className="text-lg font-black uppercase font-mono">{deckLabel}</h2>
          <StateBadge type={deck.isPlaying ? 'playing' : 'idle'} />
        </div>
        {trackData && (
          <div
            className={`text-xs font-mono flex items-center gap-3 ${
              isSynced ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.65)]' : 'text-white/60'
            }`}
          >
            {currentBpm?.toFixed(2)} BPM
            {isSynced && <span className="ml-1 text-[10px] text-white">(MT)</span>}
            <button
              onClick={() => setKeyLock(deckId, !isKeyLockActive)}
              className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.2em] border transition-all ${keyLockClass}`}
              title="Master Tempo / Key Lock"
            >
              MT
            </button>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => {
                const filled = energyLevel * 5 > i;
                return (
                  <span
                    key={i}
                    className={`w-1.5 h-3 rounded-sm transition-all duration-300 ${energyFilledClass(filled)}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deck Body */}
      {trackData ? (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-6">
          <div className="flex flex-col items-center gap-5">
            <JogWheel
              artworkUrl={trackData.cover || trackData.artUrl}
              title={trackData.title}
              progress={progress}
              isPlaying={deck.isPlaying}
              bpm={currentBpm ?? undefined}
              isSynced={isSynced}
              accent={jogAccent}
              loading={!isLoaded}
              onPointerDown={handleScratchStart}
              onPointerMove={handleScratchMove}
              onPointerUp={handleScratchEnd}
              onPointerCancel={handleScratchEnd}
            />
            <div className="grid grid-cols-2 gap-3 w-full">
              {['HOT CUE 1', 'HOT CUE 2', 'HOT CUE 3', 'HOT CUE 4'].map((pad) => (
                <button
                  key={pad}
                  className="py-3 rounded-lg bg-linear-to-b from-[#0f1118] to-[#07080e] border border-white/10 text-xs font-mono uppercase tracking-[0.24em] hover:border-studio-cyan/50 transition-colors"
                >
                  {pad}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white truncate">{trackData.title}</h3>
                <p className="text-sm text-white/60">{trackData.artist}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                  <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 flex items-center justify-between">
                    <span>BPM</span>
                    <span className="text-white">{Math.round(trackData.bpm)}</span>
                  </div>
                  {complexityMode === 'pro' && (
                    <>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 flex items-center justify-between">
                        <span>Key</span>
                        <span className="text-white">{trackData.key || '---'}</span>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 flex items-center justify-between">
                        <span>Energy</span>
                        <span className="text-white">{trackData.energy ? Math.round(trackData.energy * 100) : '--'}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {complexityMode === 'pro' && (
                  <motion.button
                    onClick={handleMagicWand}
                    disabled={recommendationsLoading}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Get similar track recommendations"
                  >
                    {recommendationsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-studio-cyan" />
                    ) : (
                      <Wand2 className="w-4 h-4 text-studio-cyan" />
                    )}
                  </motion.button>
                )}
                {!stemModeEnabled && complexityMode === 'pro' && (
                  <motion.button
                    onClick={handleSplitStems}
                    disabled={!canGenerateStems}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                    whileHover={canGenerateStems ? { scale: 1.05 } : {}}
                    whileTap={canGenerateStems ? { scale: 0.95 } : {}}
                    title={stemButtonTitle}
                    data-testid="generate-stems"
                  >
                    {isGeneratingStems ? (
                      <Loader2 className="w-4 h-4 animate-spin text-studio-purple" />
                    ) : (
                      <Scissors className={`w-4 h-4 ${canGenerateStems ? 'text-studio-purple' : 'text-white/30'}`} />
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {isGeneratingStems && (
              <div className="mb-2 flex items-center gap-2 text-xs text-white/60">
                <Loader2 className="h-3 w-3 animate-spin text-studio-purple" />
                <span>Generating stems...</span>
              </div>
            )}

            {(stemError || stemWorkerError) && (
              <div className="mb-2 text-xs text-red-400">
                {stemError ?? stemWorkerError}
              </div>
            )}

            {showInlineStemControls && <StemRack deckId={deckId} compact={false} />}

            <div className="flex items-center justify-center gap-3 mt-auto flex-wrap">
              <motion.button
                onClick={() => handleSeek(-10)}
                className="p-3 rounded-xl bg-linear-to-b from-[#1f1f1f] to-obsidian-900 border border-white/10 hover:border-studio-cyan/40 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SkipBack className="w-4 h-4" />
              </motion.button>

              {deck.isPlaying ? (
                <motion.button
                  onClick={handlePause}
                  className="p-5 rounded-2xl bg-linear-to-b from-studio-purple to-[#3b0f6e] text-white font-black uppercase shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Pause className="w-6 h-6" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handlePlay}
                  className="p-5 rounded-2xl bg-linear-to-b from-studio-cyan to-[#0b5d66] text-white font-black uppercase shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-6 h-6" />
                </motion.button>
              )}

              <motion.button
                onClick={() => syncToBpm(deckId)}
                disabled={!trackData?.bpm}
                className={`px-4 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest transition-colors ${
                  isSynced
                    ? 'border-white/80 text-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                    : 'border-white/10 text-white/60 hover:border-white/40 hover:text-white'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                whileHover={trackData?.bpm ? { scale: 1.05 } : {}}
                whileTap={trackData?.bpm ? { scale: 0.95 } : {}}
              >
                SYNC
              </motion.button>

              <motion.button
                onClick={handleStop}
                className="p-3 rounded-xl bg-linear-to-b from-[#1f1f1f] to-obsidian-900 border border-white/10 hover:border-studio-purple/40 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Square className="w-4 h-4" />
              </motion.button>

              {complexityMode === 'pro' && (
                <motion.button
                  onClick={() => triggerTapeStop(deckId)}
                  disabled={!deck.isLoaded}
                  className="px-4 py-3 rounded-xl border border-white/12 bg-[#0c0c0f] text-xs font-mono uppercase tracking-[0.22em] text-white/80 hover:border-studio-purple/50 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  whileHover={deck.isLoaded ? { scale: 1.05 } : {}}
                  whileTap={deck.isLoaded ? { scale: 0.95 } : {}}
                >
                  Tape Stop
                </motion.button>
              )}

              <motion.button
                onClick={() => handleSeek(10)}
                className="p-3 rounded-xl bg-linear-to-b from-[#1f1f1f] to-obsidian-900 border border-white/10 hover:border-studio-cyan/40 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SkipForward className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span>Volume</span>
                <span className="font-mono">{Math.round(deck.volume * 100)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${deckColor} transition-all`}
                  style={{ width: `${deck.volume * 100}%` }}
                />
              </div>
            </div>

            {/* Mini Timeline */}
            {showMiniWaveform && trackData?.url && (
              <div className="mt-4">
              <WaveformMini
                url={trackData.url}
                color={deckId === 'A' ? '#22d3ee' : '#a855f7'}
                beatGrid={trackData.beatGrid}
                playhead={progress * deckDuration}
                durationSeconds={deckDuration}
                onSeek={(seconds) => handleSeek(seconds - getPlaybackPosition(deckId))}
              />
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <JogWheel
            progress={0}
            isPlaying={false}
            bpm={fallbackBpm}
            isSynced={false}
            accent={jogAccent}
            onClick={() => {
              (globalThis as any).dispatchEvent(new CustomEvent('studio:open-library'));
            }}
          />
          <p className="font-mono text-xs text-white/60 uppercase tracking-[0.3em]">Tap the wheel to load Deck {deckId}</p>
        </div>
      )}

      {/* Recommendations Popover */}
      <RecommendationsPopover
        recommendations={recommendations}
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        onLoadTrack={handleLoadRecommendation}
      />
      </GlassPanel>
    </div>
  );
}
