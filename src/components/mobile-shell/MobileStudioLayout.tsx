"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Zap } from 'lucide-react';
import { getMIDIManager } from '@/engine/MIDIManager';
import { getRealtimeAudioSystem } from '@/engine/rt/RealtimeAudioSystem';
import { getStudioEngine } from '@/engine/rt/StudioEngine';
import { useIOSAudioUnlock } from '@/hooks/useIOSAudioUnlock';
import { useSilentAudioLoop } from '@/hooks/useSilentAudioLoop';
import { useMIDIStore } from '@/store/useMIDIStore';
import { AlwaysOnTopBar } from './AlwaysOnTopBar';
import { AlwaysOnBottomBar } from './AlwaysOnBottomBar';
import { MainDeckContainer } from './MainDeckContainer';
import { LibraryDrawer } from './LibraryDrawer';
import { OrientationGuard } from './OrientationGuard';
import { SettingsModal } from './modals/SettingsModal';
import { get, set } from 'idb-keyval';

export const MobileStudioLayout = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [learnToast, setLearnToast] = useState<string | null>(null);

  // PHASE 4: Real-time audio system
  const rtAudioSystem = getRealtimeAudioSystem();
  const [rtAudioContext, setRtAudioContext] = useState<AudioContext | null>(null);

  // PHASE 4: iOS audio unlock hook
  const isAudioUnlocked = useIOSAudioUnlock(rtAudioContext, {
    onUnlock: () => {
      console.log('🔓 iOS Audio unlocked');
      // PHASE 3: Start silent audio loop when unlocked
      if (rtAudioContext) {
        silentLoop.start();
      }
    },
    debug: true,
  });

  // PHASE 3: Silent audio loop for iOS keep-alive
  const silentLoop = useSilentAudioLoop(rtAudioContext);

  // PHASE 9: Subscribe to MIDI learn mode
  const learnMode = useMIDIStore((state) => state.learnMode);
  const learnTarget = useMIDIStore((state) => state.learnTarget);
  const mappings = useMIDIStore((state) => state.mappings);
  const setMapping = useMIDIStore((state) => state.setMapping);

  /**
   * PHASE 4: Initialize Real-time Audio System
   * This is the new bootstrap layer that runs before legacy AudioEngine
   */
  const initializeRealtimeAudio = async () => {
    try {
      console.log('🎵 [Phase 4] Initializing real-time audio system...');

      // Initialize the new real-time audio system
      await rtAudioSystem.initialize({
        latencyHint: 'interactive',
        sampleRate: 44100,
        workletModules: ['/worklets/mixer-processor.js'], // Will load if exists
      });

      // Store context for iOS unlock hook
      setRtAudioContext(rtAudioSystem.context);

      console.log('✅ [Phase 4] Real-time audio system initialized');
      return true;
    } catch (error) {
      console.error('❌ [Phase 4] Real-time audio system initialization failed:', error);
      // Don't fail completely - allow legacy system to try
      return false;
    }
  };

  /**
   * PHASE 4: Initialize StudioEngine (new high-level API)
   */
  const initializeStudioEngine = async () => {
    try {
      console.log('🎵 [Phase 4] Initializing StudioEngine...');

      const { getStudioEngine } = await import('@/engine/rt/StudioEngine');
      const studio = getStudioEngine();
      await studio.initialize();

      console.log('✅ [Phase 4] StudioEngine initialized');
      return true;
    } catch (error) {
      console.error('❌ [Phase 4] StudioEngine initialization failed:', error);
      return false;
    }
  };

  /**
   * REMEDIATION: "Tap to Start" - User-Intent Boot Sequence
   * PHASE 4: Now initializes StudioEngine instead of legacy AudioEngine
   */
  const handleStartSession = async () => {
    setIsInitializing(true);
    setInitError(null);

    try {
      // PHASE 4: Initialize new StudioEngine
      const studioSuccess = await initializeStudioEngine();

      if (!studioSuccess) {
        setInitError('Failed to initialize studio engine');
        setIsInitializing(false);
        return;
      }

      // PHASE 7: Initialize MIDI Manager
      const midiSuccess = await getMIDIManager().initialize();
      if (midiSuccess) {
        console.log('🎹 MIDI Manager initialized');
      } else {
        console.warn('⚠️ MIDI not available (browser may not support WebMIDI)');
      }

      // PHASE 9: Load persisted data from IndexedDB
      await loadPersistedData();

      setIsInitialized(true);
      console.log('🎵 Studio V2 Session Started');
    } catch (error) {
      console.error('Session start error:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error');
      setIsInitializing(false);
    }
  };

  // PHASE 9: Load persisted data from IndexedDB
  const loadPersistedData = async () => {
    try {
      // Load MIDI mappings
      const savedMappings = await get('midiMappings');
      if (savedMappings) {
        Object.entries(savedMappings).forEach(([key, value]: [string, any]) => {
          setMapping(key, value.action, value.label);
        });
        console.log('✅ Loaded MIDI mappings from storage');
      }

      // TODO: Load hot cues per track
      // TODO: Load user settings
    } catch (error) {
      console.warn('Failed to load persisted data:', error);
    }
  };

  // PHASE 9: Save MIDI mappings to IndexedDB when they change
  useEffect(() => {
    if (Object.keys(mappings).length > 0) {
      set('midiMappings', mappings).catch((err: Error) => {
        console.warn('Failed to save MIDI mappings:', err);
      });
    }
  }, [mappings]);

  // PHASE 3: Start silent audio loop when audio context is ready
  useEffect(() => {
    if (rtAudioContext && isAudioUnlocked && isInitialized) {
      silentLoop.start();
      console.log('🔊 Silent audio loop started for iOS keep-alive');
    }
    
    return () => {
      silentLoop.stop();
    };
  }, [rtAudioContext, isAudioUnlocked, isInitialized, silentLoop]);

  // PHASE 9: Show toast when learn mode activates
  useEffect(() => {
    if (learnMode && learnTarget) {
      setLearnToast('Waiting for MIDI signal...');
    } else if (!learnMode && learnToast) {
      // Learn mode ended, show success
      setTimeout(() => setLearnToast(null), 2000);
    }
  }, [learnMode, learnTarget]);

  // PHASE 9: Handle learn mode clicks
  const handleLearnModeClick = (e: React.MouseEvent) => {
    if (learnMode) {
      e.preventDefault();
      e.stopPropagation();
      // User should click specific controls, not the overlay
    }
  };

  return (
    // PHASE 3 & 4: Fixed viewport container with no scrolling
    // Force landscape and full viewport with safe-area-inset support
    <main
      className="fixed inset-0 flex flex-col bg-black overflow-hidden safe-area"
      style={{
        touchAction: 'none',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto',
      }}
    >
      {/* REMEDIATION: CSS Orientation Guard - Enforce landscape mode */}
      <OrientationGuard />

      {/* PHASE 9: Learn Mode Overlay */}
      {learnMode && (
        <div
          className="fixed inset-0 z-40 bg-blue-500/20 backdrop-blur-[2px] flex items-center justify-center"
          onClick={handleLearnModeClick}
        >
          <div className="bg-gray-900 px-6 py-4 rounded-lg shadow-2xl border-2 border-blue-500">
            <p className="text-white font-barlow uppercase tracking-wider text-sm">
              🎹 MIDI Learn Mode Active
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Click any control to map it
            </p>
          </div>
        </div>
      )}

      {/* PHASE 9: Learn Toast */}
      {learnToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 px-6 py-3 rounded-lg shadow-2xl border border-blue-500">
          <p className="text-white font-mono text-sm">{learnToast}</p>
        </div>
      )}

      {/* PHASE 9: Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* REMEDIATION: "Tap to Start" Overlay - Only show before initialization */}
      <AnimatePresence>
        {!isInitialized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black"
          >
            {/* Grain texture overlay */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
              {/* Logo/Title */}
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-16 h-16 text-[#FFD700] animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                  STUDIO V2
                </h1>
                <p className="text-sm text-zinc-400 font-mono uppercase tracking-wider">
                  Mobile DJ Workstation
                </p>
              </div>

              {/* Start Button */}
              <motion.button
                onClick={handleStartSession}
                disabled={isInitializing}
                className="group relative px-12 py-6 bg-[#FFD700] text-black font-black uppercase tracking-wider text-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                whileHover={{ scale: isInitializing ? 1 : 1.05 }}
                whileTap={{ scale: isInitializing ? 1 : 0.95 }}
                style={{
                  boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)',
                  border: '3px solid #000',
                }}
              >
                <div className="flex items-center gap-3">
                  {isInitializing ? (
                    <>
                      <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                      <span>INITIALIZING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 fill-current" />
                      <span>START SESSION</span>
                    </>
                  )}
                </div>
              </motion.button>

              {/* Audio Unlock Indicator */}
              {isInitializing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 text-[#FFD700]">
                    {isAudioUnlocked ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-mono">Audio Unlocked</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="text-xs font-mono">Unlocking Audio...</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    {rtAudioContext ? `${rtAudioContext.state} | ${rtAudioContext.sampleRate}Hz` : 'Initializing...'}
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {initError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 font-mono text-sm"
                >
                  ERROR: {initError}
                </motion.div>
              )}

              {/* Info Text */}
              <div className="max-w-md space-y-2 text-xs text-zinc-500 font-mono">
                <p>• Tap "START SESSION" to unlock audio engine</p>
                <p>• Optimized for iOS Safari & mobile browsers</p>
                <p>• Best experienced in landscape mode</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REMEDIATION: Only mount heavy components after initialization */}
      {isInitialized && (
        <>
          {/* Layer 3: Top Status Bar */}
          <div className="z-40 flex-none">
            <AlwaysOnTopBar onSettingsClick={() => setIsSettingsOpen(true)} />
          </div>

          {/* Layer 2: Main Work Area (Swappable Views) */}
          <div className="relative flex-1 z-10">
            <MainDeckContainer />
          </div>

          {/* Layer 1: Bottom Control Bar */}
          <div className="z-30 flex-none pb-safe">
            <AlwaysOnBottomBar />
          </div>

          {/* Layer 0: Library Drawer (Overlay) */}
          <LibraryDrawer />
        </>
      )}

      {/* PHASE 9B: Sync Controller rAF Loop */}
      <SyncRafLoop />
    </main>
  );
};

/**
 * SyncRafLoop - RequestAnimationFrame loop for sync controller
 *
 * Phase 9B: Ticks sync controller on every frame when sync is enabled
 */
function SyncRafLoop() {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
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
  }, []);

  return null; // This component doesn't render anything
}
