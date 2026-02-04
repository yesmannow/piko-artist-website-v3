"use client";

/**
 * DeckFXRack - Per-Deck Effects Rack
 *
 * Phase V-B: Independent FX chains for Deck A and Deck B
 *
 * Features:
 * - Filter (Bipolar High-Pass/Low-Pass)
 * - Reverb (with decay control)
 * - Delay (BPM-synced with feedback)
 * - Distortion (warm analog saturation)
 *
 * Visual Distinction:
 * - Deck A: Cyan accent (#00F2FF)
 * - Deck B: Purple accent (#9333ea)
 */

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Knob } from '@/components/ui/controls/Knob';
import { getAudioEngine } from '@/lib/audio-engine';

interface DeckFXRackProps {
  readonly deckId: 'A' | 'B';
}

export function DeckFXRack({ deckId }: DeckFXRackProps) {
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const setDeckFX = useStore((state) => state.setDeckFX);
  const masterBpm = useStore((state) => state.masterBpm);

  const fx = deck.fx;
  const accentColor = deckId === 'A' ? '#00F2FF' : '#9333ea';
  const borderColor = deckId === 'A' ? 'border-cyan-500/20' : 'border-purple-500/20';

  // Wire FX parameters to audio engine
  useEffect(() => {
    const engine = getAudioEngine(masterBpm);
    if (!engine) return;

    // Update all FX parameters
    engine.setDeckFX(deckId, 'filter', fx.filter);
    engine.setDeckFX(deckId, 'reverb', fx.reverb);
    engine.setDeckFX(deckId, 'delay', fx.delay);
    engine.setDeckFX(deckId, 'distortion', fx.distortion);
    engine.setDeckFX(deckId, 'reverbDecay', fx.reverbDecay);
    engine.setDeckFX(deckId, 'delayFeedback', fx.delayFeedback);
    engine.setDeckFX(deckId, 'delayTime', fx.delayTime);
  }, [
    deckId,
    masterBpm,
    fx.filter,
    fx.reverb,
    fx.delay,
    fx.distortion,
    fx.reverbDecay,
    fx.delayFeedback,
    fx.delayTime,
  ]);

  // Update BPM for delay timing
  useEffect(() => {
    const engine = getAudioEngine(masterBpm);
    if (!engine) return;
    engine.updateBPM(masterBpm);
  }, [masterBpm]);

  return (
    <div
      className={`p-3 rounded-lg border ${borderColor} bg-obsidian-900/40 backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-xs font-mono uppercase tracking-wider text-white/60">
            FX Deck {deckId}
          </span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">
          Filter
        </div>
        <div className="flex justify-center">
          <Knob
            label="Filter"
            value={fx.filter}
            onChange={(value) => setDeckFX(deckId, 'filter', value)}
            size={64}
            color={accentColor}
            bipolar
          />
        </div>
      </div>

      {/* Reverb Section */}
      <div className="mb-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">
          Reverb
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Knob
            label="Mix"
            value={fx.reverb}
            onChange={(value) => setDeckFX(deckId, 'reverb', value)}
            size={56}
            color="#14b8a6"
          />
          <Knob
            label="Decay"
            value={fx.reverbDecay}
            onChange={(value) => setDeckFX(deckId, 'reverbDecay', value)}
            size={56}
            color="#f97316"
          />
        </div>
      </div>

      {/* Delay Section */}
      <div className="mb-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">
          Delay
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Knob
            label="Mix"
            value={fx.delay}
            onChange={(value) => setDeckFX(deckId, 'delay', value)}
            size={48}
            color="#22d3ee"
          />
          <Knob
            label="Time"
            value={fx.delayTime}
            onChange={(value) => setDeckFX(deckId, 'delayTime', value)}
            size={48}
            color="#a855f7"
          />
          <Knob
            label="Fb"
            value={fx.delayFeedback}
            onChange={(value) => setDeckFX(deckId, 'delayFeedback', value)}
            size={48}
            color="#ec4899"
          />
        </div>
      </div>

      {/* Distortion Section */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">
          Distortion
        </div>
        <div className="flex justify-center">
          <Knob
            label="Drive"
            value={fx.distortion}
            onChange={(value) => setDeckFX(deckId, 'distortion', value)}
            size={56}
            color="#ef4444"
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          const engine = getAudioEngine(masterBpm);
          if (engine) engine.resetDeckFX(deckId);
          // Also reset store state
          setDeckFX(deckId, 'filter', 0.5);
          setDeckFX(deckId, 'reverb', 0);
          setDeckFX(deckId, 'delay', 0);
          setDeckFX(deckId, 'distortion', 0);
        }}
        className="mt-3 w-full py-1 px-2 text-[10px] font-mono uppercase tracking-wider text-white/60 hover:text-white/80 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
      >
        Reset FX
      </button>
    </div>
  );
}
