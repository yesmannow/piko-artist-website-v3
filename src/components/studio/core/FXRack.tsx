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

import { useRef, useEffect, useState } from 'react';
import * as Tone from 'tone';
import { useStore } from '@/store/useStore';
import { Sliders } from 'lucide-react';

interface FXRackProps {
  masterBus?: Tone.Gain | null;
  masterPostFx?: Tone.Gain | null;
}

export function FXRack({ masterBus, masterPostFx }: FXRackProps) {
  const { masterBpm } = useStore();
  
  // FX Nodes
  const bitcrusherRef = useRef<Tone.BitCrusher | null>(null);
  const autoFilterRef = useRef<Tone.AutoFilter | null>(null);
  const stereoWidenerRef = useRef<Tone.StereoWidener | null>(null);
  const dryWetRef = useRef<Tone.CrossFade | null>(null);
  
  // Macro values (0-1)
  const [bitcrushMacro, setBitcrushMacro] = useState(0);
  const [filterMacro, setFilterMacro] = useState(0);
  const [widthMacro, setWidthMacro] = useState(0);

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

  const MacroKnob = ({
    label,
    value,
    onChange,
    color,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    color: string;
  }) => {
    const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const normalized = 1 - Math.max(0, Math.min(1, y / rect.height));
      onChange(normalized);
    };

    return (
      <div className="flex flex-col items-center gap-2">
        <label className="text-xs font-mono uppercase text-white/60">{label}</label>
        <div
          className="relative w-12 h-24 bg-obsidian-800 rounded-lg border border-white/10 cursor-pointer touch-none"
          onMouseDown={handleDrag}
          style={{ touchAction: 'none' }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-b-lg transition-all"
            style={{
              height: `${value * 100}%`,
              backgroundColor: color,
              opacity: 0.6,
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
            style={{
              bottom: `${value * 100}%`,
              transform: 'translate(-50%, 50%)',
            }}
          />
        </div>
        <span className="text-xs font-mono text-white/80">{Math.round(value * 100)}%</span>
      </div>
    );
  };

  return (
    <div className="glass-panel p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-5 h-5 text-studio-purple" />
        <h3 className="text-lg font-black uppercase text-white">FX Rack</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MacroKnob
          label="Bitcrush"
          value={bitcrushMacro}
          onChange={setBitcrushMacro}
          color="#ef4444"
        />
        <MacroKnob
          label="Filter"
          value={filterMacro}
          onChange={setFilterMacro}
          color="#9333ea"
        />
        <MacroKnob
          label="Width"
          value={widthMacro}
          onChange={setWidthMacro}
          color="#06b6d4"
        />
      </div>
    </div>
  );
}
