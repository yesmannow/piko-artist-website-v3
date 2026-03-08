"use client";

import { useStudioStore } from '@/store/useStudioStore';

interface StemOverlayProps {
  deckId: 'A' | 'B';
}

type StemKey = 'vocals' | 'drums' | 'bass' | 'other';

export function StemOverlay({ deckId }: StemOverlayProps) {
  const toggleStemMute = useStudioStore((state) => state.toggleStemMute);
  const mutedStems = useStudioStore((state) => state.mutedStems[deckId]);

  const stems: { id: StemKey; label: string; color: string }[] = [
    { id: 'vocals', label: 'V', color: 'bg-blue-500' },
    { id: 'drums', label: 'D', color: 'bg-red-500' },
    { id: 'bass', label: 'B', color: 'bg-yellow-500' },
    { id: 'other', label: 'M', color: 'bg-purple-500' },
  ];

  return (
    <div className="absolute top-2 right-2 flex gap-1 bg-black/50 p-1 rounded-lg backdrop-blur-md border border-white/10 z-10">
      {stems.map((stem) => {
        const isMuted = mutedStems[stem.id];
        return (
          <button
            key={stem.id}
            onClick={() => toggleStemMute(deckId, stem.id)}
            className={`w-8 h-8 rounded-md flex items-center justify-center font-black font-mono text-sm transition-all duration-200
              ${isMuted ? 'bg-obsidian-900/80 text-white/30 border border-white/5' : `${stem.color} text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
            `}
          >
            {stem.label}
          </button>
        );
      })}
    </div>
  );
}
