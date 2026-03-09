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

export function Deck({ deckId }: DeckProps) {
  const isRight = deckId === 'B';
  const { loadTrack, toggleSlipMode } = useDeckStore();
  const { tracks } = useLibraryStore();
  const { 
    currentTime, ghostTime, deckState, duration, isPlaying, isLoading, track, 
    togglePlay, scrubTrack, endScrub, handleCueDown, handleCueUp 
  } = useDeckAudio(deckId);
  
  const [currentBpm, setCurrentBpm] = useState(track ? Number(track.bpm) : 120);
  const [, setTapTimes] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const [rotation, setRotation] = useState(0);
  const jogWheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  // Auto-rotation when playing
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      if (isPlaying && !isDraggingRef.current) {
        const dt = time - lastTime;
        // 33 1/3 RPM = 33.333 / 60 * 360 = 200 degrees per second
        setRotation(prev => (prev + (200 * dt) / 1000) % 360);
      }
      lastTime = time;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

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

    setRotation(prev => (prev + deltaAngle) % 360);
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

  return (
    <div 
      className={clsx(
        "col-span-12 lg:col-span-5 bg-[#0a0a0a] shadow-[inset_0_4px_24px_rgba(0,0,0,0.8)] rounded-xl border p-6 flex flex-col gap-4 transition-colors duration-300 relative overflow-hidden",
        isDragOver ? "border-accent shadow-[0_0_30px_rgba(0,242,255,0.2)] bg-accent/10" : "border-slate-800/80"
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
        <div className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-2xl pointer-events-none z-0"></div>
      )}
      <div className="waveform-container relative z-10 h-20 bg-black/40 rounded-lg overflow-hidden border border-slate-800/50">
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
        <div className="absolute top-1 right-2 flex gap-1">
          <button className="w-5 h-5 bg-slate-900/80 border border-slate-700 rounded text-[9px] font-bold text-accent hover:bg-accent hover:text-primary transition-colors">
            V
          </button>
          <button className="w-5 h-5 bg-slate-900/80 border border-slate-700 rounded text-[9px] font-bold text-accent hover:bg-accent hover:text-primary transition-colors">
            D
          </button>
          <button className="w-5 h-5 bg-slate-900/80 border border-slate-700 rounded text-[9px] font-bold text-accent hover:bg-accent hover:text-primary transition-colors">
            B
          </button>
          <button className="w-5 h-5 bg-slate-900/80 border border-slate-700 rounded text-[9px] font-bold text-accent hover:bg-accent hover:text-primary transition-colors">
            M
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-accent font-bold text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-xs">
              {artist} • {bpm} BPM • {keySignature}
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
      
      {/* 8-Pad Performance Grid */}
      <PerformancePads deckId={deckId} />
    </div>
  );
}
