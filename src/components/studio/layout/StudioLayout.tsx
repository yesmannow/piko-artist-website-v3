"use client";

/**
 * StudioLayout - Persistent Audio Shell
 * 
 * Holds useAudioEngine at root level (never unmounts)
 * Manages view switching between Decks and Library
 * Audio persists across all view changes
 */

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useStore } from '@/store/useStore';
import { DeckGrid } from '@/components/studio/ui/DeckGrid';
import { TrackLibrary } from '@/components/studio/ui/TrackLibrary';
import { StudioNavMenu } from '@/components/studio/navigation/StudioNavMenu';
import { FXRackSheet } from '@/components/studio/ui/FXRackSheet';
import { Scene3D } from '@/components/studio/visuals/Scene3D';
import { Library, Music, Pause, Play } from 'lucide-react';
import { motion } from 'framer-motion';

type ViewMode = 'mixer' | 'library';

export function StudioLayout() {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('mixer');
  const [masterBusNodes, setMasterBusNodes] = useState<{ bus: Tone.Gain | null; postFx: Tone.Gain | null }>({
    bus: null,
    postFx: null,
  });
  const { init, getMasterBus, play, pause, getDeckDuration, getTransportSeconds } = useAudioEngine();
  const masterBpm = useStore((state) => state.masterBpm);
  const setMasterBpm = useStore((state) => state.setMasterBpm);
  const deckAPlaying = useStore((state) => state.deckA.isPlaying);
  const deckBPlaying = useStore((state) => state.deckB.isPlaying);
  const setDeckPlaying = useStore((state) => state.setDeckPlaying);

  const isPlaying = deckAPlaying || deckBPlaying;
  const [bpmInput, setBpmInput] = useState(String(masterBpm));
  const [masterProgress, setMasterProgress] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const handleOpenLibrary = () => {
      setActiveView('library');
    };

    window.addEventListener('studio:open-library', handleOpenLibrary);
    return () => {
      window.removeEventListener('studio:open-library', handleOpenLibrary);
    };
  }, []);

  useEffect(() => {
    setBpmInput(String(masterBpm));
  }, [masterBpm]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasVisited = window.localStorage.getItem('hasVisitedStudio');
    if (!hasVisited) {
      setShowOnboarding(true);
      window.localStorage.setItem('hasVisitedStudio', 'true');
    }
  }, []);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
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
  }, [getDeckDuration, getTransportSeconds]);

  const handleEnterStudio = async () => {
    if (audioInitialized) return;
    try {
      await Tone.start();
      await init();
      setAudioInitialized(true);
      setMasterBusNodes(getMasterBus());
      console.log('[StudioLayout] Audio initialized');
    } catch (error) {
      console.error('[StudioLayout] Failed to initialize audio:', error);
      alert('Failed to initialize audio. Please try again.');
    }
  };

  const handleTrackLoaded = (_deck: 'A' | 'B') => {
    // Auto-switch to decks view when track is loaded
    setActiveView('mixer');
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      pause('A');
      pause('B');
      setDeckPlaying('A', false);
      setDeckPlaying('B', false);
      return;
    }

    play('A');
    play('B');
    setDeckPlaying('A', true);
    setDeckPlaying('B', true);
  };

  // Show enter screen if audio not initialized
  if (!audioInitialized) {
    return (
      <main 
        className="h-dvh w-full overflow-hidden text-white studio-grain flex items-center justify-center"
        style={{
          backgroundColor: '#050505',
          backgroundImage: 'var(--background-image-liquid-mesh)',
          backgroundSize: '200% 200%',
          animation: 'liquid-move 18s ease-in-out infinite'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black uppercase mb-4">Studio V3</h1>
          <p className="text-white/60 mb-8">High-Performance DJ Mixer</p>
          <motion.button
            onClick={handleEnterStudio}
            className="px-8 py-4 bg-studio-cyan text-black font-black uppercase rounded-lg hover:bg-studio-cyan/90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Enter Studio
          </motion.button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="h-dvh w-screen flex flex-col bg-obsidian-900 overflow-hidden relative selection:bg-studio-cyan/30 text-white studio-grain">
      <div className="absolute inset-0 z-0">
        <Scene3D className="w-full h-full" isActive={activeView === 'mixer'} />
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="h-0.5 w-full bg-white/10">
          <div className="h-full bg-studio-cyan" style={{ width: `${masterProgress * 100}%` }} />
        </div>
        {/* 1. TOP BAR (Fixed Height, Never Shrinks) */}
        <header className="h-16 md:h-20 flex-none z-50 glass-panel border-b border-white/10 relative">
          <div className="h-full flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <StudioNavMenu />
              <h1 className="text-2xl font-black uppercase">DJ Studio</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Global Transport */}
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <button
                  onClick={handleTogglePlay}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                  aria-label={isPlaying ? 'Pause all decks' : 'Play all decks'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="text-xs font-mono uppercase text-white/60">BPM</div>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={bpmInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setBpmInput(nextValue);
                    const parsed = Number(nextValue);
                    if (!Number.isNaN(parsed)) {
                      const clamped = Math.max(1, Math.min(300, parsed));
                      setMasterBpm(clamped);
                    }
                  }}
                  className="w-16 bg-transparent text-sm font-mono text-white focus:outline-none"
                  aria-label="Master BPM"
                />
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 p-1">
                <button
                  onClick={() => setActiveView('mixer')}
                  className={`px-4 py-1.5 rounded-full font-mono text-xs uppercase transition-colors flex items-center gap-2 ${
                    activeView === 'mixer'
                      ? 'bg-studio-cyan/20 border border-studio-cyan text-studio-cyan'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Library className="w-4 h-4" />
                  <span>Mixer</span>
                </button>
                <button
                  onClick={() => setActiveView('library')}
                  className={`px-4 py-1.5 rounded-full font-mono text-xs uppercase transition-colors flex items-center gap-2 ${
                    activeView === 'library'
                      ? 'bg-studio-cyan/20 border border-studio-cyan text-studio-cyan'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Library</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 2. MAIN WORKSPACE (Takes ALL remaining space, allows scrolling inside) */}
        <div className="flex-1 relative min-h-0 w-full">
          {/* MIXER VIEW */}
          <div
            style={{ display: activeView === 'mixer' ? 'flex' : 'none' }}
            className="absolute inset-0 flex flex-col pb-[3.5rem]"
          >
            {/* Force DeckGrid to fill available space */}
            <div className="flex-1 min-h-0 w-full p-2 md:p-4">
              <DeckGrid />
            </div>
          </div>

          {/* LIBRARY VIEW */}
          <div
            style={{ display: activeView === 'library' ? 'flex' : 'none' }}
            className="absolute inset-0 flex flex-col z-40 bg-obsidian-900/95"
          >
            <TrackLibrary
              isOpen={true}
              onClose={() => setActiveView('mixer')}
              onTrackLoaded={handleTrackLoaded}
              inline={true}
            />
          </div>
        </div>

        {/* 3. FX RACK FOOTER (Fixed, High Z-Index) */}
        <FXRackSheet masterBus={masterBusNodes.bus || undefined} masterPostFx={masterBusNodes.postFx || undefined} />
      </div>
      {showOnboarding && activeView === 'mixer' && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-6 top-40 max-w-xs border border-white/10 bg-obsidian-900/90 backdrop-blur-[20px] rounded-lg p-4 text-xs font-mono">
              <div className="text-studio-cyan font-semibold mb-2">Load Track</div>
              Tap the deck platter to open the Vault and load a track.
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 max-w-xs border border-white/10 bg-obsidian-900/90 backdrop-blur-[20px] rounded-lg p-4 text-xs font-mono">
              <div className="text-studio-purple font-semibold mb-2">Isolate Vocals</div>
              Use the STEM buttons to mute or isolate vocals, drums, and bass.
            </div>
            <div className="absolute right-6 bottom-28 max-w-xs border border-white/10 bg-obsidian-900/90 backdrop-blur-[20px] rounded-lg p-4 text-xs font-mono">
              <div className="text-red-400 font-semibold mb-2">Record Mix</div>
              Hit REC in the center mixer to capture and export your set.
            </div>
          </div>
          <button
            className="absolute right-6 top-6 px-4 py-2 rounded-full bg-white/10 text-xs font-mono uppercase tracking-widest"
            onClick={() => setShowOnboarding(false)}
          >
            Dismiss
          </button>
        </div>
      )}
    </main>
  );
}
