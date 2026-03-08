'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DeckId } from './useWebAudio';
import type { TrackMeta, StemKey } from './tracks';
import { JogWheel } from './JogWheel';
import { WaveformCanvas } from './WaveformCanvas';

interface EqValues { high: number; mid: number; low: number; }

interface DeckPanelProps {
  deckId: DeckId;
  track: TrackMeta | null;
  buffer: AudioBuffer | null;
  isPlaying: boolean;
  stemMutes: Record<StemKey, boolean>;
  hasStemsLoaded: boolean;
  hasStemsAvailable: boolean;
  onPlay: () => void;
  onPause: () => void;
  onCue: () => void;
  onEqChange: (band: 'high' | 'mid' | 'low', val: number) => void;
  onVolumeChange: (val: number) => void;
  onStemToggle: (stem: StemKey) => void;
  onLoadStems: () => void;
  volume: number;
}

const STEM_LABELS: { key: StemKey; label: string }[] = [
  { key: 'vocals', label: 'V' },
  { key: 'drums', label: 'D' },
  { key: 'bass', label: 'B' },
  { key: 'other', label: 'M' },
];

function Knob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = (startY.current - e.clientY) * 0.5;
      onChange(Math.max(-12, Math.min(12, startVal.current + delta)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, onChange]);

  // Map -12..12 to 0..270deg rotation
  const rotation = (value + 12) / 24 * 270 - 135;

  return (
    <div className="knob-container">
      <div
        className="knob"
        onMouseDown={handleMouseDown}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <div className="knob-indicator" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
      </div>
      <span className="knob-label">{label}</span>
    </div>
  );
}

function VerticalFader({ value, onChange, height = 80 }: { value: number; onChange: (v: number) => void; height?: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getVal = useCallback((clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    return 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  }, [value]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) onChange(getVal(e.clientY)); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [getVal, onChange]);

  const thumbTop = (1 - value) * (height - 10);

  return (
    <div ref={trackRef} className="fader-track" style={{ width: 12, height, position: 'relative' }}
      onMouseDown={(e) => { dragging.current = true; onChange(getVal(e.clientY)); }}>
      <div className="fader-thumb" style={{ top: thumbTop }} />
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function DeckPanel({
  deckId, track, buffer, isPlaying, stemMutes, hasStemsLoaded, hasStemsAvailable,
  onPlay, onPause, onCue, onEqChange, onVolumeChange, onStemToggle, onLoadStems, volume,
}: DeckPanelProps) {
  const [eq, setEq] = useState<EqValues>({ high: 0, mid: 0, low: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const startedAt = useRef(0);
  const pausedAt = useRef(0);
  const rafRef = useRef<number | null>(null);
  const isA = deckId === 'A';
  const accentColor = isA ? '#00f5d4' : '#a855f7';

  // Track playback time
  useEffect(() => {
    if (isPlaying) {
      startedAt.current = performance.now() / 1000 - pausedAt.current;
      const tick = () => {
        const t = performance.now() / 1000 - startedAt.current;
        setCurrentTime(t);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pausedAt.current = currentTime;
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Reset when track changes
  useEffect(() => {
    setCurrentTime(0);
    pausedAt.current = 0;
    startedAt.current = 0;
  }, [track]);

  const handleEq = (band: 'high' | 'mid' | 'low') => (val: number) => {
    setEq(prev => ({ ...prev, [band]: val }));
    onEqChange(band, val);
  };

  const duration = buffer?.duration ?? 0;
  const remaining = Math.max(0, duration - currentTime);

  return (
    <div className="relative flex flex-col px-4 py-4 bg-[#111827] rounded-xl border border-white/5 h-full overflow-hidden">
      {/* Blurred Artwork Background */}
      {track?.artwork && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${track.artwork})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.3) saturate(1.5)',
            opacity: 0.7,
            transform: 'scale(1.1)', // Prevent edge bleed
            transition: 'background-image 0.5s ease',
          }}
        />
      )}

      {/* Main Content (z-10 to stay above background) */}
      <div className="relative z-10 flex flex-col gap-3 h-full">
        {/* Track Info */}
        <div className="flex flex-col min-h-[40px]">
          {track ? (
            <>
              <span className="text-sm font-semibold truncate drop-shadow-md" style={{ color: accentColor }}>{track.title}</span>
              <span className="text-xs opacity-60 truncate drop-shadow-sm">{track.artist} • {track.bpm} BPM • {track.key}</span>
            </>
          ) : (
            <span className="text-xs opacity-30 italic">No track loaded</span>
          )}
        </div>

        {/* Info row */}
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="drop-shadow-sm" style={{ color: accentColor }}>{formatTime(remaining)}</span>
          <span className="opacity-50 text-[10px] tracking-widest drop-shadow-sm">REMAINING</span>
        </div>

        {/* Waveform */}
        <WaveformCanvas
          buffer={buffer}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          color={accentColor}
          height={50}
        />

        {/* Stem toggles */}
        <div className="flex gap-1.5 justify-center">
          {STEM_LABELS.map(({ key, label }) => (
            <button
              key={key}
              className={`stem-toggle ${hasStemsLoaded && !stemMutes[key] ? 'active' : ''}`}
              onClick={() => hasStemsLoaded ? onStemToggle(key) : hasStemsAvailable ? onLoadStems() : undefined}
              title={hasStemsLoaded ? `Toggle ${key}` : hasStemsAvailable ? 'Load stems' : 'No stems available'}
            >
              {label}
            </button>
          ))}
          {!hasStemsLoaded && hasStemsAvailable && (
            <span className="text-[9px] opacity-30 self-center ml-1">LOAD</span>
          )}
        </div>

        {/* Jog Wheel centered */}
        <div className="flex justify-center py-1 flex-1 items-center">
          <JogWheel isPlaying={isPlaying} size={150} artwork={track?.artwork} />
        </div>

        {/* EQ + Volume row */}
        <div className="flex items-end justify-between gap-2 px-2 mt-auto">
          <div className="flex gap-3 bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/5">
            <Knob label="HI" value={eq.high} onChange={handleEq('high')} />
            <Knob label="MID" value={eq.mid} onChange={handleEq('mid')} />
            <Knob label="LOW" value={eq.low} onChange={handleEq('low')} />
          </div>
          <div className="bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/5">
            <VerticalFader value={volume} onChange={onVolumeChange} height={72} />
          </div>
        </div>

        {/* Transport */}
        <div className="flex justify-center items-center gap-4 mt-1">
          <button className="btn-transport btn-cue backdrop-blur-md bg-black/30" onClick={onCue}>CUE</button>
          <button
            className={`btn-transport btn-play backdrop-blur-md ${isPlaying ? 'playing' : 'bg-black/30'}`}
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
