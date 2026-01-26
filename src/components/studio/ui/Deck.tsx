"use client";

/**
 * Deck Component
 * 
 * Displays track information, transport controls, and deck status
 */

import { useEffect, useRef, useState } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useStore, type DeckState } from '@/store/useStore';
import { useCyaniteRecommendations, type Recommendation } from '@/hooks/useCyaniteRecommendations';
import { useStemGenerator } from '@/hooks/useStemGenerator';
import { Play, Pause, Square, SkipBack, SkipForward, Wand2, Loader2, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { RecommendationsPopover } from './RecommendationsPopover';
import { StemControls } from './StemControls';
import { JogWheel } from './JogWheel';
import { WaveformMini } from './WaveformMini';
import { GlassPanel } from '@/components/ui/GlassPanel';

interface DeckProps {
  deckId: 'A' | 'B';
}

export function Deck({ deckId }: DeckProps) {
  const { play, pause, stop, seekTo, getPlaybackPosition, getDeckDuration, loadStems, syncToBpm, triggerTapeStop } = useAudioEngine();
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]) as DeckState;
  const isAppActive = useStore((state) => state.isAppActive);
  const masterBpm = useStore((state) => state.masterBpm);
  const setDeckPlaying = useStore((state) => state.setDeckPlaying);
  const setKeyLock = useStore((state) => state.setKeyLock);
  const { getRecommendations, loading: recommendationsLoading } = useCyaniteRecommendations();
  const { generateStems, isProcessing: isGeneratingStems, progress: stemProgress, error: stemError, isConfigured: audioShakeConfigured } = useStemGenerator();
  
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hasStems, setHasStems] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deckDuration, setDeckDuration] = useState(0);
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
  const trackData = deck.trackData as DeckState['trackData'] | null;
  const currentBpm = trackData ? trackData.bpm * (deck.playbackRate || 1) : null;
  const isSynced =
    currentBpm !== null && Math.abs(currentBpm - masterBpm) < 0.5;
  const isKeyLockActive = deck.isKeyLockActive;
  const energy = trackData?.energy ?? 0;
  const energyLevel = Math.min(1, Math.max(0, energy / 1.2));
  const isLoaded = deck.isLoaded;
  const fallbackBpm = trackData ? trackData.bpm : undefined;

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
    // TODO: Map Cyanite recommendation to actual track URL and load it
  };

  const handleSplitStems = async () => {
    if (!trackData?.url) return;

    try {
      const stems = await generateStems(trackData.url, trackData.title);
      if (stems) {
        setHasStems(true);
        // Load stems into audio engine
        await loadStems(deckId, stems);
        console.log('[Deck] Stems loaded into audio engine');
      }
    } catch (error) {
      console.error('[Deck] Failed to generate stems:', error);
    }
  };

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
    const tick = () => {
      if (!isAppActive) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }
      const duration = getDeckDuration(deckId);
      const position = getPlaybackPosition(deckId);
      const nextProgress = duration > 0 ? Math.min(1, position / duration) : 0;
      setProgress(nextProgress);
      setDeckDuration(duration);
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [deckId, getDeckDuration, getPlaybackPosition, isAppActive]);

  return (
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
              className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.2em] border transition-all ${
                isKeyLockActive
                  ? deckId === 'A'
                    ? 'bg-studio-cyan/20 border-studio-cyan text-studio-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                    : 'bg-studio-purple/20 border-studio-purple text-studio-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
              }`}
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
                    className={`w-1.5 h-3 rounded-sm transition-all duration-300 ${
                      filled ? (deckId === 'A' ? 'bg-studio-cyan shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-studio-purple shadow-[0_0_8px_rgba(168,85,247,0.6)]') : 'bg-white/10'
                    }`}
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
              artworkUrl={trackData.artUrl}
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
                  className="py-3 rounded-lg bg-gradient-to-b from-[#0f1118] to-[#07080e] border border-white/10 text-xs font-mono uppercase tracking-[0.24em] hover:border-studio-cyan/50 transition-colors"
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
                  <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 flex items-center justify-between">
                    <span>Key</span>
                    <span className="text-white">{trackData.key || '---'}</span>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 flex items-center justify-between">
                    <span>Energy</span>
                    <span className="text-white">{trackData.energy ? Math.round(trackData.energy * 100) : '--'}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                <motion.button
                  onClick={handleSplitStems}
                  disabled={isGeneratingStems || hasStems || !audioShakeConfigured}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                  whileHover={audioShakeConfigured ? { scale: 1.05 } : {}}
                  whileTap={audioShakeConfigured ? { scale: 0.95 } : {}}
                  title={audioShakeConfigured ? "Split track into stems" : "AudioShake API key not configured"}
                >
                  {isGeneratingStems ? (
                    <Loader2 className="w-4 h-4 animate-spin text-studio-purple" />
                  ) : (
                    <Scissors className={`w-4 h-4 ${audioShakeConfigured ? 'text-studio-purple' : 'text-white/30'}`} />
                  )}
                </motion.button>
              </div>
            </div>

            {isGeneratingStems && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Generating stems...</span>
                  <span className="font-mono">{Math.round(stemProgress)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-studio-purple transition-all"
                    style={{ width: `${stemProgress}%` }}
                  />
                </div>
              </div>
            )}

            {stemError && (
              <div className="mb-2 text-xs text-red-400">
                {stemError}
              </div>
            )}

            {hasStems && <StemControls deckId={deckId} />}

            <div className="flex items-center justify-center gap-3 mt-auto flex-wrap">
              <motion.button
                onClick={() => handleSeek(-10)}
                className="p-3 rounded-xl bg-gradient-to-b from-[#1f1f1f] to-[#0a0a0a] border border-white/10 hover:border-studio-cyan/40 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SkipBack className="w-4 h-4" />
              </motion.button>

              {deck.isPlaying ? (
                <motion.button
                  onClick={handlePause}
                  className="p-5 rounded-2xl bg-gradient-to-b from-studio-purple to-[#3b0f6e] text-white font-black uppercase shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Pause className="w-6 h-6" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handlePlay}
                  className="p-5 rounded-2xl bg-gradient-to-b from-studio-cyan to-[#0b5d66] text-white font-black uppercase shadow-[0_0_20px_rgba(34,211,238,0.4)]"
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
                whileHover={!trackData?.bpm ? {} : { scale: 1.05 }}
                whileTap={!trackData?.bpm ? {} : { scale: 0.95 }}
              >
                SYNC
              </motion.button>

              <motion.button
                onClick={handleStop}
                className="p-3 rounded-xl bg-gradient-to-b from-[#1f1f1f] to-[#0a0a0a] border border-white/10 hover:border-studio-purple/40 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Square className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={() => triggerTapeStop(deckId)}
                disabled={!deck.isLoaded}
                className="px-4 py-3 rounded-xl border border-white/12 bg-[#0c0c0f] text-xs font-mono uppercase tracking-[0.22em] text-white/80 hover:border-studio-purple/50 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={!deck.isLoaded ? {} : { scale: 1.05 }}
                whileTap={!deck.isLoaded ? {} : { scale: 0.95 }}
              >
                Tape Stop
              </motion.button>

              <motion.button
                onClick={() => handleSeek(10)}
                className="p-3 rounded-xl bg-gradient-to-b from-[#1f1f1f] to-[#0a0a0a] border border-white/10 hover:border-studio-cyan/40 transition-colors"
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
            {trackData?.url && (
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
              window.dispatchEvent(new CustomEvent('studio:open-library'));
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
  );
}
