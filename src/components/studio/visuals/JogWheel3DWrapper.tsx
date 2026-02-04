"use client";

/**
 * JogWheel3DWrapper Component
 *
 * Wrapper to integrate JogPlatter3D into the Deck UI
 * - Provides Canvas context if needed
 * - Wires audio engine controls to 3D interactions
 * - Handles scratch and pitch bend callbacks
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { JogPlatter3D } from '../visuals/JogPlatter3D';
import { useAudioEngine } from '@/hooks/audio/useAudioEngine';
import { useStore } from '@/store/useStore';
import { useStudioStore } from '@/store/useStudioStore';

interface JogWheel3DWrapperProps {
  deckId: 'A' | 'B';
  artworkUrl?: string;
  title?: string;
  progress: number;
  isPlaying: boolean;
  bpm?: number;
  accent?: string;
  className?: string;
}

export function JogWheel3DWrapper({
  deckId,
  artworkUrl,
  progress,
  isPlaying,
  bpm,
  accent = '#22d3ee',
  className = '',
}: JogWheel3DWrapperProps) {
  const { seekTo } = useAudioEngine();
  const { setDeckRate } = useStore();
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const deckDuration = useStudioStore((state) => state[deckId].duration);
  const deckCurrentTime = useStudioStore((state) => state[deckId].currentTime);

  const handleScratch = (delta: number) => {
    // Convert rotation delta to time delta
    // Full rotation = 4 beats
    const duration = deckDuration || 1;
    const beatsPerRotation = 4;
    const timeDelta = (delta / (Math.PI * 2)) * beatsPerRotation * (60 / (bpm || 120));
    const newTime = Math.max(0, Math.min(duration, deckCurrentTime + timeDelta));

    seekTo(deckId, newTime);
  };

  const handleBend = (amount: number) => {
    // Pitch bend: temporary pitch adjustment
    // Clamp to reasonable range (-8% to +8%)
    const bendAmount = Math.max(-0.08, Math.min(0.08, amount * 0.01));
    const currentRate = deck.playbackRate || 1;
    const newRate = currentRate + bendAmount;

    setDeckRate(deckId, newRate);
  };

  return (
    <div className={`relative w-full max-w-90 aspect-square ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 3], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={1} />
        <pointLight position={[-5, 5, -5]} intensity={0.4} />

        <Suspense fallback={null}>
          <JogPlatter3D
            deckId={deckId}
            artworkUrl={artworkUrl}
            isPlaying={isPlaying}
            bpm={bpm}
            progress={progress}
            accent={accent}
            onScratch={handleScratch}
            onBend={handleBend}
          />
        </Suspense>
      </Canvas>

      {/* Fallback overlay for loading state */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-xs text-white/20 font-mono">3D MODE</div>
      </div>
    </div>
  );
}
