'use client';

import { useEffect, useRef } from 'react';
import './studio.css';

interface JogWheelProps {
  isPlaying: boolean;
  size?: number;
  artwork?: string;
}

export function JogWheel({ isPlaying, size = 160, artwork }: JogWheelProps) {
  const needleRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        rotationRef.current = (rotationRef.current + 1.2) % 360;
        if (needleRef.current) {
          needleRef.current.style.transform = `translateX(-50%) rotate(${rotationRef.current}deg)`;
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying]);

  return (
    <div
      className="jog-wheel"
      style={{ width: size, height: size, position: 'relative' }}
    >
      {/* Outer spin ring */}
      <div className={`jog-spin-ring ${isPlaying ? 'playing' : ''}`} />
      
      {/* Vinyl Grooves (Concentric rings) */}
      {[20, 24, 28, 32, 36, 40].map((inset, i) => (
        <div key={i} style={{
          position: 'absolute', inset, borderRadius: '50%',
          border: `1px solid rgba(255,255,255,${0.03 + (i % 2 === 0 ? 0.02 : 0)})`,
        }} />
      ))}
      
      {/* Inner dark plate / label boundary */}
      <div className="jog-wheel-inner" style={{ inset: 48, background: '#0a0c12' }} />
      
      {/* Record Label (Artwork) */}
      {artwork ? (
        <div style={{
          position: 'absolute', inset: 50, borderRadius: '50%',
          overflow: 'hidden', border: '1px solid rgba(0,245,212,0.3)',
          backgroundImage: `url(${artwork})`, backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.9,
        }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 50, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #262a3d, #0a0c12)',
          border: '1px solid rgba(0,245,212,0.1)',
        }} />
      )}
      
      {/* Center Spindle dot */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 6, height: 6, borderRadius: '50%',
        background: '#e0e0e0', // Silver spindle
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.8), inset 0 1px 1px white',
        zIndex: 10,
      }} />
      
      {/* Rotating needle / play position indicator */}
      <div
        ref={needleRef}
        className="jog-wheel-needle"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 2,
          height: '42%',
          background: 'linear-gradient(to bottom, rgba(0,245,212,0.9), transparent)',
          borderRadius: 2,
          transformOrigin: 'top center',
          marginLeft: -1,
          marginTop: 0,
          zIndex: 5,
        }}
      />
    </div>
  );
}
