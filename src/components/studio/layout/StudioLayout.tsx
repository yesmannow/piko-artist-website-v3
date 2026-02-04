"use client";

/**
 * StudioLayout - Persistent Audio Shell
 * 
 * Holds useAudioEngine at root level (never unmounts)
 * Manages view switching between Decks and Library
 * Audio persists across all view changes
 */

import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { useAudioEngine } from '@/hooks/audio/useAudioEngine';
import { useStore } from '@/store/useStore';
import { useStudioStore } from '@/store/useStudioStore';
import { StudioShell } from '@/components/studio/layout/StudioShell';
import type { PikoTestHelpers } from '@/utils/testHelpers';

type PikoWindow = Window & {
  __PIKO_TEST_HELPERS__?: PikoTestHelpers;
  __PIKO_STORE__?: typeof useStudioStore;
  studio?: { seek: (value: number) => void };
};

export function StudioLayout() {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const initInFlight = useRef(false);
  const [masterBusNodes, setMasterBusNodes] = useState<{ bus: Tone.Gain | null; postFx: Tone.Gain | null }>({
    bus: null,
    postFx: null,
  });
  const { init, getMasterBus, getDeckDuration, getTransportSeconds, loadTrack, seekTo } = useAudioEngine();
  const setAudioStarted = useStore((state) => state.setAudioStarted);
  const isAudioStarted = useStore((state) => state.isAudioStarted);
  const isAppActive = useStore((state) => state.isAppActive);
  const setAppActive = useStore((state) => state.setAppActive);
  const [masterProgress, setMasterProgress] = useState(0);
  const setLibraryOpen = useStudioStore((state) => state.setLibraryOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as PikoWindow;
    const shouldInstallHelpers =
      process.env.NODE_ENV === 'test' ||
      process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true';

    if (!shouldInstallHelpers) return;

    win.__PIKO_STORE__ = useStudioStore;

    import('@/utils/testHelpers')
      .then((mod) => mod.installTestHelpers())
      .catch((err) => console.warn('[TestHelpers] Failed to install', err));

    return () => {
      delete win.__PIKO_TEST_HELPERS__;
      delete win.__PIKO_STORE__;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as PikoWindow;
    win.studio = {
      seek: (value: number) => {
        useStudioStore.getState().seek(value);
      },
    };

    return () => {
      delete win.studio;
    };
  }, []);

  useEffect(() => {
    return useStudioStore.subscribe(
      (state) => state.seekRequest,
      (request) => {
        if (!request) return;
        const normalized = Math.max(0, Math.min(1, request.value));
        const duration = Math.max(getDeckDuration('A'), getDeckDuration('B'));
        if (duration <= 0) return;
        const target = normalized * duration;
        seekTo('A', target);
        seekTo('B', target);
      }
    );
  }, [getDeckDuration, seekTo]);

  useEffect(() => {
    const handleOpenLibrary = () => {
      if (!isAudioStarted) return;
      setLibraryOpen(true);
    };

    window.addEventListener('studio:open-library', handleOpenLibrary);
    return () => {
      window.removeEventListener('studio:open-library', handleOpenLibrary);
    };
  }, [isAudioStarted, setLibraryOpen]);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      if (!isAppActive) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }
      const duration = Math.max(getDeckDuration('A'), getDeckDuration('B'));
      const seconds = getTransportSeconds();
      const progress = duration > 0 ? Math.min(1, seconds / duration) : 0;
      setMasterProgress(progress);
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [getDeckDuration, getTransportSeconds, isAppActive]);

  useEffect(() => {
    const handleVisibility = () => {
      setAppActive(!document.hidden);
    };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [setAppActive]);

  // Auto-initialize audio on mount
  useEffect(() => {
    const initializeAudio = async () => {
      if (audioInitialized || initInFlight.current) return;
      initInFlight.current = true;
      try {
        await Tone.start();
        await init();
        setAudioInitialized(true);
        setAudioStarted(true);
        setMasterBusNodes(getMasterBus());
        console.log('[StudioLayout] Audio initialized');

        // Recover any persisted tracks after audio is ready
        const { deckA, deckB } = useStore.getState();
        const recoverDeck = async (deckId: 'A' | 'B', deckState: typeof deckA) => {
          const data = deckState.trackData;
          if (data && data.url && data.bpm) {
            try {
              await loadTrack(deckId, data.url, data.bpm, true);
            } catch (err) {
              console.warn(`[StudioLayout] Failed to recover Deck ${deckId}:`, err);
            }
          }
        };

        await recoverDeck('A', deckA);
        await recoverDeck('B', deckB);
      } catch (error) {
        console.error('[StudioLayout] Failed to initialize audio:', error);
        // Don't show alert - just log the error
      } finally {
        initInFlight.current = false;
      }
    };

    initializeAudio();
  }, [audioInitialized, init, getMasterBus, loadTrack, setAudioStarted]);

  // Show loading state while initializing
  if (!audioInitialized) {
    return (
      <main className="studio-shell">
        <div className="studio-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Initializing audio engine...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <StudioShell
      masterProgress={masterProgress}
      masterBus={masterBusNodes.bus}
      masterPostFx={masterBusNodes.postFx}
    />
  );
}
