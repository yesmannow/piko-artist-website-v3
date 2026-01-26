"use client";

/**
 * DeckGrid Component
 *
 * Five-column layout: Deck A | Strip A | Crossfader | Strip B | Deck B
 */

import { useEffect, useMemo, useState } from 'react';
import { Deck } from './Deck';
import { Crossfader } from './Crossfader';
import { Knob } from './controls/Knob';
import { Fader } from './controls/Fader';
import { useStore } from '@/store/useStore';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useExporter } from '@/hooks/useExporter';
import { ExportModal } from '@/components/studio/modals/ExportModal';

type DeckId = 'A' | 'B';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function ChannelStrip({ deckId }: { deckId: DeckId }) {
  const deck = useStore((state) => (deckId === 'A' ? state.deckA : state.deckB));
  const setDeckVolume = useStore((state) => state.setDeckVolume);
  const setDeckEQ = useStore((state) => state.setDeckEQ);
  const setDeckFilter = useStore((state) => state.setDeckFilter);
  const { toggleStem, getStemMuteState } = useAudioEngine();
  const [stemMutes, setStemMutes] = useState(() => getStemMuteState(deckId));
  const stripLabel = deckId === 'A' ? 'Strip A' : 'Strip B';
  const accentText = deckId === 'A' ? 'text-studio-cyan/80' : 'text-studio-purple/80';
  const accentBg = deckId === 'A' ? 'bg-studio-cyan/30 border-studio-cyan text-studio-cyan' : 'bg-studio-purple/30 border-studio-purple text-studio-purple';

  const eqValues = useMemo(() => {
    const normalize = (value: number) => (value + 12) / 24;
    return {
      high: clamp01(normalize(deck.eq.high)),
      mid: clamp01(normalize(deck.eq.mid)),
      low: clamp01(normalize(deck.eq.low)),
    };
  }, [deck.eq.high, deck.eq.low, deck.eq.mid]);

  return (
    <div className="bg-gradient-to-b from-[#0b0c12cc] to-[#06070ccc] rounded-xl border border-white/5 shadow-[0_14px_36px_rgba(0,0,0,0.35)] p-3 flex flex-col items-center gap-3 backdrop-blur-[20px]">
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
        value={clamp01(deck.volume)}
        onChange={(value) => setDeckVolume(deckId, value)}
        size={56}
        color="#06b6d4"
      />
      <Knob
        label="HIGH"
        value={eqValues.high}
        onChange={(value) => setDeckEQ(deckId, { ...deck.eq, high: value * 24 - 12 })}
        size={60}
        color="#22d3ee"
      />
      <Knob
        label="MID"
        value={eqValues.mid}
        onChange={(value) => setDeckEQ(deckId, { ...deck.eq, mid: value * 24 - 12 })}
        size={60}
        color="#a855f7"
      />
      <Knob
        label="LOW"
        value={eqValues.low}
        onChange={(value) => setDeckEQ(deckId, { ...deck.eq, low: value * 24 - 12 })}
        size={60}
        color="#06b6d4"
      />
      <Knob
        label="FILTER"
        value={clamp01(deck.filter)}
        onChange={(value) => setDeckFilter(deckId, value)}
        size={68}
        color="#22d3ee"
        bipolar
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
            return (
              <button
                key={stem.key}
                onClick={() => {
                  toggleStem(deckId, stem.key);
                  setStemMutes(getStemMuteState(deckId));
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                  isMuted
                    ? 'bg-[#1a1a1a] border-white/10 text-white/40'
                    : deckId === 'A'
                      ? 'bg-studio-cyan/20 border-studio-cyan text-studio-cyan'
                      : 'bg-studio-purple/20 border-studio-purple text-studio-purple'
                }`}
              >
                {stem.label}
              </button>
            );
          })}
        </div>
      </div>
      <Fader
        label="VOLUME"
        value={clamp01(deck.volume)}
        onChange={(value) => setDeckVolume(deckId, value)}
        height={192}
      />
    </div>
  );
}

export function DeckGrid() {
  const { getMasterBus } = useAudioEngine();
  const { recordMasterBus, stopRecording, transcode } = useExporter();
  const [masterGain, setMasterGain] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showMixerPanel, setShowMixerPanel] = useState(false);

  const masterBus = getMasterBus().bus;

  useEffect(() => {
    if (masterBus) {
      masterBus.gain.rampTo(masterGain, 0.05);
    }
  }, [masterBus, masterGain]);

  useEffect(() => {
    if (recordingBlob) {
      setIsExportOpen(true);
    }
  }, [recordingBlob]);

  const handleRecordToggle = async () => {
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
  };

  return (
    <div className="h-full w-full grid grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[1.15fr_0.85fr_0.95fr_0.85fr_1.15fr]">
      <div className="min-w-0 flex-1">
        <Deck deckId="A" />
      </div>
      <div className="hidden lg:flex">
        <ChannelStrip deckId="A" />
      </div>
      <div className="hidden lg:flex bg-obsidian-900/80 backdrop-blur-[20px] border border-white/10 rounded-lg flex-col items-center justify-between py-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col items-center gap-3">
          <Knob
            label="MASTER"
            value={Math.max(0, Math.min(1, masterGain))}
            onChange={setMasterGain}
            size={70}
            color="#22d3ee"
          />
          <button
            onClick={handleRecordToggle}
            className="relative w-14 h-14 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-[0_0_18px_rgba(0,0,0,0.6)]"
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-500/40'}`}
            />
            <span className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          </button>
        </div>
        <Crossfader />
      </div>
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

      {showMixerPanel && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMixerPanel(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-obsidian-900/90 backdrop-blur-[20px] border-t border-white/10 p-4">
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
              <div className="bg-obsidian-900/60 backdrop-blur-[20px] border border-white/10 rounded-lg flex flex-col items-center justify-between py-4">
                <div className="flex flex-col items-center gap-3">
                  <Knob
                    label="MASTER"
                    value={Math.max(0, Math.min(1, masterGain))}
                    onChange={setMasterGain}
                    size={70}
                    color="#22d3ee"
                  />
                  <button
                    onClick={handleRecordToggle}
                    className="relative w-14 h-14 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-[0_0_18px_rgba(0,0,0,0.6)]"
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-500/40'}`}
                    />
                    <span className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  </button>
                </div>
                <Crossfader />
              </div>
              <ChannelStrip deckId="B" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
