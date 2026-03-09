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

// Phase 8: Neon glassmorphic stem button base class
const stemBtnBase =
  'flex-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-all select-none touch-none active:scale-95';
const stemBtnInactive =
  'bg-slate-900/60 border-slate-700/50 text-slate-600 hover:text-slate-400';

export function Deck({ deckId }: DeckProps) {
  const isRight = deckId === 'B';
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
  // Local ref to track rotation between frames without triggering re-renders during animation
  const rotationRef = useRef(0);

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
        // 33 1/3 RPM = 33.333 / 60 * 360 = 200 degrees per second
        const newRotation = (rotationRef.current + (200 * dt) / 1000) % 360;
        rotationRef.current = newRotation;
        // Zero-lag: read/write store via getState() to bypass React re-renders
        useDeckStore.getState().updateTelemetry(deckId, { rotation: newRotation });
      }
      lastTime = time;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
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
    
    // Handle wrap-around
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const newRotation = (rotationRef.current + deltaAngle) % 360;
    rotationRef.current = newRotation;
    useDeckStore.getState().updateTelemetry(deckId, { rotation: newRotation });
    lastAngleRef.current = currentAngle;

    // Time delta: 33.333 RPM = 1.8 seconds per revolution.
    // So deltaTime = deltaAngle / 360 * 1.8
    const timeDelta = (deltaAngle / 360) * 1.8;
    scrubTrack(timeDelta);

    // Subtle haptic feedback when scratching
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

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

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

  // Phase 8: stem / DSP state snapshots
  const stems = deckState.stems;
  const sibilanceTamerActive = deckState.sibilanceTamerActive;
  const subGeneratorActive   = deckState.subGeneratorActive;

  return (
    <div 
      className={clsx(
        "col-span-12 lg:col-span-5 shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] rounded-xl border p-6 flex flex-col gap-4 transition-colors duration-300 relative overflow-hidden",
        "bg-[var(--color-obsidian-900)] backdrop-blur-2xl",
        isDragOver ? "border-accent shadow-[0_0_30px_rgba(0,242,255,0.2)] bg-accent/10" : "border-slate-800/60"
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
        <div className="absolute inset-0 bg-[var(--color-obsidian-900)]/80 backdrop-blur-2xl pointer-events-none z-0"></div>
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
              stroke="#00f2ff"
              strokeWidth="2"
            ></path>
            <path
              d={
                !isRight
                  ? 'M0 45 Q 60 20, 120 45 T 240 45 T 360 45 T 480 45 T 600 45'
                  : 'M0 35 Q 60 60, 120 35 T 240 35 T 360 35 T 480 35 T 600 35'
              }
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth="1"
            ></path>
          </svg>
        </div>
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-accent/80 z-10 shadow-[0_0_8px_#00f2ff]"></div>
        
        {/* Ghost Playhead Progress */}
        {deckState.slipMode && duration > 0 && (
          <div 
            className="absolute top-0 bottom-0 bg-white/20 z-0 border-r border-[#f43f5e] border-dashed" 
            style={{ width: `${(ghostTime / duration) * 100}%` }}
          />
        )}
        
        {/* Playhead Progress */}
        {duration > 0 && (
          <div 
            className="absolute top-0 bottom-0 bg-accent/20 z-0" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        )}

        <div className="absolute inset-0 flex items-end gap-1 px-4 pb-1 pointer-events-none">
          <div className="bg-accent/80 text-primary text-[8px] font-bold px-1 rounded cursor-pointer pointer-events-auto hover:bg-white">
            INTRO
          </div>
          <div className="bg-yellow-500/80 text-primary text-[8px] font-bold px-1 rounded cursor-pointer pointer-events-auto hover:bg-white">
            VERSE
          </div>
          <div className="bg-purple-500/80 text-white text-[8px] font-bold px-1 rounded cursor-pointer pointer-events-auto hover:bg-white">
            DROP
          </div>
        </div>
        <div className="absolute top-1 left-4 flex gap-2 pointer-events-none">
          <div className="w-4 h-4 rounded bg-red-500 text-white text-[9px] flex items-center justify-center cursor-pointer pointer-events-auto">
            1
          </div>
          <div className="w-4 h-4 rounded bg-green-500 text-white text-[9px] flex items-center justify-center cursor-pointer pointer-events-auto">
            2
          </div>
          <div className="w-4 h-4 rounded bg-blue-500 text-white text-[9px] flex items-center justify-center cursor-pointer pointer-events-auto">
            3
          </div>
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
          >
            V
          </button>
          <button
            onClick={() => toggleStem(deckId, 'drums')}
            className={clsx(
              'w-5 h-5 rounded text-[9px] font-bold transition-all border select-none touch-none active:scale-95',
              stems.drums
                ? 'text-[#00f2ff] border-accent/60 bg-accent/15 shadow-[0_0_6px_#00f2ff]'
                : 'bg-slate-900/80 border-slate-700 text-slate-600 hover:text-slate-400'
            )}
          >
            D
          </button>
          <button
            onClick={() => toggleStem(deckId, 'inst')}
            className={clsx(
              'w-5 h-5 rounded text-[9px] font-bold transition-all border select-none touch-none active:scale-95',
              stems.inst
                ? 'text-[#f59e0b] border-[#f59e0b]/60 bg-[#f59e0b]/15 shadow-[0_0_6px_#f59e0b]'
                : 'bg-slate-900/80 border-slate-700 text-slate-600 hover:text-slate-400'
            )}
          >
            I
          </button>
        </div>
      </div>

      {/* Track info row */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-accent font-bold text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-xs">
              {artist} &bull; {bpm} BPM &bull; {keySignature}
            </p>
            <button
              onClick={handleTap}
              className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-slate-400 hover:text-accent hover:border-accent transition-colors active:bg-accent/20"
            >
              TAP
            </button>
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
              className="jog-wheel w-48 h-48 rounded-full border-4 border-[#0a0a0a] shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.15)] flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform touch-none"
            >
              <JogWheel3D 
                rotation={rotation} 
                coverArt={track?.coverArt} 
                isLoading={isLoading} 
                slipActive={deckState.slipMode}
                ghostRotation={ghostTime} 
              />
            </div>
          </div>
        )}
        {/* Center Transport Controls */}
        <div className="flex flex-col gap-3">
          <button 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handleCueDown(); }}
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handleCueUp(); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); handleCueUp(); }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border-2 border-accent text-accent flex flex-col items-center justify-center font-bold shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:bg-slate-700 transition-all select-none touch-none active:scale-95"
          >
            <span className="text-xs">CUE</span>
          </button>
          <button
            onClick={togglePlay}
            disabled={!track}
            className={clsx(
              'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none touch-none active:scale-95',
              isPlaying
                ? 'bg-accent text-primary shadow-[0_0_20px_rgba(0,242,255,0.5)]'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-accent hover:text-accent'
            )}
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
          >
            SLIP
          </button>
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
            >
              <JogWheel3D 
                rotation={rotation} 
                coverArt={track?.coverArt} 
                isLoading={isLoading} 
                slipActive={deckState.slipMode}
                ghostRotation={ghostTime} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Phase 8: Asymmetric Bento HUDs */}
      {deckId === 'A' ? (
        /* Deck A — Vocal Presence HUD */
        <div
          className="relative z-10 rounded-lg border border-[#bf00ff]/20 bg-[#bf00ff]/5 backdrop-blur-md p-3 flex flex-col gap-2"
          style={{ boxShadow: '0 0 16px rgba(191,0,255,0.08)' }}
        >
          <span className="text-[9px] uppercase tracking-widest text-[#bf00ff]/60 font-bold">
            Vocal Presence HUD
          </span>
          {/* Phase 8: Stem toggles — vocals highlighted in #bf00ff */}
          <div className="flex gap-1">
            <button
              onClick={() => toggleStem('A', 'vocals')}
              className={clsx(
                stemBtnBase,
                stems.vocals
                  ? 'text-[#bf00ff] border-[#bf00ff]/70 bg-[#bf00ff]/20 shadow-[0_0_10px_#bf00ff]'
                  : stemBtnInactive
              )}
            >
              VOC
            </button>
            <button
              onClick={() => toggleStem('A', 'drums')}
              className={clsx(
                stemBtnBase,
                stems.drums
                  ? 'text-[#00f2ff] border-[#00f2ff]/70 bg-[#00f2ff]/15 shadow-[0_0_8px_#00f2ff]'
                  : stemBtnInactive
              )}
            >
              DRUM
            </button>
            <button
              onClick={() => toggleStem('A', 'inst')}
              className={clsx(
                stemBtnBase,
                stems.inst
                  ? 'text-[#f59e0b] border-[#f59e0b]/70 bg-[#f59e0b]/15 shadow-[0_0_8px_#f59e0b]'
                  : stemBtnInactive
              )}
            >
              INST
            </button>
          </div>
          {/* Sibilance Tamer (de-esser) */}
          <button
            onClick={() => toggleSibilance('A')}
            className={clsx(
              'py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all select-none touch-none active:scale-95 w-full',
              sibilanceTamerActive
                ? 'text-[#bf00ff] border-[#bf00ff]/60 bg-[#bf00ff]/15 shadow-[0_0_10px_#bf00ff]'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-300'
            )}
          >
            {sibilanceTamerActive ? '◉ Sibilance Tamer ON' : '○ Sibilance Tamer'}
          </button>
        </div>
      ) : (
        /* Deck B — Transient Shaping HUD */
        <div
          className="relative z-10 rounded-lg border border-[#00f2ff]/20 bg-[#00f2ff]/5 backdrop-blur-md p-3 flex flex-col gap-2"
          style={{ boxShadow: '0 0 16px rgba(0,242,255,0.06)' }}
        >
          <span className="text-[9px] uppercase tracking-widest text-[#00f2ff]/60 font-bold">
            Transient Shaping HUD
          </span>
          {/* Stem toggles */}
          <div className="flex gap-1">
            <button
              onClick={() => toggleStem('B', 'vocals')}
              className={clsx(
                stemBtnBase,
                stems.vocals
                  ? 'text-[#bf00ff] border-[#bf00ff]/70 bg-[#bf00ff]/20 shadow-[0_0_10px_#bf00ff]'
                  : stemBtnInactive
              )}
            >
              VOC
            </button>
            <button
              onClick={() => toggleStem('B', 'drums')}
              className={clsx(
                stemBtnBase,
                stems.drums
                  ? 'text-[#00f2ff] border-[#00f2ff]/70 bg-[#00f2ff]/15 shadow-[0_0_8px_#00f2ff]'
                  : stemBtnInactive
              )}
            >
              DRUM
            </button>
            <button
              onClick={() => toggleStem('B', 'inst')}
              className={clsx(
                stemBtnBase,
                stems.inst
                  ? 'text-[#f59e0b] border-[#f59e0b]/70 bg-[#f59e0b]/15 shadow-[0_0_8px_#f59e0b]'
                  : stemBtnInactive
              )}
            >
              INST
            </button>
          </div>
          {/* Sub-Generator toggle + Rhythm Engine visual cues */}
          <div className="flex gap-1 items-center">
            <button
              onClick={() => toggleSub('B')}
              className={clsx(
                'flex-1 py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all select-none touch-none active:scale-95',
                subGeneratorActive
                  ? 'text-[#00f2ff] border-[#00f2ff]/60 bg-[#00f2ff]/15 shadow-[0_0_10px_#00f2ff]'
                  : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-300'
              )}
            >
              {subGeneratorActive ? '◉ Sub Gen ON' : '○ Sub Generator'}
            </button>
            {/* Rhythm Engine visual cue — animated bars when playing */}
            <div className="flex gap-0.5 items-end px-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={clsx(
                    'w-1 rounded-full transition-all duration-75',
                    isPlaying ? 'bg-[#00f2ff] animate-pulse' : 'bg-slate-700'
                  )}
                  style={{
                    height: `${8 + i * 3}px`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8-Pad Performance Grid */}
      <PerformancePads deckId={deckId} />
    </div>
  );
}
