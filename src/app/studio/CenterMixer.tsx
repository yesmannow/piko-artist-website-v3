import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import './studio.css';

interface CenterMixerProps {
  crossfade: number; // 0–1
  onCrossfadeChange: (val: number) => void;
  isHarmonicMatch?: boolean;
}

const VAULT_MONO = 'JetBrains Mono, monospace';
const VAULT_NEON_BLUE = '#00f2ff';

function VuMeter({ level }: { level: number }) {
  const bars = 10;
  return (
    <div className="flex flex-col-reverse gap-0.5" style={{ height: 100 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const active = i / bars < level;
        const color = i < 6 ? '#22c55e' : i < 8 ? '#eab308' : '#f43f5e';
        return (
          <div
            key={i}
            className="vu-bar transition-all duration-75"
            style={{
              flex: 1, width: 8, borderRadius: 1,
              background: active ? color : 'rgba(255,255,255,0.05)',
              boxShadow: active ? `0 0 5px ${color}` : 'none',
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
    <div className="flex flex-col items-center gap-1.5">
      <div 
        className="vault-knob" 
        style={{ width: 42, height: 42 }} 
        onMouseDown={handleMouseDown}
      >
        <div 
          className="vault-knob-indicator" 
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} 
        />
      </div>
      <span style={{ 
        fontFamily: VAULT_MONO, 
        fontSize: '8px', 
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.1em'
      }}>
        {label}
      </span>
    </div>
  );
}

export function CenterMixer({ crossfade, onCrossfadeChange, isHarmonicMatch }: CenterMixerProps) {
  const [masterEq, setMasterEq] = useState({ high: 0, mid: 0, low: 0 });
  const [vuLevel] = useState(0.5);
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
    <div className="flex flex-col items-center gap-6 px-4 py-6 bg-[#0a0a0c] border border-white/5 h-full justify-between vault-glass">
      {/* Master Section */}
      <div className="flex flex-col items-center gap-3">
        <span style={{ 
          fontFamily: VAULT_MONO, 
          fontSize: '9px', 
          letterSpacing: '0.3em',
          color: VAULT_NEON_BLUE
        }}>
          MASTER
        </span>
        <div className="flex gap-4">
          <Knob label="HI" value={masterEq.high} onChange={v => setMasterEq(p => ({ ...p, high: v }))} />
          <Knob label="MID" value={masterEq.mid} onChange={v => setMasterEq(p => ({ ...p, mid: v }))} />
          <Knob label="LOW" value={masterEq.low} onChange={v => setMasterEq(p => ({ ...p, low: v }))} />
        </div>
      </div>

      {/* VU Meters */}
      <div className="flex gap-2 justify-center">
        <VuMeter level={vuLevel * 0.9} />
        <VuMeter level={vuLevel} />
      </div>

      {/* Crossfader Fusion™ Feature */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex justify-center items-center gap-2">
          {isHarmonicMatch && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-1.5 py-0.5 rounded-sm bg-[#00f2ff]/10 border border-[#00f2ff]/30"
            >
              <span style={{ 
                fontFamily: VAULT_MONO, 
                fontSize: '7px', 
                color: VAULT_NEON_BLUE,
                letterSpacing: '0.1em'
              }}>
                HARMONIC MATCH
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex justify-between text-[10px] font-bold tracking-[0.2em] opacity-30 px-1" style={{ fontFamily: VAULT_MONO }}>
          <span>A</span><span>B</span>
        </div>
        
        <div
          ref={trackRef}
          className="vault-crossfader-track relative overflow-visible"
          onMouseDown={e => { dragging.current = true; onCrossfadeChange(getCrossfadeVal(e.clientX)); }}
        >
          {/* Harmonic Glow Layer */}
          {isHarmonicMatch && (
            <motion.div 
              className="absolute inset-0 rounded-full blur-md opacity-40 pointer-events-none"
              animate={{ 
                background: `linear-gradient(90deg, transparent, ${VAULT_NEON_BLUE}, transparent)`,
                x: ['-20%', '20%', '-20%']
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <div
            className="vault-crossfader-thumb"
            style={{ 
              left: `${crossfade * 100}%`,
              boxShadow: isHarmonicMatch ? `0 0 15px ${VAULT_NEON_BLUE}` : 'none'
            }}
          />
        </div>
        
        <div className="flex justify-center flex-col items-center gap-1">
          <span style={{ 
            fontFamily: VAULT_MONO, 
            fontSize: '8px', 
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)'
          }}>
            CROSSFADER FUSION™
          </span>
        </div>
      </div>
    </div>
  );
}

