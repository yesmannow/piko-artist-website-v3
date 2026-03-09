import { useState } from 'react';
import { clsx } from 'clsx';
import { useDeckStore } from '@/store/deckStore';
import { useStudioStore } from '@/store/useStudioStore';
import { useMixerStore } from '@/store/mixerStore';
import { useDeckAudio } from '@/hooks/useDeckAudio';

type PadMode = 'HOT_CUE' | 'SLICER' | 'STEMS';

export function PerformancePads({ deckId }: { deckId: 'A' | 'B' }) {
  const [mode, setMode] = useState<PadMode>('HOT_CUE');
  
  const deckState = useDeckStore((state) => deckId === 'A' ? state.deckA : state.deckB);
  const { setCurrentTime, toggleSlipMode } = useDeckStore();
  const { quantizeActive } = useMixerStore();
  
  const mutedStems = useStudioStore((state) => state.mutedStems[deckId]);
  const toggleStemMute = useStudioStore((state) => state.toggleStemMute);
  
  const { triggerSlipSnapBack, getQuantizedTime } = useDeckAudio(deckId);

  // Simple local hot cue state per deck instance for this demo
  const [hotCues, setHotCues] = useState<Record<number, number>>({});
  
  // Slicer interval
  const [slicingPad, setSlicingPad] = useState<number | null>(null);

  const handlePadDown = (index: number) => {
    if (mode === 'HOT_CUE') {
      if (hotCues[index] !== undefined) {
         let target = hotCues[index];
         if (quantizeActive) target = getQuantizedTime(target, deckState.track?.bpm ? Number(deckState.track.bpm) : undefined);
         setCurrentTime(deckId, target);
      } else {
         setHotCues(prev => ({ ...prev, [index]: deckState.currentTime }));
      }
    } else if (mode === 'SLICER') {
      // Engage slip mode roll
      if (!deckState.slipMode) toggleSlipMode(deckId);
      setSlicingPad(index);
      // Let useDeckAudio loop the audio in a real app, for now we trigger snap back on release
    } else if (mode === 'STEMS') {
      // Map 0-3 to stems
      const stemKeys = ['vocals', 'drums', 'bass', 'other'] as const;
      if (index < 4) toggleStemMute(deckId, stemKeys[index]);
    }
  };

  const handlePadUp = (index: number) => {
    if (mode === 'SLICER' && slicingPad === index) {
      setSlicingPad(null);
      triggerSlipSnapBack();
      if (deckState.slipMode) toggleSlipMode(deckId);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 bg-[#0a0a0a]/80 backdrop-blur-[20px] p-4 rounded-xl border border-white/10 mt-4">
      {/* Mode Selectors */}
      <div className="flex gap-2 justify-between">
        <button 
          onClick={() => setMode('HOT_CUE')}
          className={clsx("px-4 py-1.5 rounded text-xs font-bold transition-all", mode === 'HOT_CUE' ? "bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_15px_rgba(0,255,0,0.3)]" : "bg-slate-800 text-slate-400 border border-slate-700")}
        >
          HOT CUE
        </button>
        <button 
          onClick={() => setMode('SLICER')}
          className={clsx("px-4 py-1.5 rounded text-xs font-bold transition-all", mode === 'SLICER' ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(255,0,0,0.3)]" : "bg-slate-800 text-slate-400 border border-slate-700")}
        >
          SLICER
        </button>
        <button 
          onClick={() => setMode('STEMS')}
          className={clsx("px-4 py-1.5 rounded text-xs font-bold transition-all", mode === 'STEMS' ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(0,0,255,0.3)]" : "bg-slate-800 text-slate-400 border border-slate-700")}
        >
          STEMS
        </button>
      </div>

      {/* 2x4 Pad Grid */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => {
          let colorClass = "bg-slate-800 border-slate-700";
          let label = `PAD ${i+1}`;
          let isActive = false;

          if (mode === 'HOT_CUE') {
            const hasCue = hotCues[i] !== undefined;
            if (hasCue) {
              colorClass = "bg-green-500 border-green-400 shadow-[0_0_20px_rgba(0,255,0,0.4)] text-black";
              label = "CUE " + (i+1);
            } else {
              colorClass = "bg-slate-800 text-slate-500 hover:bg-slate-700 border-white/10";
            }
          } else if (mode === 'SLICER') {
            isActive = slicingPad === i;
            colorClass = isActive 
              ? "bg-red-500 border-red-400 shadow-[0_0_20px_rgba(255,0,0,0.6)] text-black" 
              : "bg-slate-800 text-red-500/50 border-red-500/20 hover:bg-red-900/40";
            label = ['1/8', '1/4', '1/2', '1', '2', '4', '8', '16'][i];
          } else if (mode === 'STEMS') {
            const stems = ['Vocals', 'Drums', 'Bass', 'Other'];
            if (i < 4) {
              const stemKey = ['vocals', 'drums', 'bass', 'other'][i] as keyof typeof mutedStems;
              isActive = !mutedStems[stemKey]; // Active = not muted
              colorClass = isActive 
                ? "bg-blue-500 border-blue-400 shadow-[0_0_20px_rgba(0,0,255,0.4)] text-black" 
                : "bg-slate-800 text-blue-500/50 border-blue-500/20";
              label = stems[i];
            } else {
              colorClass = "bg-slate-900 border-transparent opacity-50";
              label = "—";
            }
          }

          return (
            <button
              key={i}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePadDown(i); }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handlePadUp(i); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handlePadUp(i); }}
              className={clsx(
                "h-16 rounded-md font-bold text-[10px] sm:text-xs transition-all border-2 active:scale-[0.97] select-none touch-none",
                colorClass
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
