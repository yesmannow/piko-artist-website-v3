'use client';

import { useState } from 'react';
import { CommandBar } from '@/components/studio/navigation/CommandBar';
import { PerformanceView } from './PerformanceView';
import { TRACKS, type TrackMeta } from './tracks';
import './studio.css';

export type ViewId = 'performance' | 'preparation' | 'export' | 'record';

function PreparationView() {
  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Library table - full width in preparation mode */}
      <div className="flex-1 overflow-y-auto studio-scroll p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#00f5d4' }}>Preparation</h2>
          <p className="text-xs opacity-40 mt-0.5">Browse, analyze, and organize your tracks</p>
        </div>
        <table className="w-full table-auto text-xs">
          <thead>
            <tr className="text-[9px] tracking-widest text-white/30 uppercase border-b border-white/5">
              <th className="text-left py-2 pl-2 w-8">#</th>
              <th className="text-left py-2">Title</th>
              <th className="text-left py-2">Artist</th>
              <th className="text-left py-2 w-16" style={{ color: '#00f5d4' }}>BPM</th>
              <th className="text-left py-2 w-16">Key</th>
              <th className="text-left py-2 w-16">Duration</th>
              <th className="text-left py-2 w-16">Stems</th>
            </tr>
          </thead>
          <tbody>
            {TRACKS.map((track: TrackMeta, i: number) => (
              <tr key={track.id} className="track-row border-b border-white/[0.03]">
                <td className="py-2.5 pl-2 text-white/20">{i + 1}</td>
                <td className="py-2.5 font-medium">{track.title}</td>
                <td className="py-2.5 opacity-50">{track.artist}</td>
                <td className="py-2.5 font-mono" style={{ color: '#00f5d4' }}>{track.bpm}</td>
                <td className="py-2.5 font-mono opacity-60">{track.key}</td>
                <td className="py-2.5 font-mono opacity-40">{track.duration}</td>
                <td className="py-2.5">
                  {track.stemsDir ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,245,212,0.1)', color: '#00f5d4' }}>
                      STEMS
                    </span>
                  ) : (
                    <span className="text-[9px] opacity-20">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportView() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 opacity-40">
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="text-sm">Export View — Coming Soon</span>
    </div>
  );
}

function RecordView() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 opacity-40">
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid currentColor', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'currentColor' }} />
      </div>
      <span className="text-sm">Record View — Coming Soon</span>
    </div>
  );
}

export function DjStudio() {
  const [activeView, setActiveView] = useState<ViewId>('performance');
  const [masterBpm] = useState(124);

  return (
    <div className="studio-root">
      <CommandBar
        activeView={activeView}
        onViewChange={setActiveView}
        bpm={masterBpm}
      />

      {activeView === 'performance' && <PerformanceView />}
      {activeView === 'preparation' && <PreparationView />}
      {activeView === 'export' && <ExportView />}
      {activeView === 'record' && <RecordView />}
    </div>
  );
}
