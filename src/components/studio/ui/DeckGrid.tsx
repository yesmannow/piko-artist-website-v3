"use client";

/**
 * DeckGrid Component
 *
 * Five-column layout: Deck A | Strip A | Crossfader | Strip B | Deck B
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Deck } from './Deck';
import { Crossfader } from './Crossfader';
import { Knob } from '@/components/studio/ui/controls/Knob';
import { Fader } from '@/components/studio/ui/controls/Fader';
import { LevelMeter } from './LevelMeter';
import { useStore } from '@/store/useStore';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useExporter } from '@/hooks/useExporter';
import { ExportModal } from '@/components/studio/modals/ExportModal';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { dbToLinear } from '@/lib/utils/audioMath';

type DeckId = 'A' | 'B';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

const MIN_VOLUME_DB = -60;

function linearToDb(linear: number) {
  if (linear <= 0) return MIN_VOLUME_DB;
  return 20 * Math.log10(linear);
}

function faderToLinear(value: number) {
  const clamped = clamp01(value);
  const db = MIN_VOLUME_DB + clamped * (0 - MIN_VOLUME_DB);
  return dbToLinear(db);
}

function linearToFader(linear: number) {
  const db = linearToDb(linear);
  return clamp01((db - MIN_VOLUME_DB) / (0 - MIN_VOLUME_DB));
}

function ChannelStrip({ deckId }: Readonly<{ deckId: DeckId }>) {
  const deck = useStore((state) => (deckId === 'A' ? state.deckA : state.deckB));
  const setDeckVolume = useStore((state) => state.setDeckVolume);
  const setDeckEQ = useStore((state) => state.setDeckEQ);
  const setDeckFilter = useStore((state) => state.setDeckFilter);
  const {
    setDeckVolume: setAudioVolume,
    setDeckEQ: setAudioEQ,
    setDeckFilter: setAudioFilter,
    toggleStem,
    getStemMuteState,
    getDeckChannel,
  } = useAudioEngine();
  const [stemMutes, setStemMutes] = useState(() => getStemMuteState(deckId));
  const [deckChannel, setDeckChannel] = useState(() => getDeckChannel(deckId));
  const stripLabel = deckId === 'A' ? 'Strip A' : 'Strip B';
  const accentText = deckId === 'A' ? 'text-studio-cyan/80' : 'text-studio-purple/80';
  const accentBg = deckId === 'A' ? 'bg-studio-cyan/30 border-studio-cyan text-studio-cyan' : 'bg-studio-purple/30 border-studio-purple text-studio-purple';
  const accentColor = deckId === 'A' ? '#22d3ee' : '#a855f7';
  const volumeFader = useMemo(() => linearToFader(deck.volume), [deck.volume]);

  // Track if we're in a user interaction to prevent feedback loops
  const isUserInteracting = useRef(false);

  // Update deck channel reference when it changes
  useEffect(() => {
    const channel = getDeckChannel(deckId);
    setDeckChannel(channel);
  }, [deckId, getDeckChannel]);

  const eqValues = useMemo(() => {
    const normalize = (value: number) => (value + 12) / 24;
    return {
      high: clamp01(normalize(deck.eq.high)),
      mid: clamp01(normalize(deck.eq.mid)),
      low: clamp01(normalize(deck.eq.low)),
    };
  }, [deck.eq.high, deck.eq.low, deck.eq.mid]);

  // Direct audio engine wiring - Method 1: Instant updates
  const handleVolumeChange = useCallback((value: number) => {
    isUserInteracting.current = true;
    const linearVolume = faderToLinear(value);

    // Update audio engine instantly (bypasses React render cycle)
    setAudioVolume(deckId, linearVolume);

    // Update store for UI sync
    setDeckVolume(deckId, linearVolume);

    requestAnimationFrame(() => {
      isUserInteracting.current = false;
    });
  }, [deckId, setAudioVolume, setDeckVolume]);

  const handleEQChange = useCallback((band: 'low' | 'mid' | 'high', value: number) => {
    isUserInteracting.current = true;
    const dbValue = value * 24 - 12;
    const newEQ = { ...deck.eq, [band]: dbValue };

    // Update audio engine instantly
    setAudioEQ(deckId, newEQ);

    // Update store for UI sync
    setDeckEQ(deckId, newEQ);

    requestAnimationFrame(() => {
      isUserInteracting.current = false;
    });
  }, [deckId, deck.eq, setAudioEQ, setDeckEQ]);

  const handleFilterChange = useCallback((value: number) => {
    isUserInteracting.current = true;

    // Update audio engine instantly
    setAudioFilter(deckId, value);

    // Update store for UI sync
    setDeckFilter(deckId, value);

    requestAnimationFrame(() => {
      isUserInteracting.current = false;
    });
  }, [deckId, setAudioFilter, setDeckFilter]);

  return (
    <GlassPanel
      depth="mixer"
      accentColor={deckId === 'A' ? '#22d3ee' : '#a855f7'}
      className="w-full bg-linear-to-b from-[#0b0c12cc] to-[#06070ccc] rounded-xl p-3 flex flex-col items-center gap-3 backdrop-blur-[20px]"
    >
      <div className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.28em] text-white/50">
        <span>{stripLabel}</span>
        <span className={accentText}>Line</span>
      </div>
      <div className="w-full flex items-center justify-between gap-2">
        {([
          { label: 'VOX', key: 'vocals' },
          { label: 'DRM', key: 'drums' },
          { label: 'BAS', key: 'bass' },
        ] as const).map((stem) => {
          const isMuted = stemMutes[stem.key];
          return (
            <button
              key={stem.key}
              onClick={() => {
                toggleStem(deckId, stem.key);
                setStemMutes(getStemMuteState(deckId));
              }}
              className={`flex-1 py-1 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] border transition-all ${
                isMuted
                  ? 'bg-[#0a0b10] border-white/10 text-white/40'
                  : accentBg
              }`}
            >
              {stem.label}
            </button>
          );
        })}
      </div>
      <Knob
        label="GAIN"
        value={volumeFader}
        onChange={handleVolumeChange}
        size={56}
      />
      <Knob
        label="HIGH"
        value={eqValues.high}
        onChange={(value) => handleEQChange('high', value)}
        size={60}
      />
      <Knob
        label="MID"
        value={eqValues.mid}
        onChange={(value) => handleEQChange('mid', value)}
        size={60}
      />
      <Knob
        label="LOW"
        value={eqValues.low}
        onChange={(value) => handleEQChange('low', value)}
        size={60}
      />
      <Knob
        label="FILTER"
        value={clamp01(deck.filter)}
        onChange={handleFilterChange}
        size={68}
      />
      <div className="w-full flex flex-col items-center gap-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">STEMS</div>
        <div className="flex items-center gap-2">
          {([
            { label: 'VOCAL', key: 'vocals' },
            { label: 'DRUM', key: 'drums' },
            { label: 'BASS', key: 'bass' },
          ] as const).map((stem) => {
            const isMuted = stemMutes[stem.key];
            let stemClass = '';
            if (isMuted) {
              stemClass = 'bg-obsidian-700 border-white/10 text-white/40';
            } else if (deckId === 'A') {
              stemClass = 'bg-studio-cyan/20 border-studio-cyan text-studio-cyan';
            } else {
              stemClass = 'bg-studio-purple/20 border-studio-purple text-studio-purple';
            }

            return (
              <button
                key={stem.key}
                onClick={() => {
                  toggleStem(deckId, stem.key);
                  setStemMutes(getStemMuteState(deckId));
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest border transition-colors ${stemClass}`}
              >
                {stem.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-full flex items-center justify-center gap-3">
        <LevelMeter
          audioNode={deckChannel}
          height={192}
          width={16}
          segments={16}
          accentColor={accentColor}
        />
        <Fader
          label="VOLUME"
          value={volumeFader}
          onChange={handleVolumeChange}
          height={192}
        />
      </div>
    </GlassPanel>
  );
}

export function DeckGrid() {
  const { getMasterBus, setMasterGain, getMasterChannel } = useAudioEngine();
  const { recordMasterBus, stopRecording, transcode } = useExporter();
  const [masterGainLocal, setMasterGainLocal] = useState<number>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showMixerPanel, setShowMixerPanel] = useState(false);
  const [masterChannel, setMasterChannel] = useState(() => getMasterChannel());

  const masterBus = getMasterBus().bus;

  // Update master channel reference
  useEffect(() => {
    const channel = getMasterChannel();
    setMasterChannel(channel);
  }, [getMasterChannel]);

  // Direct audio engine wiring for master gain
  const handleMasterGainChange = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    setMasterGainLocal(clampedValue);
    // Update audio engine instantly
    setMasterGain(clampedValue);
  }, [setMasterGain]);

  useEffect(() => {
    if (recordingBlob) {
      setIsExportOpen(true);
    }
  }, [recordingBlob]);

  const handleRecordToggle = useCallback(async () => {
    if (!masterBus) return;
    if (!isRecording) {
      recordMasterBus(masterBus);
      setIsRecording(true);
      return;
    }

    const blob = await stopRecording();
    setIsRecording(false);
    if (blob) {
      setRecordingBlob(blob);
      setIsExportOpen(true);
    }
  }, [masterBus, isRecording, recordMasterBus, stopRecording]);

  const handleAutomix = useCallback(async () => {
    try {
      console.log('Analyzing tracks for automix...');
      const analysis = await fetchTrackAnalysis();
      console.log('Adjusting mixer settings for seamless transitions', analysis);
    } catch (error) {
      console.error('Automix failed:', error);
    }
  }, []);

  const handleBatchExport = useCallback(async () => {
    try {
      console.log('Preparing batch export...');
      const selectedTracks = await openBatchExportModal();
      console.log('Exporting tracks:', selectedTracks);
    } catch (error) {
      console.error('Batch export failed:', error);
    }
  }, []);

  // Enhanced mobile mixer panel with animations and touch optimizations
  const mobilePanelStyles = {
    transition: 'transform 0.3s ease-in-out',
    transform: showMixerPanel ? 'translateY(0)' : 'translateY(100%)',
  };

  return (
    <div className="h-full w-full grid grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[1.15fr_0.85fr_0.95fr_0.85fr_1.15fr]">
      <div className="min-w-0 flex-1">
        <Deck deckId="A" />
      </div>
      <div className="hidden lg:flex">
        <ChannelStrip deckId="A" />
      </div>
      <GlassPanel
        depth="mixer"
        className="hidden lg:flex bg-obsidian-900/80 backdrop-blur-[20px] rounded-lg flex-col items-center justify-between py-4"
      >
        <div className="flex flex-col items-center gap-3">
          <LevelMeter
            audioNode={masterChannel}
            height={160}
            width={20}
            segments={20}
            label="MASTER"
            accentColor="#22d3ee"
          />
          <Knob
            label="MASTER"
            value={masterGainLocal}
            onChange={handleMasterGainChange}
            size={70}
          />
          <button
            onClick={handleRecordToggle}
            className="relative w-14 h-14 rounded-full bg-obsidian-900 border border-white/10 flex items-center justify-center shadow-[0_0_18px_rgba(0,0,0,0.6)]"
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-500/40'}`}
            />
            <span className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
            <span className="absolute inset-0 rounded-full bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
          </button>
        </div>
        <Crossfader />
      </GlassPanel>
      <div className="hidden lg:flex">
        <ChannelStrip deckId="B" />
      </div>
      <div className="min-w-0 flex-1">
        <Deck deckId="B" />
      </div>
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => {
          setIsExportOpen(false);
          setRecordingBlob(null);
        }}
        masterBus={masterBus || undefined}
        recordingBlob={recordingBlob}
        onRecordingConsumed={() => setRecordingBlob(null)}
        onTranscode={(blob) => transcode(blob, 'Piko-Studio-Remix')}
      />

      {/* Mobile Mixer Toggle */}
      <div className="lg:hidden fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setShowMixerPanel(true)}
          className="w-14 h-14 rounded-full bg-studio-cyan text-black font-black shadow-[0_0_20px_rgba(34,211,238,0.5)]"
        >
          MIX
        </button>
      </div>

      {/* Mobile Mixer Panel */}
      {showMixerPanel && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={mobilePanelStyles}
        >
          <div className="absolute inset-0">
            <button
              aria-label="Close mixer panel"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMixerPanel(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowMixerPanel(false);
                }
              }}
            />
          </div>
          <GlassPanel
            depth="mixer"
            className="absolute inset-x-0 bottom-0 bg-obsidian-900/90 backdrop-blur-[20px] p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono uppercase tracking-widest text-white/60">Mixer</div>
              <button
                onClick={() => setShowMixerPanel(false)}
                className="text-xs font-mono uppercase tracking-widest text-white/60"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-[1fr_100px_1fr] gap-3">
              <ChannelStrip deckId="A" />
              <GlassPanel
                depth="mixer"
                className="bg-obsidian-900/60 backdrop-blur-[20px] rounded-lg flex flex-col items-center justify-between py-4"
              >
                <div className="flex flex-col items-center gap-3">
                  <Knob
                    label="MASTER"
                    value={masterGainLocal}
                    onChange={handleMasterGainChange}
                    size={70}
                  />
                  <button
                    onClick={handleRecordToggle}
                    className="relative w-14 h-14 rounded-full bg-obsidian-900 border border-white/10 flex items-center justify-center shadow-[0_0_18px_rgba(0,0,0,0.6)]"
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-500/40'}`}
                    />
                    <span className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
                    <span className="absolute inset-0 rounded-full bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
                  </button>
                </div>
                <Crossfader />
              </GlassPanel>
              <ChannelStrip deckId="B" />
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Action Buttons for Automix and Batch Export */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={handleAutomix}
          className="px-4 py-2 bg-studio-cyan text-black font-bold rounded shadow-md hover:bg-studio-cyan/80"
        >
          Automix
        </button>
        <button
          onClick={handleBatchExport}
          className="px-4 py-2 bg-studio-purple text-white font-bold rounded shadow-md hover:bg-studio-purple/80"
        >
          Batch Export
        </button>
      </div>
    </div>
  );
}

/**
 * Placeholder function to simulate track analysis
 */
async function fetchTrackAnalysis() {
  try {
    const response = await fetch('/api/studio/analyze-track', {
      method: 'POST',
      body: JSON.stringify({ file: 'track-file-placeholder' }), // Replace with actual file data
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to analyze track');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fetchTrackAnalysis:', error);
    throw error;
  }
}

/**
 * Placeholder function to simulate opening the batch export modal
 */
async function openBatchExportModal() {
  try {
    // Placeholder logic for opening the ExportModal
    console.log('Opening batch export modal...');
    return ['track1', 'track2']; // Replace with actual selected tracks
  } catch (error) {
    console.error('Error in openBatchExportModal:', error);
    throw error;
  }
}

