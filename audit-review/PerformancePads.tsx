"use client";

import { useState, useEffect } from 'react';
import { getAudioEngine } from '@/engine/AudioEngine';
import { triggerHaptic, HAPTIC_PATTERNS } from '@/utils/haptics';
import { useAudioStore } from '@/store/useAudioStore';

interface PerformancePadsProps {
  deckId: string;
}

/**
 * PHASE 6: Performance Pads Component
 * 
 * 2x4 grid of performance pads for loops and hot cues
 * Row 1: Loop controls (IN, OUT, RELOOP, EXIT)
 * Row 2: Hot cues (1, 2, 3, 4)
 */
export const PerformancePads = ({ deckId }: PerformancePadsProps) => {
  const [loopActive, setLoopActive] = useState(false);
  const [hotCuesSet, setHotCuesSet] = useState<Set<number>>(new Set());
  const deckState = useAudioStore((state) => state.decks[deckId]);

  // Poll loop and cue states (could be optimized with store integration)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const engine = getAudioEngine();
        setLoopActive(engine.isLoopActive(deckId));
        
        const cuesSet = new Set<number>();
        for (let i = 1; i <= 4; i++) {
          if (engine.hasHotCue(deckId, i)) {
            cuesSet.add(i);
          }
        }
        setHotCuesSet(cuesSet);
      } catch (error) {
        // Engine might not be initialized
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deckId]);

  // Loop Controls
  const handleLoopIn = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    try {
      const engine = getAudioEngine();
      const deck = engine.decks.get(deckId);
      if (!deck || !engine.context) return;

      // Set loop start at current position
      const currentTime = engine.context.currentTime - deck.startTime + deck.pauseTime;
      engine.setLoop(deckId, currentTime);
    } catch (error) {
      console.warn('Loop IN failed:', error);
    }
  };

  const handleLoopOut = () => {
    // PHASE 3: Triple buzz when loop is set
    triggerHaptic(HAPTIC_PATTERNS.LOOP_SET);
    try {
      const engine = getAudioEngine();
      const deck = engine.decks.get(deckId);
      if (!deck || !engine.context) return;

      // Set loop end at current position
      const currentTime = engine.context.currentTime - deck.startTime + deck.pauseTime;
      engine.setLoop(deckId, deck.loopStart, currentTime);
      engine.enableLoop(deckId);
    } catch (error) {
      console.warn('Loop OUT failed:', error);
    }
  };

  const handleReloop = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    try {
      const engine = getAudioEngine();
      if (loopActive) {
        engine.disableLoop(deckId);
      } else {
        engine.enableLoop(deckId);
      }
    } catch (error) {
      console.warn('RELOOP failed:', error);
    }
  };

  const handleExit = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    try {
      const engine = getAudioEngine();
      engine.disableLoop(deckId);
    } catch (error) {
      console.warn('EXIT failed:', error);
    }
  };

  // Hot Cue Controls
  const handleHotCue = (index: number, isLongPress: boolean = false) => {
    // PHASE 3: Different haptics for cue set vs jump
    if (isLongPress) {
      triggerHaptic(HAPTIC_PATTERNS.ERROR); // Delete cue
    } else {
      const engine = getAudioEngine();
      const hasCue = engine.hasHotCue(deckId, index);
      
      if (hasCue) {
        // PHASE 3: Use CUE_JUMP pattern when jumping to existing cue
        triggerHaptic(HAPTIC_PATTERNS.CUE_JUMP);
      } else {
        // PHASE 3: Use CUE_TOGGLE pattern when setting new cue
        triggerHaptic(HAPTIC_PATTERNS.CUE_TOGGLE);
      }
    }
    
    try {
      const engine = getAudioEngine();
      
      if (isLongPress) {
        // Long press: Delete cue
        engine.deleteHotCue(deckId, index);
      } else {
        // Normal press: Trigger or set cue
        engine.triggerHotCue(deckId, index);
      }
    } catch (error) {
      console.warn(`Hot cue ${index} failed:`, error);
    }
  };

  // Determine deck color
  const deckColor = deckId === 'deckA' ? '#00d9ff' : '#ff00d9';
  const deckColorDim = deckId === 'deckA' ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255, 0, 217, 0.2)';

  return (
    <div className="w-full p-2 bg-gray-950 border-t border-gray-800">
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className="text-xs font-barlow uppercase tracking-wider text-gray-500">
          Performance Pads - {deckId === 'deckA' ? 'Deck A' : 'Deck B'}
        </h3>
      </div>

      {/* Pads Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: Loop Controls */}
        <button
          onClick={handleLoopIn}
          disabled={!deckState.url}
          className="aspect-square rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          style={{
            backgroundColor: deckColorDim,
            borderWidth: '2px',
            borderColor: deckColor,
            color: deckColor,
          }}
        >
          IN
        </button>

        <button
          onClick={handleLoopOut}
          disabled={!deckState.url}
          className="aspect-square rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          style={{
            backgroundColor: deckColorDim,
            borderWidth: '2px',
            borderColor: deckColor,
            color: deckColor,
          }}
        >
          OUT
        </button>

        <button
          onClick={handleReloop}
          disabled={!deckState.url}
          className="aspect-square rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          style={{
            backgroundColor: loopActive ? deckColor : deckColorDim,
            borderWidth: '2px',
            borderColor: deckColor,
            color: loopActive ? '#000' : deckColor,
          }}
        >
          LOOP
        </button>

        <button
          onClick={handleExit}
          disabled={!deckState.url || !loopActive}
          className="aspect-square rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          style={{
            backgroundColor: deckColorDim,
            borderWidth: '2px',
            borderColor: deckColor,
            color: deckColor,
          }}
        >
          EXIT
        </button>

        {/* Row 2: Hot Cues */}
        {[1, 2, 3, 4].map((index) => (
          <button
            key={index}
            onClick={() => handleHotCue(index, false)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleHotCue(index, true);
            }}
            disabled={!deckState.url}
            className="aspect-square rounded-lg font-barlow uppercase text-2xl font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              backgroundColor: hotCuesSet.has(index) ? deckColor : deckColorDim,
              borderWidth: '2px',
              borderColor: deckColor,
              color: hotCuesSet.has(index) ? '#000' : deckColor,
            }}
          >
            {index}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-2 text-center text-[10px] text-gray-600 font-mono">
        Tap cue to jump • Long press to delete
      </div>
    </div>
  );
};
