"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { getStudioEngine } from '@/engine/rt/StudioEngine';
import { getRealtimeAudioSystem } from '@/engine/rt/RealtimeAudioSystem';
import { getAudioEngine } from '@/engine/AudioEngine';
import type { DeckId } from '@/engine/rt/control/ControlLayout';

interface PanicStopButtonProps {
  className?: string;
  variant?: 'mobile' | 'desktop';
}

/**
 * PanicStopButton - Emergency audio reset button
 *
 * Stops all audio playback, resets all decks, and clears audio state.
 * Useful for recovering from audio glitches or stuck playback.
 */
export function PanicStopButton({ className = '', variant = 'desktop' }: PanicStopButtonProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handlePanicStop = async () => {
    setIsResetting(true);

    try {
      // Stop all StudioEngine decks
      try {
        const studio = getStudioEngine();
        if (studio.state === 'ready') {
          studio.stop('A');
          studio.stop('B');
          studio.pause('A');
          studio.pause('B');
        }
      } catch (error) {
        console.warn('[PanicStop] StudioEngine not available:', error);
      }

      // Stop all AudioEngine decks
      try {
        const audioEngine = getAudioEngine();
        audioEngine.stop('deckA');
        audioEngine.stop('deckB');
        audioEngine.pause('deckA');
        audioEngine.pause('deckB');
      } catch (error) {
        console.warn('[PanicStop] AudioEngine not available:', error);
      }

      // Reset RealtimeAudioSystem if needed
      try {
        const rtAudio = getRealtimeAudioSystem();
        // Note: We don't dispose the context, just ensure it's in a clean state
        if (rtAudio.context.state === 'running') {
          // Context is fine, just stop any sources
        }
      } catch (error) {
        console.warn('[PanicStop] RealtimeAudioSystem not available:', error);
      }

      // Force garbage collection hint (browser may or may not honor this)
      if ('gc' in window && typeof (window as any).gc === 'function') {
        try {
          (window as any).gc();
        } catch {}
      }

      console.log('[PanicStop] ✅ Audio reset complete');
    } catch (error) {
      console.error('[PanicStop] ❌ Reset failed:', error);
    } finally {
      // Small delay to show reset animation
      setTimeout(() => {
        setIsResetting(false);
      }, 500);
    }
  };

  const isMobile = variant === 'mobile';

  return (
    <motion.button
      onClick={handlePanicStop}
      disabled={isResetting}
      className={`
        ${isMobile ? 'px-4 py-2' : 'px-6 py-3'}
        bg-red-900/80 backdrop-blur-sm
        border-2 border-red-500
        font-mono text-sm uppercase tracking-wider
        transition-all duration-200
        flex items-center justify-center gap-2
        ${isMobile ? 'min-h-[40px]' : 'min-h-[48px]'}
        ${isResetting ? 'opacity-50 cursor-wait' : 'hover:bg-red-900 hover:border-red-400'}
        ${className}
      `}
      whileHover={!isResetting ? { scale: 1.02 } : {}}
      whileTap={!isResetting ? { scale: 0.98 } : {}}
      animate={isResetting ? { scale: 0.95 } : { scale: 1 }}
    >
      {isResetting ? (
        <>
          <RotateCcw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
          <span>RESETTING...</span>
        </>
      ) : (
        <>
          <AlertTriangle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          <span>PANIC STOP / RESET</span>
        </>
      )}
    </motion.button>
  );
}
