"use client";

/**
 * FXRack Component
 * 
 * Tone.js FX Chain with Macro Knobs:
 * - Bitcrusher (vintage sampler grit)
 * - AutoFilter (BPM-synced sweeps)
 * - StereoWidener (vocal enhancement)
 * 
 * One knob controls wet/dry + parameters for each effect
 */

import { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { useStore } from '@/store/useStore';
import { Sliders } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { MacroKnob } from './MacroKnob';

interface FXRackProps {
  masterBus?: Tone.Gain | null;
  masterPostFx?: Tone.Gain | null;
}

export function FXRack({ masterBus, masterPostFx }: FXRackProps) {
  const { masterBpm, fxRack, setFxRack } = useStore();
  const { setDelayWetMix, setDelayFeedbackAmount, setReverbWetMix, setReverbDecayTime } = useAudioEngine();
  
  // FX Nodes
  const bitcrusherRef = useRef<Tone.BitCrusher | null>(null);
  const autoFilterRef = useRef<Tone.AutoFilter | null>(null);
  const stereoWidenerRef = useRef<Tone.StereoWidener | null>(null);
  const dryWetRef = useRef<Tone.CrossFade | null>(null);
  
  // Macro values from store (persisted)
  const bitcrushMacro = fxRack.bitcrush;
  const filterMacro = fxRack.filter;
  const widthMacro = fxRack.width;
  const delayMix = fxRack.delayMix;
  const delayFeedback = fxRack.delayFeedback;
  const reverbMix = fxRack.reverbMix;
  const reverbDecay = fxRack.reverbDecay;

  // Initialize FX chain
  useEffect(() => {
    if (!masterBus || !masterPostFx) return;

    // Create FX nodes
    const bitcrusher = new Tone.BitCrusher(8);

    const autoFilter = new Tone.AutoFilter({
      frequency: '4n', // Sync to quarter notes
      baseFrequency: 200,
      octaves: 2.6,
    }).start();

    const stereoWidener = new Tone.StereoWidener(0);

    const dryWet = new Tone.CrossFade(0); // 0 = dry, 1 = wet

    // Reroute master bus through FX insert
    masterBus.disconnect();

    // Connect: Master Bus -> FX Chain -> Dry/Wet -> Post-FX bus
    masterBus.connect(dryWet.a); // Dry signal
    masterBus.connect(bitcrusher);
    bitcrusher.connect(autoFilter);
    autoFilter.connect(stereoWidener);
    stereoWidener.connect(dryWet.b); // Wet signal
    
    // Connect dry/wet back into master chain
    dryWet.connect(masterPostFx);

    bitcrusherRef.current = bitcrusher;
    autoFilterRef.current = autoFilter;
    stereoWidenerRef.current = stereoWidener;
    dryWetRef.current = dryWet;

    return () => {
      masterBus.disconnect();
      masterBus.connect(masterPostFx);
      bitcrusher.dispose();
      autoFilter.dispose();
      stereoWidener.dispose();
      dryWet.dispose();
    };
  }, [masterBus, masterPostFx]);

  // Update Bitcrusher macro
  useEffect(() => {
    const bitcrusher = bitcrusherRef.current;
    const dryWet = dryWetRef.current;
    if (!bitcrusher || !dryWet) return;

    // Macro controls: wet/dry mix + bit depth
    const bitDepth = Math.max(1, Math.min(16, 16 - bitcrushMacro * 15));

    // BitCrusher bits is a signal, use .value
    if (bitcrusher.bits && typeof bitcrusher.bits === 'object' && 'value' in bitcrusher.bits) {
      (bitcrusher.bits as { value: number }).value = bitDepth;
    }
    dryWet.fade.value = bitcrushMacro;
  }, [bitcrushMacro]);

  // Update AutoFilter macro (BPM-synced)
  useEffect(() => {
    const autoFilter = autoFilterRef.current;
    if (!autoFilter) return;

    // Macro controls: wet/dry + filter depth
    const wetAmount = Math.max(0, Math.min(1, filterMacro));
    const depth = filterMacro * 2; // 0 to 2 octaves

    autoFilter.wet.value = wetAmount;
    autoFilter.octaves = depth;
    
    // Sync frequency to BPM
    if (masterBpm > 0) {
      const beatDuration = 60 / masterBpm;
      // Clamp beatDuration to valid range (0.01 to 10 seconds)
      autoFilter.frequency.value = Math.max(0.01, Math.min(10, beatDuration));
    }
  }, [filterMacro, masterBpm]);

  // Update StereoWidener macro
  useEffect(() => {
    const stereoWidener = stereoWidenerRef.current;
    if (!stereoWidener) return;

    // Fix: Tone.StereoWidener width must be between 0 and 1
    // 0 = Mono, 0.5 = Normal, 1 = Wide
    const width = Math.max(0, Math.min(1, widthMacro));

    stereoWidener.width.value = width;
  }, [widthMacro]);

  // Delay/Reverb wiring into audio engine
  useEffect(() => {
    setDelayWetMix(delayMix);
  }, [delayMix, setDelayWetMix]);

  useEffect(() => {
    // Map 0..1 to 0..0.9 feedback to avoid runaway
    setDelayFeedbackAmount(Math.max(0, Math.min(0.9, delayFeedback)));
  }, [delayFeedback, setDelayFeedbackAmount]);

  useEffect(() => {
    setReverbWetMix(reverbMix);
  }, [reverbMix, setReverbWetMix]);

  useEffect(() => {
    const decaySeconds = 0.6 + reverbDecay * 6.4;
    setReverbDecayTime(decaySeconds);
  }, [reverbDecay, setReverbDecayTime]);

  return (
    <GlassPanel depth="mixer" className="p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-5 h-5 text-studio-purple" />
        <h3 className="text-lg font-black uppercase text-white">FX Rack</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MacroKnob
          label="Bitcrush"
          value={bitcrushMacro}
          onChange={(value) => setFxRack({ bitcrush: value })}
          color="#ef4444"
        />
        <MacroKnob
          label="Filter"
          value={filterMacro}
          onChange={(value) => setFxRack({ filter: value })}
          color="#9333ea"
        />
        <MacroKnob
          label="Width"
          value={widthMacro}
          onChange={(value) => setFxRack({ width: value })}
          color="#06b6d4"
        />
      </div>

      <div className="mt-6">
        <div className="text-xs font-mono uppercase text-white/60 mb-2">Delay &amp; Reverb</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MacroKnob
            label="Delay Mix"
            value={delayMix}
            onChange={(value) => setFxRack({ delayMix: value })}
            color="#22d3ee"
          />
          <MacroKnob
            label="Delay Fb"
            value={delayFeedback}
            onChange={(value) => setFxRack({ delayFeedback: value })}
            color="#a855f7"
          />
          <MacroKnob
            label="Reverb Mix"
            value={reverbMix}
            onChange={(value) => setFxRack({ reverbMix: value })}
            color="#14b8a6"
          />
          <MacroKnob
            label="Reverb Decay"
            value={reverbDecay}
            onChange={(value) => setFxRack({ reverbDecay: value })}
            color="#f97316"
          />
        </div>
      </div>
    </GlassPanel>
  );
}
