'use client';

import { useRef, useCallback, useState } from 'react';
import { useMixerStore } from '@/store/mixerStore';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';
import { FxChainBuilder } from './FxChainBuilder';
import { ProductionExport } from './ProductionExport';

function EQKnob({ label, value, onChange }: { label: string; value: number; onChange: (val: number) => void }) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.clientY;
    let newValue = startValue.current + deltaY / 50;
    newValue = Math.max(-1, Math.min(1, newValue));
    onChange(newValue);
  }, [onChange]);

  function handleMouseUp() {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = () => {
    onChange(0);
  };

  // Rotation from -135deg to +135deg
  const rotation = value * 135;

  return (
    <div className="flex flex-col gap-2 items-center">
      <div
        className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 relative cursor-ns-resize group"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Active Arc Visual Feedback */}
        <div
          className="absolute -inset-1 rounded-full opacity-50 transition-opacity pointer-events-none"
          style={{
            background:
              value > 0
                ? `conic-gradient(from 0deg, #00f2ff 0deg, #00f2ff ${value * 135}deg, transparent ${value * 135}deg)`
                : value < 0
                ? `conic-gradient(from 0deg, transparent 0deg, transparent ${360 + value * 135}deg, #f43f5e ${
                    360 + value * 135
                  }deg, #f43f5e 360deg)`
                : 'transparent',
          }}
        ></div>

        {/* Knob Body */}
        <div className="absolute inset-0 rounded-full bg-slate-800 z-10 border border-slate-600"></div>

        {/* Indicator */}
        <div
          className="absolute inset-0 z-20"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className={`absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 rounded-full ${
              value === 0 ? 'bg-slate-400' : value > 0 ? 'bg-accent shadow-[0_0_5px_#00f2ff]' : 'bg-rose-500 shadow-[0_0_5px_#f43f5e]'
            }`}
          ></div>
        </div>
      </div>
      <span className="text-[9px] uppercase text-center text-slate-500">{label}</span>
    </div>
  );
}

export function Mixer() {
  const { eqA, eqB, crossfader, setEQ, setCrossfader, crossfaderReverse, toggleCrossfaderReverse, quantizeActive, toggleQuantize } = useMixerStore();
  const setFxRack = useStore((state) => state.setFxRack);
  const [buildUp, setBuildUp] = useState(0);

  const handleBuildUpChange = useCallback((val: number) => {
    // Map knob -1..1 to 0..1 for Macro FX
    const normalized = Math.max(0, val);
    setBuildUp(normalized);
    setFxRack({
      delayMix: normalized * 0.7,
      delayFeedback: 0.35 + (normalized * 0.5),
      filter: 0.5 + (normalized * 0.5) // HPF 0.5 -> 1.0
    });
  }, [setFxRack]);


  const isDraggingCrossfader = useRef(false);
  const crossfaderRef = useRef<HTMLDivElement>(null);

  const handleCrossfaderMove = useCallback((e: MouseEvent) => {
    if (!isDraggingCrossfader.current || !crossfaderRef.current) return;
    const rect = crossfaderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let newValue = (x / rect.width) * 2 - 1;
    newValue = Math.max(-1, Math.min(1, newValue));
    setCrossfader(newValue);
  }, [setCrossfader]);

  function handleCrossfaderUp() {
    isDraggingCrossfader.current = false;
    document.removeEventListener('mousemove', handleCrossfaderMove);
    document.removeEventListener('mouseup', handleCrossfaderUp);
  }

  const handleCrossfaderDown = (e: React.MouseEvent) => {
    isDraggingCrossfader.current = true;
    document.addEventListener('mousemove', handleCrossfaderMove);
    document.addEventListener('mouseup', handleCrossfaderUp);
    // Also update immediately on click
    if (crossfaderRef.current) {
      const rect = crossfaderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let newValue = (x / rect.width) * 2 - 1;
      newValue = Math.max(-1, Math.min(1, newValue));
      setCrossfader(newValue);
    }
  };

  const handleCrossfaderDoubleClick = () => {
    setCrossfader(0);
  };

  // Map crossfader value (-1 to 1) to left percentage (0% to 100%)
  const crossfaderLeft = `${((crossfader + 1) / 2) * 100}%`;

  return (
    <div className="col-span-12 lg:col-span-2 bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col items-center gap-6 transition-colors duration-300">
      <div className="grid grid-cols-2 gap-8 w-full">
        <div className="flex flex-col items-center gap-4">
          <EQKnob label="High" value={eqA.high} onChange={(val) => setEQ('A', 'high', val)} />
          <EQKnob label="Mid" value={eqA.mid} onChange={(val) => setEQ('A', 'mid', val)} />
          <EQKnob label="Low" value={eqA.low} onChange={(val) => setEQ('A', 'low', val)} />
          <div className="w-full mt-2">
            <FxChainBuilder deckId="A" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <EQKnob label="High" value={eqB.high} onChange={(val) => setEQ('B', 'high', val)} />
          <EQKnob label="Mid" value={eqB.mid} onChange={(val) => setEQ('B', 'mid', val)} />
          <EQKnob label="Low" value={eqB.low} onChange={(val) => setEQ('B', 'low', val)} />
          <div className="w-full mt-2">
            <FxChainBuilder deckId="B" />
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-6 w-full px-4">
        <div className="w-6 h-32 fader-track rounded-full border border-slate-800 relative">
          <div className="absolute top-10 left-0 right-0 h-8 bg-slate-400 rounded-sm border border-slate-300 shadow-lg cursor-pointer flex items-center justify-center">
            <div className="w-4 h-0.5 bg-slate-600"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 justify-between py-2">
            <div className="w-1.5 h-1 bg-red-500"></div>
            <div className="w-1.5 h-1 bg-yellow-500"></div>
            <div className="w-1.5 h-1 bg-yellow-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
          </div>
          <div className="flex flex-col gap-1 justify-between py-2">
            <div className="w-1.5 h-1 bg-red-500"></div>
            <div className="w-1.5 h-1 bg-yellow-500"></div>
            <div className="w-1.5 h-1 bg-yellow-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
            <div className="w-1.5 h-1 bg-green-500"></div>
          </div>
        </div>
        <div className="w-6 h-32 fader-track rounded-full border border-slate-800 relative">
          <div className="absolute bottom-4 left-0 right-0 h-8 bg-slate-400 rounded-sm border border-slate-300 shadow-lg cursor-pointer flex items-center justify-center">
            <div className="w-4 h-0.5 bg-slate-600"></div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full px-4 justify-around mt-2">
        <div className="flex flex-col items-center">
            <EQKnob label="Build-up" value={buildUp} onChange={handleBuildUpChange} />
        </div>
        <div className="flex flex-col gap-2 scale-75 origin-top">
            <button 
               onClick={toggleQuantize}
               className={clsx("px-2 py-1 border rounded text-[10px] font-bold transition-all", quantizeActive ? "bg-accent/20 border-accent/50 text-accent shadow-[0_0_10px_rgba(0,242,255,0.3)]" : "bg-slate-800 border-slate-700 text-slate-500")}
            >
               QUANTIZE
            </button>
            <button 
               onClick={toggleCrossfaderReverse}
               className={clsx("px-2 py-1 border rounded text-[10px] font-bold transition-all", crossfaderReverse ? "bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]" : "bg-slate-800 border-slate-700 text-slate-500")}
            >
               HAMSTER
            </button>
        </div>
      </div>

      <div className="w-full px-4 mt-auto">
        <div 
          className="h-8 w-full fader-track rounded-full border border-slate-800 relative cursor-pointer"
          ref={crossfaderRef}
          onMouseDown={handleCrossfaderDown}
          onDoubleClick={handleCrossfaderDoubleClick}
        >
          <div 
            className="absolute top-0 bottom-0 w-10 bg-slate-400 rounded-sm border border-slate-300 shadow-lg flex items-center justify-center"
            style={{ left: crossfaderLeft, transform: 'translateX(-50%)' }}
          >
            <div className="h-4 w-0.5 bg-slate-600 pointer-events-none"></div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-1 mt-2">
          <div className="w-1 h-1 rounded-full bg-accent animate-pulse shadow-[0_0_5px_#00f2ff]"></div>
          <span className="text-[7px] text-accent font-bold uppercase tracking-tighter">
            Crossfader Fusion™ Active
          </span>
        </div>
        <p className="text-[8px] uppercase tracking-widest text-center mt-2 text-slate-500 mb-4">
          Crossfader
        </p>
        
        <ProductionExport />
      </div>
    </div>
  );
}
