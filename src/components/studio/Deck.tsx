'use client';

import { Play } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useCallback, DragEvent, useRef, useEffect } from 'react';
import { useDeckStore } from '@/store/deckStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useDeckAudio } from '@/hooks/useDeckAudio';
import { PerformancePads } from './PerformancePads';
import { JogWheel3D } from './JogWheel3D';

interface DeckProps {
  deckId: 'A' | 'B';
}

// Phase 8: Per-deck accent colors (Neon Blue = A, Neon Magenta = B)
const DECK_ACCENT: Record<'A' | 'B', string> = {
  A: '#00f2ff',  // Neon Blue
  B: '#ff00f2',  // Neon Magenta
};
const DECK_ACCENT_RGB: Record<'A' | 'B', string> = {
  A: '0,242,255',
  B: '255,0,242',
};

// Phase 8: Neon glassmorphic stem button base class
const stemBtnBase =
  'flex-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-all select-none touch-none active:scale-95';
const stemBtnInactive =
  'bg-slate-900/60 border-slate-700/50 text-slate-600 hover:text-slate-400';

// Phase 8: Mock lyric phrases keyed by phrase index (0-indexed, 32-beat phrases)
// In production these would come from a lyrics API; here we mock Piko FG style verses.
const MOCK_LYRIC_PHRASES = [
  'Intro — chill con el beat...',
  'Verse 1 — pa\' mis hermanos...',
  'Pre-Chorus — la noche empieza...',
  'Chorus — te busco en el jardín...',
  'Verse 2 — flow suave, mente clara...',
  'Bridge — el ritmo no para...',
  'Chorus — te busco en el jardín...',
  'Outro — y el sol vuelve a salir...',
];

export function Deck({ deckId }: DeckProps) {
  const isRight = deckId === 'B';
  const accent = DECK_ACCENT[deckId];
  const accentRgb = DECK_ACCENT_RGB[deckId];

  const { loadTrack, toggleSlipMode, toggleStem, toggleSibilance, toggleSub } = useDeckStore();
  const { tracks } = useLibraryStore();
  const { 
    currentTime, ghostTime, deckState, duration, isPlaying, isLoading, track, 
    togglePlay, scrubTrack, endScrub, handleCueDown, handleCueUp 
  } = useDeckAudio(deckId);
  
  const [currentBpm, setCurrentBpm] = useState(track ? Number(track.bpm) : 120);
  const [, setTapTimes] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Rotation is sourced from Zustand (updated via updateTelemetry)
  const rotation = useDeckStore((s) => (deckId === 'A' ? s.deckA : s.deckB).rotation);
  const jogWheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const rotationRef = useRef(0);

  // Transient Visualizer — per-bar heights for kick-drum pulse simulation
  const [transientBars, setTransientBars] = useState([0.3, 0.6, 0.4, 0.8, 0.35, 0.7, 0.45, 0.9]);

  // Keep rotationRef in sync with store value for the animation loop
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Auto-rotation when playing
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      if (isPlaying && !isDraggingRef.current) {
        const dt = time - lastTime;
        const newRotation = (rotationRef.current + (200 * dt) / 1000) % 360;
        rotationRef.current = newRotation;
        useDeckStore.getState().updateTelemetry(deckId, { rotation: newRotation });
      }
      lastTime = time;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, deckId]);

  // Transient Visualizer — animate kick-pulse bars when Deck B is playing
  useEffect(() => {
    if (deckId !== 'B') return;
    if (!isPlaying) return;

    let raf: number;
    let frame = 0;
    const tick = () => {
      frame++;
      // Simulate kick transients at ~quarter-note interval (every 8 frames at 60fps ≈ 133ms)
      if (frame % 8 === 0) {
        setTransientBars((prev) =>
          prev.map((_, i) => {
            // Kick hits on beats 1 & 3 (index 0,4), snare on 2 & 4 (index 2,6)
            const isKick   = i === 0 || i === 4;
            const isSnare  = i === 2 || i === 6;
            const base = isKick ? 0.9 : isSnare ? 0.7 : 0.2 + Math.random() * 0.4;
            return base;
          })
        );
      } else {
        // Decay
        setTransientBars((prev) => prev.map((v) => Math.max(0.05, v * 0.88)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, deckId]);

  const getAngle = (e: React.PointerEvent | PointerEvent) => {
    if (!jogWheelRef.current) return 0;
    const rect = jogWheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    return Math.atan2(y, x) * (180 / Math.PI);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastAngleRef.current = getAngle(e);
    // @ts-expect-error polyfill or specific type mismatch
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const currentAngle = getAngle(e);
    let deltaAngle = currentAngle - lastAngleRef.current;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const newRotation = (rotationRef.current + deltaAngle) % 360;
    rotationRef.current = newRotation;
    useDeckStore.getState().updateTelemetry(deckId, { rotation: newRotation });
    lastAngleRef.current = currentAngle;

    const timeDelta = (deltaAngle / 360) * 1.8;
    scrubTrack(timeDelta);

    if (Math.abs(deltaAngle) > 2 && navigator.vibrate) {
      navigator.vibrate(2);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    // @ts-expect-error polyfill or specific type mismatch
    e.target.releasePointerCapture(e.pointerId);
    endScrub();
  };

  const handleTap = useCallback(() => {
    const now = Date.now();
    setTapTimes((prev) => {
      const newTapTimes = [...prev, now].filter((t) => now - t < 3000);
      if (newTapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < newTapTimes.length; i++) {
          intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
        }
        const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / averageInterval);
        setCurrentBpm(calculatedBpm);
      }
      return newTapTimes;
    });
  }, []);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const trackId = e.dataTransfer.getData('text/plain');
    if (trackId) {
      const t = tracks.find(t => t.id === Number(trackId));
      if (t) {
        loadTrack(deckId, t);
        setCurrentBpm(Number(t.bpm));
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const title = track?.title || 'No Track Loaded';
  const artist = track?.artist || 'Drag track here';
  const bpm = track ? currentBpm : '--';
  const keySignature = track?.key || '--';
  const timeRemaining = track ? formatTime(duration - currentTime) : '00:00.00';

  // Phase 8: stem / DSP state
  const stems = deckState.stems;
  const sibilanceTamerActive = deckState.sibilanceTamerActive;
  const subGeneratorActive   = deckState.subGeneratorActive;

  // AI Lyric HUD: derive current phrase index from 32-beat position
  const phraseIndex = track && duration > 0 && currentBpm > 0
    ? Math.floor(currentTime / ((60 / currentBpm) * 32)) % MOCK_LYRIC_PHRASES.length
    : 0;
  const activeLyricLine = MOCK_LYRIC_PHRASES[phraseIndex];

  return (
    <div 
      className={clsx(
        "col-span-12 lg:col-span-5 shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] rounded-xl border p-6 flex flex-col gap-4 transition-colors duration-300 relative overflow-hidden",
        "bg-[var(--color-obsidian-900)] backdrop-blur-2xl",
        isDragOver
          ? `border-[${accent}] shadow-[0_0_30px_rgba(${accentRgb},0.2)] bg-[${accent}]/10`
          : "border-slate-800/60"
      )}
      style={track?.coverArt ? {
        backgroundImage: `url(${track.coverArt})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {track?.coverArt && (
        <div className="absolute inset-0 bg-[var(--color-obsidian-900)]/80 backdrop-blur-2xl pointer-events-none z-0" />
      )}

      {/* Waveform row */}
      <div className="waveform-container relative z-10 h-20 bg-black/50 rounded-lg overflow-hidden border border-slate-800/50">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <svg height="100%" preserveAspectRatio="none" width="100%">
            <path
              d={
                !isRight
                  ? 'M0 40 Q 50 10, 100 40 T 200 40 T 300 40 T 400 40 T 500 40'
                  : 'M0 40 Q 50 70, 100 40 T 200 40 T 300 40 T 400 40 T 500 40'
              }
              fill="transparent"
              stroke={accent}
              strokeWidth="2"
            />
            <path
              d={
                !isRight
                  ? 'M0 45 Q 60 20, 120 45 T 240 45 T 360 45 T 480 45 T 600 45'
                  : 'M0 35 Q 60 60, 120 35 T 240 35 T 360 35 T 480 35 T 600 35'
              }
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth="1"
            />
          </svg>
        </div>
        <div
          className="absolute left-1/2 top-0 bottom-0 w-0.5 z-10"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
        />

        {deckState.slipMode && duration > 0 && (
          <div 
            className="absolute top-0 bottom-0 bg-white/20 z-0 border-r border-[#f43f5e] border-dashed" 
            style={{ width: `${(ghostTime / duration) * 100}%` }}
          />
        )}
        {duration > 0 && (
          <div 
            className="absolute top-0 bottom-0 z-0"
            style={{ width: `${(currentTime / duration) * 100}%`, background: `${accent}33` }}
          />
        )}

        <div className="absolute inset-0 flex items-end gap-1 px-4 pb-1 pointer-events-none">
          <div className="bg-accent/80 text-primary text-[8px] font-bold px-1 rounded pointer-events-auto hover:bg-white">INTRO</div>
          <div className="bg-yellow-500/80 text-primary text-[8px] font-bold px-1 rounded pointer-events-auto hover:bg-white">VERSE</div>
          <div className="bg-purple-500/80 text-white text-[8px] font-bold px-1 rounded pointer-events-auto hover:bg-white">DROP</div>
        </div>
        <div className="absolute top-1 left-4 flex gap-2 pointer-events-none">
          {[{c:'bg-red-500',n:'1'},{c:'bg-green-500',n:'2'},{c:'bg-blue-500',n:'3'}].map(({c,n}) => (
            <div key={n} className={`w-4 h-4 rounded ${c} text-white text-[9px] flex items-center justify-center pointer-events-auto`}>{n}</div>
          ))}
        </div>

        {/* Phase 8: Neon glassmorphic stem quick-access buttons */}
        <div className="absolute top-1 right-2 flex gap-1">
          <button
            onClick={() => toggleStem(deckId, 'vocals')}
            className={clsx(
              'w-5 h-5 rounded text-[9px] font-bold transition-all border select-none touch-none active:scale-95',
              stems.vocals
                ? 'text-[#bf00ff] border-[#bf00ff]/60 bg-[#bf00ff]/15 shadow-[0_0_6px_#bf00ff]'
                : 'bg-slate-900/80 border-slate-700 text-slate-600 hover:text-slate-400'
            )}
          >V</button>
          <button
            onClick={() => toggleStem(deckId, 'drums')}
            className={clsx(
              'w-5 h-5 rounded text-[9px] font-bold transition-all border select-none touch-none active:scale-95',
              stems.drums
                ? `border-[${accent}]/60 bg-[${accent}]/15 shadow-[0_0_6px_${accent}]`
                : 'bg-slate-900/80 border-slate-700 text-slate-600 hover:text-slate-400'
            )}
            style={stems.drums ? { color: accent } : {}}
          >D</button>
          <button
            onClick={() => toggleStem(deckId, 'inst')}
            className={clsx(
              'w-5 h-5 rounded text-[9px] font-bold transition-all border select-none touch-none active:scale-95',
              stems.inst
                ? 'text-[#f59e0b] border-[#f59e0b]/60 bg-[#f59e0b]/15 shadow-[0_0_6px_#f59e0b]'
                : 'bg-slate-900/80 border-slate-700 text-slate-600 hover:text-slate-400'
            )}
          >I</button>
        </div>
      </div>

      {/* Track info row */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="font-bold text-lg" style={{ color: accent }}>{title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-xs">
              {artist} &bull; {bpm} BPM &bull; {keySignature}
            </p>
            <button
              onClick={handleTap}
              className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-slate-400 hover:text-accent hover:border-accent transition-colors active:bg-accent/20"
            >TAP</button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-slate-200">{timeRemaining}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest">Remaining</p>
        </div>
      </div>

      {/* Transport + Jog row */}
      <div className="flex justify-between items-center py-4 relative z-10">
        {!isRight && (
          <div className="flex flex-col gap-4 items-center">
            <div 
              ref={jogWheelRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="jog-wheel w-48 h-48 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform touch-none"
              style={{ boxShadow: `inset 0 0 20px rgba(0,0,0,0.9), 0 0 15px rgba(${accentRgb},0.15)` }}
            >
              <JogWheel3D rotation={rotation} coverArt={track?.coverArt} isLoading={isLoading} slipActive={deckState.slipMode} ghostRotation={ghostTime} />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handleCueDown(); }}
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handleCueUp(); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handleCueUp(); }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border-2 text-accent flex flex-col items-center justify-center font-bold hover:bg-slate-700 transition-all select-none touch-none active:scale-95"
            style={{ borderColor: accent, boxShadow: `0 0 15px rgba(${accentRgb},0.2)` }}
          >
            <span className="text-xs">CUE</span>
          </button>
          <button
            onClick={togglePlay}
            disabled={!track}
            className={clsx(
              'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none touch-none active:scale-95',
              isPlaying
                ? 'text-primary'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:text-slate-200'
            )}
            style={isPlaying ? { background: accent, boxShadow: `0 0 20px rgba(${accentRgb},0.5)` } : {}}
          >
            <Play className={clsx('w-6 h-6 sm:w-8 sm:h-8', isPlaying ? 'fill-primary' : 'fill-slate-400')} />
            <span className="text-[10px]">PLAY</span>
          </button>
          <button
            onClick={() => toggleSlipMode(deckId)}
            className={clsx(
              'mt-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest border border-transparent select-none touch-none active:scale-95',
              deckState.slipMode
                ? 'bg-[#f43f5e]/20 text-[#f43f5e] border-[#f43f5e]/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            )}
          >SLIP</button>
        </div>
        {isRight && (
          <div className="flex flex-col gap-4 items-center">
            <div 
              ref={jogWheelRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="jog-wheel w-48 h-48 rounded-full border-4 border-slate-800 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform touch-none"
              style={{ boxShadow: `0 0 15px rgba(${accentRgb},0.15)` }}
            >
              <JogWheel3D rotation={rotation} coverArt={track?.coverArt} isLoading={isLoading} slipActive={deckState.slipMode} ghostRotation={ghostTime} />
            </div>
          </div>
        )}
      </div>

      {/* Phase 8: Asymmetric Bento HUDs */}
      {deckId === 'A' ? (
        /* Deck A — Vocal Presence + AI Lyric HUD */
        <div
          className="relative z-10 rounded-lg border backdrop-blur-md p-3 flex flex-col gap-2"
          style={{
            borderColor: 'rgba(0,242,255,0.2)',
            background: 'rgba(0,242,255,0.04)',
            boxShadow: '0 0 16px rgba(0,242,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(0,242,255,0.6)' }}>
              Vocal Presence HUD
            </span>
            <span className="text-[8px] text-slate-500 font-mono">Deck A · Neon Blue</span>
          </div>

          {/* Stem toggles — VOC highlighted in #bf00ff per spec */}
          <div className="flex gap-1">
            {([
              { stem: 'vocals' as const, label: 'VOC', activeColor: '#bf00ff', activeRgb: '191,0,255' },
              { stem: 'drums'  as const, label: 'DRUM', activeColor: '#00f2ff', activeRgb: '0,242,255' },
              { stem: 'inst'   as const, label: 'INST', activeColor: '#f59e0b', activeRgb: '245,158,11' },
            ]).map(({ stem, label, activeColor, activeRgb }) => (
              <button
                key={stem}
                onClick={() => toggleStem('A', stem)}
                className={clsx(stemBtnBase, !stems[stem] && stemBtnInactive)}
                style={stems[stem] ? {
                  color: activeColor,
                  borderColor: `rgba(${activeRgb},0.7)`,
                  background: `rgba(${activeRgb},0.18)`,
                  boxShadow: `0 0 10px ${activeColor}`,
                } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sibilance Tamer */}
          <button
            onClick={() => toggleSibilance('A')}
            className={clsx(
              'py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all select-none touch-none active:scale-95 w-full',
              sibilanceTamerActive
                ? 'text-[#00f2ff] border-[#00f2ff]/60 bg-[#00f2ff]/15 shadow-[0_0_10px_#00f2ff]'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-300'
            )}
          >
            {sibilanceTamerActive ? '◉ Sibilance Tamer ON' : '○ Sibilance Tamer'}
          </button>

          {/* AI Lyric HUD — phrase-indexed mock display */}
          <div
            className="rounded border border-[#bf00ff]/20 bg-[#bf00ff]/5 px-2 py-1.5 flex flex-col gap-0.5"
            style={{ minHeight: 38 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-widest text-[#bf00ff]/50 font-bold">AI Lyric Display</span>
              <span className="text-[8px] font-mono text-slate-600">Vocal-Only Reverb Bus</span>
            </div>
            <p className="text-[10px] font-mono text-slate-300 truncate leading-tight">
              {track ? activeLyricLine : 'Load a track to see lyrics...'}
            </p>
            {/* Vocal reverb bus toggle */}
            <div className="flex items-center gap-1 mt-0.5">
              <div className={clsx(
                'w-1.5 h-1.5 rounded-full',
                track && stems.vocals ? 'bg-[#bf00ff] shadow-[0_0_4px_#bf00ff]' : 'bg-slate-700'
              )} />
              <span className="text-[8px] text-slate-600">
                {track && stems.vocals ? 'Reverb bus ACTIVE' : 'Reverb bus BYPASSED'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Deck B — Transient Shaping + Visualizer HUD */
        <div
          className="relative z-10 rounded-lg border backdrop-blur-md p-3 flex flex-col gap-2"
          style={{
            borderColor: 'rgba(255,0,242,0.2)',
            background: 'rgba(255,0,242,0.04)',
            boxShadow: '0 0 16px rgba(255,0,242,0.07)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,0,242,0.6)' }}>
              Transient Shaping HUD
            </span>
            <span className="text-[8px] text-slate-500 font-mono">Deck B · Neon Magenta</span>
          </div>

          {/* Stem toggles */}
          <div className="flex gap-1">
            {([
              { stem: 'vocals' as const, label: 'VOC', activeColor: '#bf00ff', activeRgb: '191,0,255' },
              { stem: 'drums'  as const, label: 'DRUM', activeColor: '#ff00f2', activeRgb: '255,0,242' },
              { stem: 'inst'   as const, label: 'INST', activeColor: '#f59e0b', activeRgb: '245,158,11' },
            ]).map(({ stem, label, activeColor, activeRgb }) => (
              <button
                key={stem}
                onClick={() => toggleStem('B', stem)}
                className={clsx(stemBtnBase, !stems[stem] && stemBtnInactive)}
                style={stems[stem] ? {
                  color: activeColor,
                  borderColor: `rgba(${activeRgb},0.7)`,
                  background: `rgba(${activeRgb},0.18)`,
                  boxShadow: `0 0 10px ${activeColor}`,
                } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sub-Generator toggle */}
          <button
            onClick={() => toggleSub('B')}
            className={clsx(
              'py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all select-none touch-none active:scale-95 w-full',
              subGeneratorActive
                ? 'text-[#ff00f2] border-[#ff00f2]/60 bg-[#ff00f2]/15 shadow-[0_0_10px_#ff00f2]'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-300'
            )}
          >
            {subGeneratorActive ? '◉ Sub Generator ON' : '○ Sub Generator'}
          </button>

          {/* Transient Visualizer — kick-drum pulse bars */}
          <div
            className="rounded border border-[#ff00f2]/20 bg-[#ff00f2]/5 px-2 py-1.5 flex flex-col gap-1"
          >
            <span className="text-[8px] uppercase tracking-widest text-[#ff00f2]/50 font-bold">
              Transient Visualizer
            </span>
            <div className="flex items-end gap-0.5 h-8">
              {transientBars.map((height, i) => {
                const isKick  = i === 0 || i === 4;
                const isSnare = i === 2 || i === 6;
                const barColor = isKick
                  ? '#ff00f2'
                  : isSnare
                  ? '#00f2ff'
                  : 'rgba(255,255,255,0.3)';
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all duration-75"
                    style={{
                      height: `${Math.round(height * 100)}%`,
                      background: barColor,
                      boxShadow: isPlaying && height > 0.6 ? `0 0 6px ${barColor}` : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8-Pad Performance Grid */}
      <PerformancePads deckId={deckId} />
    </div>
  );
}
