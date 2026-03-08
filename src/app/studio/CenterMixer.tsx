'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import './studio.css';

interface CenterMixerProps {
  crossfade: number; // 0–1
  onCrossfadeChange: (val: number) => void;
}

function VuMeter({ level }: { level: number }) {
  const bars = 8;
  return (
    <div className="flex flex-col-reverse gap-0.5" style={{ height: 60 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const active = i / bars < level;
        const color = i < 5 ? '#22c55e' : i < 7 ? '#eab308' : '#ef4444';
        return (
          <div
            key={i}
            className="vu-bar"
            style={{
              flex: 1, width: 6, borderRadius: 2,
              background: active ? color : 'rgba(255,255,255,0.08)',
            }}
          />
        );
      })}
    </div>
  );
}

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
      onChange(Math.max(-12, Math.min(12, startVal.current + (startY.current - e.clientY) * 0.4)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, onChange]);

  const rotation = (value + 12) / 24 * 270 - 135;

  return (
    <div className="knob-container">
      <div className="knob" style={{ width: 36, height: 36 }} onMouseDown={handleMouseDown}>
        <div className="knob-indicator" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
      </div>
      <span className="knob-label">{label}</span>
    </div>
  );
}

export function CenterMixer({ crossfade, onCrossfadeChange }: CenterMixerProps) {
  const [masterEq, setMasterEq] = useState({ high: 0, mid: 0, low: 0 });
  const [vuLevel] = useState(0.6);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getCrossfadeVal = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return crossfade;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, [crossfade]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) onCrossfadeChange(getCrossfadeVal(e.clientX)); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [getCrossfadeVal, onCrossfadeChange]);

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4 bg-[#0f1219] rounded-xl border border-white/5 h-full justify-between">
      {/* EQ */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] tracking-widest text-white/30 uppercase">Master EQ</span>
        <div className="flex gap-3">
          <Knob label="HI" value={masterEq.high} onChange={v => setMasterEq(p => ({ ...p, high: v }))} />
          <Knob label="MID" value={masterEq.mid} onChange={v => setMasterEq(p => ({ ...p, mid: v }))} />
          <Knob label="LOW" value={masterEq.low} onChange={v => setMasterEq(p => ({ ...p, low: v }))} />
        </div>
      </div>

      {/* VU Meters */}
      <div className="flex gap-1.5 justify-center">
        <VuMeter level={vuLevel * 0.85} />
        <VuMeter level={vuLevel} />
      </div>

      {/* Level indicator */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: 1,
              background: i < 3 ? '#22c55e' : i < 4 ? '#eab308' : '#ef4444',
              opacity: 0.8,
            }} />
          ))}
        </div>
        <span className="text-[8px] text-white/20 tracking-widest uppercase">Level</span>
      </div>

      {/* Crossfader */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex justify-between text-[9px] font-bold tracking-widest opacity-40">
          <span>A</span><span>B</span>
        </div>
        <div
          ref={trackRef}
          className="crossfader-track"
          onMouseDown={e => { dragging.current = true; onCrossfadeChange(getCrossfadeVal(e.clientX)); }}
        >
          <div
            className="crossfader-thumb"
            style={{ left: `${crossfade * 100}%` }}
          />
        </div>
        <div className="flex justify-center">
          <span className="text-[8px] tracking-[0.2em] text-white/25 uppercase">Crossfader</span>
        </div>
      </div>
    </div>
  );
}
