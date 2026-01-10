"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Monitor, Zap } from 'lucide-react';
import { getStudioEngine } from '@/engine/rt/StudioEngine';
import { getRealtimeAudioSystem } from '@/engine/rt/RealtimeAudioSystem';
import { PanicStopButton } from '@/components/studio/PanicStopButton';
import { SyncControl } from '@/components/studio/SyncControl';
import type { DeckId } from '@/engine/rt/control/ControlLayout';

/**
 * DesktopStudioLayout - Desktop-optimized DJ/mixing interface
 *
 * Features:
 * - Multi-window workflow support
 * - Keyboard shortcuts
 * - Detachable visualizer
 * - Professional layout optimized for mouse + keyboard
 *
 * This is a completely separate composition from mobile studio,
 * not CSS-hidden variants.
 */
export const DesktopStudioLayout = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Deck state
  const [deckALoaded, setDeckALoaded] = useState(false);
  const [deckBLoaded, setDeckBLoaded] = useState(false);
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckBPlaying, setDeckBPlaying] = useState(false);

  // Visualizer window
  const [visualizerWindow, setVisualizerWindow] = useState<Window | null>(null);

  /**
   * Initialize StudioEngine
   */
  const handleInitialize = async () => {
    setIsInitializing(true);
    setInitError(null);

    try {
      const studio = getStudioEngine();
      await studio.initialize();

      setIsInitialized(true);
      console.log('✅ Desktop Studio initialized');
    } catch (error) {
      console.error('❌ Desktop Studio initialization failed:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Load track into deck
   */
  const handleLoadTrack = async (deck: DeckId) => {
    if (!isInitialized) return;

    // In a real app, this would open a file picker
    // For now, load a demo track
    const demoTrack = deck === 'A'
      ? '/audio/tracks/demo-a.mp3'
      : '/audio/tracks/demo-b.mp3';

    try {
      const studio = getStudioEngine();
      await studio.loadTrack(deck, demoTrack);

      if (deck === 'A') {
        setDeckALoaded(true);
      } else {
        setDeckBLoaded(true);
      }

      console.log(`✅ Track loaded into Deck ${deck}`);
    } catch (error) {
      console.error(`❌ Failed to load track into Deck ${deck}:`, error);
    }
  };

  /**
   * Toggle deck playback
   */
  const handleTogglePlayback = useCallback((deck: DeckId) => {
    if (!isInitialized) return;

    const studio = getStudioEngine();
    const state = studio.getDeckState(deck);

    if (state === 'playing') {
      studio.pause(deck);
      if (deck === 'A') setDeckAPlaying(false);
      else setDeckBPlaying(false);
    } else {
      studio.play(deck);
      if (deck === 'A') setDeckAPlaying(true);
      else setDeckBPlaying(true);
    }
  }, [isInitialized]);

  /**
   * Stop deck
   */
  const handleStop = (deck: DeckId) => {
    if (!isInitialized) return;

    const studio = getStudioEngine();
    studio.stop(deck);

    if (deck === 'A') setDeckAPlaying(false);
    else setDeckBPlaying(false);
  };

  /**
   * Open visualizer in new window
   */
  const handleOpenVisualizer = () => {
    if (visualizerWindow && !visualizerWindow.closed) {
      visualizerWindow.focus();
      return;
    }

    const newWindow = window.open(
      '/studio/visualizer',
      'StudioVisualizer',
      'width=800,height=600,menubar=no,toolbar=no,location=no,status=no'
    );

    if (newWindow) {
      setVisualizerWindow(newWindow);

      // Listen for window close
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          setVisualizerWindow(null);
          clearInterval(checkClosed);
        }
      }, 1000);
    }
  };

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    if (!isInitialized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlayback('A'); // Space = Deck A play/pause
          break;

        case 'KeyP':
          e.preventDefault();
          handleTogglePlayback('B'); // P = Deck B play/pause
          break;

        case 'KeyS':
          if (e.shiftKey) {
            e.preventDefault();
            handleStop('A');
          } else {
            e.preventDefault();
            handleStop('B');
          }
          break;

        case 'KeyV':
          e.preventDefault();
          handleOpenVisualizer();
          break;

        // Arrow keys for nudging (future implementation)
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          // TODO: Implement nudging
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInitialized, handleTogglePlayback]);

  // Cleanup visualizer window on unmount
  useEffect(() => {
    return () => {
      if (visualizerWindow && !visualizerWindow.closed) {
        visualizerWindow.close();
      }
    };
  }, [visualizerWindow]);

  // ==========================================================================
  // PHASE 9B: Sync Controller rAF Loop
  // ==========================================================================

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const tick = () => {
      try {
        const studio = getStudioEngine();
        const syncState = studio.getSyncState();

        // Only tick if sync is enabled
        if (syncState.enabled) {
          const rtAudio = getRealtimeAudioSystem();
          const audioTime = rtAudio.context.currentTime;
          studio.sync.tick(audioTime);
        }

        rafRef.current = requestAnimationFrame(tick);
      } catch (error) {
        // Silently handle errors (sync might not be ready)
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Zap className="w-20 h-20 text-[#FFD700] mx-auto" />
            <h1 className="text-6xl font-black uppercase tracking-tight text-white">
              Desktop Studio
            </h1>
            <p className="text-lg text-zinc-400 font-mono">
              Professional DJ Workstation
            </p>
          </div>

          {/* Initialize Button */}
          <motion.button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="w-full px-8 py-6 bg-[#FFD700] text-black font-black uppercase tracking-wider text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isInitializing ? 1 : 1.02 }}
            whileTap={{ scale: isInitializing ? 1 : 0.98 }}
            style={{
              boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)',
              border: '3px solid #000',
            }}
          >
            {isInitializing ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                <span>INITIALIZING...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Play className="w-6 h-6 fill-current" />
                <span>INITIALIZE STUDIO</span>
              </div>
            )}
          </motion.button>

          {/* Error */}
          {initError && (
            <div className="p-4 bg-red-500/20 border-2 border-red-500 text-red-400 font-mono text-sm">
              ERROR: {initError}
            </div>
          )}

          {/* Info */}
          <div className="space-y-2 text-sm text-zinc-500 font-mono">
            <p>• Click "INITIALIZE STUDIO" to start the audio engine</p>
            <p>• Keyboard shortcuts: Space (Play A), P (Play B), V (Visualizer)</p>
            <p>• Optimized for desktop browsers with multi-window support</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Top Bar */}
      <div className="bg-black border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Zap className="w-6 h-6 text-[#FFD700]" />
            <h1 className="text-xl font-black uppercase tracking-tight">Desktop Studio</h1>
          </div>

          <div className="flex items-center gap-3">
            <PanicStopButton variant="desktop" />
            <button
              onClick={handleOpenVisualizer}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors font-mono text-sm uppercase tracking-wider"
            >
              <Monitor className="w-4 h-4" />
              Pop Out Visualizer
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Deck Controls */}
        <div className="grid grid-cols-2 gap-6">
          {/* Deck A */}
          <div className="bg-zinc-800 border-2 border-zinc-700 p-6 space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#FFD700]">Deck A</h2>

            <div className="space-y-3">
              <button
                onClick={() => handleLoadTrack('A')}
                className="w-full px-4 py-3 bg-zinc-700 hover:bg-zinc-600 transition-colors font-mono text-sm uppercase tracking-wider"
              >
                {deckALoaded ? 'Track Loaded ✓' : 'Load Track'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTogglePlayback('A')}
                  disabled={!deckALoaded}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors font-mono text-sm uppercase tracking-wider"
                >
                  {deckAPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {deckAPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  onClick={() => handleStop('A')}
                  disabled={!deckALoaded}
                  className="px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs text-zinc-500 font-mono space-y-1">
              <p>• Space: Play/Pause</p>
              <p>• Shift+S: Stop</p>
            </div>

            {/* Sync Control */}
            {deckALoaded && (
              <div className="pt-4 border-t border-zinc-700">
                <SyncControl deckId="A" masterDeckId="B" />
              </div>
            )}
          </div>

          {/* Deck B */}
          <div className="bg-zinc-800 border-2 border-zinc-700 p-6 space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#FFD700]">Deck B</h2>

            <div className="space-y-3">
              <button
                onClick={() => handleLoadTrack('B')}
                className="w-full px-4 py-3 bg-zinc-700 hover:bg-zinc-600 transition-colors font-mono text-sm uppercase tracking-wider"
              >
                {deckBLoaded ? 'Track Loaded ✓' : 'Load Track'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTogglePlayback('B')}
                  disabled={!deckBLoaded}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors font-mono text-sm uppercase tracking-wider"
                >
                  {deckBPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {deckBPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  onClick={() => handleStop('B')}
                  disabled={!deckBLoaded}
                  className="px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs text-zinc-500 font-mono space-y-1">
              <p>• P: Play/Pause</p>
              <p>• S: Stop</p>
            </div>

            {/* Sync Control */}
            {deckBLoaded && (
              <div className="pt-4 border-t border-zinc-700">
                <SyncControl deckId="B" masterDeckId="A" />
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="bg-zinc-800 border-2 border-zinc-700 p-6">
          <h3 className="text-lg font-black uppercase tracking-tight mb-4">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-3 gap-4 text-sm font-mono">
            <div className="space-y-2">
              <p className="text-zinc-400">Space</p>
              <p className="text-white">Play/Pause Deck A</p>
            </div>
            <div className="space-y-2">
              <p className="text-zinc-400">P</p>
              <p className="text-white">Play/Pause Deck B</p>
            </div>
            <div className="space-y-2">
              <p className="text-zinc-400">V</p>
              <p className="text-white">Pop Out Visualizer</p>
            </div>
            <div className="space-y-2">
              <p className="text-zinc-400">Shift + S</p>
              <p className="text-white">Stop Deck A</p>
            </div>
            <div className="space-y-2">
              <p className="text-zinc-400">S</p>
              <p className="text-white">Stop Deck B</p>
            </div>
            <div className="space-y-2">
              <p className="text-zinc-400">← →</p>
              <p className="text-white">Nudge (Coming Soon)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
