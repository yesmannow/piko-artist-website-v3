'use client';

import type { ViewId } from './DjStudio';
import Link from 'next/link';

interface StudioTopBarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  bpm: number;
}

const TABS: { id: ViewId; label: string }[] = [
  { id: 'performance', label: 'PERFORMANCE' },
  { id: 'preparation', label: 'PREPARATION' },
  { id: 'export', label: 'EXPORT' },
  { id: 'record', label: 'RECORD' },
];

export function StudioTopBar({ activeView, onViewChange, bpm }: StudioTopBarProps) {
  return (
    <div
      className="flex items-center gap-6 px-5 py-0 border-b border-white/5 flex-shrink-0"
      style={{ height: 48, background: '#0a0c12' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-4 flex-shrink-0">
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #00f5d4, #0891b2)',
          boxShadow: '0 0 8px rgba(0,245,212,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a0c12' }} />
        </div>
        <span className="font-bold text-sm tracking-wider">
          <span style={{ color: '#00f5d4' }}>PRO DJ</span>
          <span className="text-white"> STUDIO</span>
        </span>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeView === tab.id ? 'active' : ''}`}
            onClick={() => onViewChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* BPM display */}
      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f5d4' }} />
        <span className="text-sm font-mono font-bold" style={{ color: '#00f5d4' }}>
          {bpm.toFixed(2)}
        </span>
        <span className="text-[9px] tracking-widest text-white/30">BPM</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-medium text-white hover:text-[#00f5d4] transition-colors bg-white/5 px-3 py-1.5 rounded-md hover:bg-white/10">
          Back to Site
        </Link>
        <button className="opacity-40 hover:opacity-70 transition-opacity">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
        {/* Avatar placeholder */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #00f5d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#0a0c12',
        }}>
          P
        </div>
      </div>
    </div>
  );
}
