"use client";

/**
 * Deck Component
 * 
 * Displays track information, transport controls, and deck status
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useStore } from '@/store/useStore';
import { useCyaniteRecommendations } from '@/hooks/useCyaniteRecommendations';
import { useStemGenerator } from '@/hooks/useStemGenerator';
import { Play, Pause, Square, SkipBack, SkipForward, Wand2, Loader2, Scissors, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { RecommendationsPopover } from './RecommendationsPopover';
import { StemControls } from './StemControls';

interface DeckProps {
  deckId: 'A' | 'B';
}

export function Deck({ deckId }: DeckProps) {
  const { play, pause, stop, seekTo, getPlaybackPosition, getDeckDuration, loadStems, syncToBpm } = useAudioEngine();
  const deck = useStore((state) => state[deckId === 'A' ? 'deckA' : 'deckB']);
  const masterBpm = useStore((state) => state.masterBpm);
  const setDeckPlaying = useStore((state) => state.setDeckPlaying);
  const { getRecommendations, loading: recommendationsLoading } = useCyaniteRecommendations();
  const { generateStems, isProcessing: isGeneratingStems, progress: stemProgress, error: stemError, isConfigured: audioShakeConfigured } = useStemGenerator();
  
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [hasStems, setHasStems] = useState(false);
  const [progress, setProgress] = useState(0);

  const deckColor = deckId === 'A' ? 'bg-studio-cyan' : 'bg-studio-purple';
  const deckLabel = `DECK ${deckId}`;

  const handleMagicWand = async () => {
    if (!deck.trackData) return;

    try {
      const recs = await getRecommendations(deck.trackData.bpm, deck.trackData.energy || 0.5);
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
    if (!deck.trackData?.url) return;

    try {
      const stems = await generateStems(deck.trackData.url, deck.trackData.title);
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

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      const duration = getDeckDuration(deckId);
      const position = getPlaybackPosition(deckId);
      const nextProgress = duration > 0 ? Math.min(1, position / duration) : 0;
      setProgress(nextProgress);
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [deckId, getDeckDuration, getPlaybackPosition]);

  return (
    <div className="h-full flex flex-col glass-panel backdrop-blur-[20px] bg-obsidian-900/60 rounded-lg p-6 border border-white/10">
      {/* Deck Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${deckColor}`} />
          <h2 className="text-lg font-black uppercase font-mono">{deckLabel}</h2>
        </div>
        {deck.trackData && (
          <div
            className={`text-xs font-mono ${
              Math.abs(deck.playbackRate - 1) > 0.001
                ? deckId === 'A'
                  ? 'text-studio-cyan'
                  : 'text-studio-purple'
                : 'text-white/60'
            }`}
          >
            {Math.abs(deck.playbackRate - 1) > 0.001
              ? (deck.trackData.bpm * deck.playbackRate).toFixed(2)
              : deck.trackData.bpm}{' '}
            BPM
            {Math.abs(deck.playbackRate - 1) > 0.001 && (
              <span className="ml-1 text-[10px] text-white/50">(MT)</span>
            )}
          </div>
        )}
      </div>

      {/* Track Info */}
      {deck.trackData ? (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{deck.trackData.title}</h3>
              <p className="text-sm text-white/60">{deck.trackData.artist}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Magic Wand Button */}
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

              {/* Split Stems Button */}
              {deck.trackData && (
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
              )}
            </div>
          </div>

          {/* Stem Generation Progress */}
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

          {/* Stem Error */}
          {stemError && (
            <div className="mb-2 text-xs text-red-400">
              {stemError}
            </div>
          )}

          {/* Stem Controls */}
          {hasStems && <StemControls deckId={deckId} />}

          <div className="flex flex-col items-center gap-4">
            <div className="relative w-64 h-64 rounded-full bg-[#050505] border-4 border-[#222] shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <svg className="absolute inset-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#1f2937" strokeWidth="4" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={deckId === 'A' ? '#22d3ee' : '#a855f7'}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45 * progress} ${2 * Math.PI * 45}`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="relative w-52 h-52 rounded-full overflow-hidden border-2 border-[#222] bg-black">
                {deck.trackData.artUrl && (
                  <div
                    className={`absolute inset-0 ${deck.isPlaying ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '6s' }}
                  >
                    <Image
                      src={deck.trackData.artUrl}
                      alt={deck.trackData.title}
                      fill
                      unoptimized
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {['HOT CUE 1', 'HOT CUE 2', 'HOT CUE 3', 'HOT CUE 4'].map((pad) => (
                <button
                  key={pad}
                  className="py-3 rounded-lg bg-gray-800/80 border border-white/10 text-xs font-mono uppercase tracking-widest hover:bg-cyan-500/50 transition-colors"
                >
                  {pad}
                </button>
              ))}
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-3 mt-auto">
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
              disabled={!deck.trackData?.bpm}
              className={`px-4 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest transition-colors ${
                deck.trackData?.bpm && Math.abs(deck.trackData.bpm - masterBpm) < 0.5
                  ? 'border-white/80 text-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                  : 'border-white/10 text-white/60 hover:border-white/40 hover:text-white'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              whileHover={!deck.trackData?.bpm ? {} : { scale: 1.05 }}
              whileTap={!deck.trackData?.bpm ? {} : { scale: 0.95 }}
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
              onClick={() => handleSeek(10)}
              className="p-3 rounded-xl bg-gradient-to-b from-[#1f1f1f] to-[#0a0a0a] border border-white/10 hover:border-studio-cyan/40 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SkipForward className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Volume Display */}
          <div className="mt-4">
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
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <button
            className="relative w-64 h-64 rounded-full bg-[#050505] border-4 border-[#222] shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center cursor-pointer"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('studio:open-library'));
            }}
          >
            <div className="w-44 h-44 rounded-full border-2 border-dashed border-studio-cyan/40 flex flex-col items-center justify-center gap-2">
              <Plus className="w-8 h-8 text-studio-cyan" />
              <span className="text-xs font-mono uppercase text-white/60">Load Deck {deckId}</span>
            </div>
          </button>
          <p className="font-mono text-xs text-white/50">Select a track from the Vault</p>
        </div>
      )}

      {/* Recommendations Popover */}
      <RecommendationsPopover
        recommendations={recommendations}
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        onLoadTrack={handleLoadRecommendation}
      />
    </div>
  );
}
