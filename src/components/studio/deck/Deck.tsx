"use client";

/**
 * Deck Component (Refactored - Phase S3)
 *
 * Displays track information, transport controls, and deck status
 * Now using extracted hooks and presentational components
 * Phase 1: Added Performance Pads integration
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioEngine } from '@/hooks/audio/useAudioEngine';
import { useStore } from '@/store/useStore';
import { useCyaniteRecommendations, type Recommendation } from '@/hooks/integrations/useCyaniteRecommendations';
import { useSmartTrackAnalysis } from '@/hooks/tracks/useSmartTrackAnalysis';
import { db } from '@/lib/db';
import { Loader2 } from 'lucide-react';
import { RecommendationsPopover } from '../library/RecommendationsPopover';
import { StemRack } from '../stems/StemRack';
import { StemPerformancePads } from '../stems/StemPerformancePads';
import { JogWheel } from './JogWheel';
import { WaveformMini } from '../waveforms/WaveformMini';
import { EnergyIndicator } from '../waveforms/EnergyIndicator';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { calculateNewBpm } from '@/lib/utils/audioMath';
import { useStudioStore } from '@/store/useStudioStore';
import type { PikoTestHelpers } from '@/utils/testHelpers';
import { deriveTrackKey } from '@/lib/trackKey';

// Phase S3: Extracted hooks
import { useDeckTransport } from '@/hooks/deck/useDeckTransport';
import { useDeckWaveformSync } from '@/hooks/deck/useDeckWaveformSync';
import { useDeckStems } from '@/hooks/deck/useDeckStems';

// Phase S3: Extracted components
import { DeckHeader } from './DeckHeader';
import { DeckTransportControls } from './DeckTransportControls';

// Phase 1: Performance Pads
import { PerformancePadGrid } from '../pads/PerformancePadGrid';
import { StemOverlay } from '../stems/StemOverlay';

interface DeckProps {
  readonly deckId: 'A' | 'B';
  readonly showMiniWaveform?: boolean;
  readonly complexityMode?: 'simple' | 'pro';
}

type DeckWindow = Window & {
  __PIKO_TEST_HELPERS__?: PikoTestHelpers;
};

export function Deck({ deckId, showMiniWaveform = true, complexityMode = 'pro' }: DeckProps) {
  const { syncToBpm, triggerTapeStop, getPlaybackPosition, getPlayer } = useAudioEngine();
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const setKeyLock = useStore((state) => state.setKeyLock);
  const focusedDeckId = useStudioStore((state) => state.focusedDeckId);
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);

  // Phase 3.3: Stem Performance Pads
  const mutedStems = useStudioStore((state) => state.mutedStems[deckId]);
  const soloStem = useStudioStore((state) => state.soloStem[deckId]);
  const toggleStemMute = useStudioStore((state) => state.toggleStemMute);
  const activateSoloStem = useStudioStore((state) => state.activateSoloStem);
  const clearSolo = useStudioStore((state) => state.clearSolo);

  const { getRecommendations, loading: recommendationsLoading } = useCyaniteRecommendations();
  const { analyzeIfNeeded } = useSmartTrackAnalysis();

  // Phase S3: Use extracted hooks
  const transport = useDeckTransport({ deckId });
  const { progress, deckDuration } = useDeckWaveformSync({ deckId });
  const stems = useDeckStems({
    deckId,
    trackUrl: deck.trackData?.url,
    trackId: deck.trackData?.trackId,
  });

  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [deckReady, setDeckReady] = useState(false);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const deckReadyRef = useRef(false);

  const deckColor = deckId === 'A' ? 'bg-studio-cyan' : 'bg-studio-purple';
  const jogAccent = deckId === 'A' ? '#22d3ee' : '#a855f7';
  const deckLabel = `DECK ${deckId}`;
  const trackData = deck.trackData ?? null;
  const pitchDelta = (deck.playbackRate || 1) - 1;
  const currentBpm = trackData ? calculateNewBpm(trackData.bpm, pitchDelta) : null;
  const isSynced = currentBpm !== null && Math.abs(currentBpm - (useStore.getState().masterBpm)) < 0.5;
  const isKeyLockActive = deck.isKeyLockActive;
  const energy = trackData?.energy ?? 0;
  const isLoaded = deck.isLoaded;
  const fallbackBpm = trackData ? trackData.bpm : undefined;
  const isFocused = focusedDeckId === deckId;
  const showInlineStemControls = stems.hasStems && !stemModeEnabled;

  // Deck ready detection
  useEffect(() => {
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

  // Magic wand - get recommendations
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
    console.log(`[Deck] Would load recommendation: ${rec.title} to Deck ${targetDeck}`);
  };

  // Phase IX.5: Auto-analyze track if not already analyzed
  useEffect(() => {
    if (!trackData?.url || !deck.isLoaded) return;

    const performAnalysis = async () => {
      try {
        const dbTrack = await db.tracks.where('url').equals(trackData.url).first();
        if (!dbTrack) return;

        if (dbTrack.status === 'unanalyzed' || dbTrack.status === 'error') {
          console.log(`[Deck:${deckId}] Auto-analyzing track: ${trackData.title}`);
          await analyzeIfNeeded(dbTrack);
          console.log(`[Deck:${deckId}] Analysis complete`);
        }
      } catch (error) {
        console.error(`[Deck:${deckId}] Auto-analysis failed:`, error);
      }
    };

    performAnalysis();
  }, [trackData?.url, trackData?.title, deck.isLoaded, deckId, analyzeIfNeeded]);

  let stemButtonTitle = 'Split track into stems';
  if (stems.stemWorkerError) stemButtonTitle = `Stem worker error: ${stems.stemWorkerError}`;
  else if (stems.stemInitializing) stemButtonTitle = 'Loading stem model...';

  return (
    <div
      ref={deckRef}
      className={`deck deck-full h-full ${isFocused ? 'deck-focused' : ''}`}
      data-stems-ready={stems.hasStems ? 'true' : 'false'}
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
        <div className="relative">
          <DeckHeader
            deckId={deckId}
            deckLabel={deckLabel}
            isPlaying={deck.isPlaying}
            trackData={trackData}
            currentBpm={currentBpm}
            isSynced={isSynced}
            isKeyLockActive={isKeyLockActive}
            energy={energy}
            complexityMode={complexityMode}
            recommendationsLoading={recommendationsLoading}
            canGenerateStems={stems.canGenerateStems}
            isGeneratingStems={stems.isGeneratingStems}
            stemButtonTitle={stemButtonTitle}
            stemModeEnabled={stemModeEnabled}
            onMagicWand={handleMagicWand}
            onSplitStems={stems.handleSplitStems}
            onToggleKeyLock={() => setKeyLock(deckId, !isKeyLockActive)}
          />
          {stemModeEnabled && <StemOverlay deckId={deckId} />}
        </div>

        {/* Deck Body */}
        {trackData ? (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-6">
            <div className="flex items-center justify-center gap-4">
              {/* Phase IX.5: Energy Indicator */}
              {complexityMode === 'pro' && (
                <EnergyIndicator energy={trackData.energy || 0} />
              )}

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
                  onPointerDown={transport.handleScratchStart}
                  onPointerMove={transport.handleScratchMove}
                  onPointerUp={transport.handleScratchEnd}
                  onPointerCancel={transport.handleScratchEnd}
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
              </div>

              {stems.isGeneratingStems && (
                <div className="mb-2 flex items-center gap-2 text-xs text-white/60">
                  <Loader2 className="h-3 w-3 animate-spin text-studio-purple" />
                  <span>Generating stems...</span>
                </div>
              )}

              {(stems.stemError || stems.stemWorkerError) && (
                <div className="mb-2 text-xs text-red-400">
                  {stems.stemError ?? stems.stemWorkerError}
                </div>
              )}

              {showInlineStemControls && <StemRack deckId={deckId} compact={false} />}

              {/* Phase 3.3: Stem Performance Pads (Pro mode only) */}
              {complexityMode === 'pro' && stems.hasStems && (
                <StemPerformancePads
                  deckId={deckId}
                  disabled={false}
                  mutedStems={mutedStems}
                  soloStem={soloStem}
                  onToggle={(stem) => toggleStemMute(deckId, stem)}
                  onSolo={(stem) => activateSoloStem(deckId, stem)}
                  onClearSolo={() => clearSolo(deckId)}
                />
              )}

              {/* Show disabled pads with CTA when stems not ready */}
              {complexityMode === 'pro' && !stems.hasStems && stems.canGenerateStems && (
                <StemPerformancePads
                  deckId={deckId}
                  disabled={true}
                  mutedStems={mutedStems}
                  soloStem={null}
                  onToggle={stems.handleSplitStems}
                  onSolo={() => {}}
                  onClearSolo={() => {}}
                />
              )}

              {/* Phase 1: Performance Pads - Hot Cues, Loops, Slicer, Beat Jump */}
              {complexityMode === 'pro' && trackData && (
                <PerformancePadGrid
                  deckId={deckId}
                  trackKey={deriveTrackKey({ trackId: trackData.trackId, url: trackData.url })}
                  player={getPlayer(deckId)}
                  bpm={trackData.bpm}
                />
              )}

              <DeckTransportControls
                isPlaying={deck.isPlaying}
                isSynced={isSynced}
                isLoaded={isLoaded}
                hasBpm={Boolean(trackData?.bpm)}
                complexityMode={complexityMode}
                onPlay={transport.handlePlay}
                onPause={transport.handlePause}
                onStop={transport.handleStop}
                onSync={() => syncToBpm(deckId)}
                onSeekBack={() => transport.handleSeek(-10)}
                onSeekForward={() => transport.handleSeek(10)}
                onTapeStop={() => triggerTapeStop(deckId)}
              />

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
                    onSeek={(seconds) => transport.handleSeek(seconds - getPlaybackPosition(deckId))}
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
