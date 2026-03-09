'use client';

import React from 'react';
import { useMixerStore, FxModuleDef } from '@/store/mixerStore';
import { Trash, Power } from 'lucide-react';
import { clsx } from 'clsx';

export function FxChainBuilder({ deckId }: { deckId: 'A' | 'B' }) {
  const { fxA, fxB, addFx, removeFx, toggleFx, setFxParam } = useMixerStore();
  const fxModules = deckId === 'A' ? fxA : fxB;

  return (
    <div className="w-full flex flex-col gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800 backdrop-blur-md">
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
        <span className="text-accent track-widest">FX Chain</span>
        <select 
           className="bg-slate-800 border border-slate-600 rounded px-1 transition-colors hover:border-accent/50 outline-none cursor-pointer"
           onChange={(e) => {
              if (e.target.value) addFx(deckId, e.target.value as FxModuleDef['type']);
              e.target.value = '';
           }}
           value=""
        >
          <option value="" disabled>+ ADD</option>
          <option value="filter">Filter</option>
          <option value="reverb">Reverb</option>
          <option value="saturator">Saturator</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-2 mt-1">
        {fxModules.map(fx => (
          <div key={fx.id} className={clsx("p-2 rounded-md bg-slate-800/80 border transition-all duration-300", fx.enabled ? "border-accent/40 shadow-[0_0_10px_rgba(0,242,255,0.1)]" : "border-slate-700 opacity-60")}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold text-slate-200 tracking-wider uppercase">{fx.type}</span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => toggleFx(deckId, fx.id)} 
                  className={clsx("p-1 rounded transition-colors", fx.enabled ? "text-accent bg-accent/20" : "text-slate-500 bg-slate-700")}
                  title={fx.enabled ? "Bypass" : "Enable"}
                >
                  <Power size={10} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => removeFx(deckId, fx.id)} 
                  className="p-1 rounded text-red-500/70 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Remove"
                >
                  <Trash size={10} />
                </button>
              </div>
            </div>
            
            {/* Parameters */}
            <div className="flex flex-col gap-2">
               {Object.keys(fx.params).map(param => (
                  <div key={param} className="flex gap-2 items-center">
                     <span className="text-[8px] text-slate-400 uppercase w-12 truncate">{param}</span>
                     <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.01} 
                        value={fx.params[param]} 
                        onChange={(e) => setFxParam(deckId, fx.id, param, parseFloat(e.target.value))}
                        className="flex-1 min-w-0 h-1 bg-slate-700 appearance-none rounded outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent shadow-[0_0_5px_#00f2ff]"
                     />
                  </div>
               ))}
            </div>
          </div>
        ))}
        {fxModules.length === 0 && (
          <div className="text-[9px] text-slate-600 text-center py-2 italic">Empty</div>
        )}
      </div>
    </div>
  );
}
