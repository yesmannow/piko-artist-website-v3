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

  // Removed auto-initialize (requires button click)
  const initializeAudio = async () => {
    if (audioInitialized || initInFlight.current) return;
    initInFlight.current = true;
    try {
      console.log('[StudioLayout] Starting Tone context...');
      await Tone.start();
      console.log('[StudioLayout] Tone context started, state:', Tone.getContext().state);
      
      await init();
      setAudioInitialized(true);
      setAudioStarted(true);
      setMasterBusNodes(getMasterBus());
      console.log('[StudioLayout] Engine initialized');

      // Recover any persisted tracks
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
    } finally {
      initInFlight.current = false;
    }
  };

  // Show loading state while initializing — Syndicate Vault Gate
  if (!audioInitialized) {
    return (
      <main className="studio-shell" style={{ background: '#0a0a0c' }}>
        {/* Surveillance Grid Overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,242,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div className="studio-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#e2e8f0',
              marginBottom: '0.5rem',
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              SYNDICATE VAULT
            </h1>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: 'rgba(226,232,240,0.4)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: '2.5rem',
            }}>
              AUDIO ENGINE STANDBY // AWAITING AUTHORIZATION
            </p>
            <button 
              onClick={() => initializeAudio()}
              disabled={initInFlight.current}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'linear-gradient(145deg, #0f0f14, #080810)',
                color: '#00f2ff',
                border: '1px solid rgba(0,242,255,0.3)',
                padding: '14px 40px',
                borderRadius: '0',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                opacity: initInFlight.current ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.8), 0 0 20px rgba(0,242,255,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2ff';
                e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(0,0,0,0.8), 0 0 30px rgba(0,242,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,242,255,0.3)';
                e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(0,0,0,0.8), 0 0 20px rgba(0,242,255,0.1)';
              }}
            >
              {initInFlight.current ? '[ INITIALIZING... ]' : '[ ENTER VAULT ]'}
            </button>
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
