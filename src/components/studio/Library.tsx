'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Plus, Layers, ListChecks, ListPlus, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Sampler } from './Sampler';
import { useLibraryStore } from '@/store/libraryStore';
import { useDeckStore } from '@/store/deckStore';
import { camelotCompatibility, getMatchLabel } from '@/lib/camelot';
import { Track } from '@/lib/db';

// ── Energy Meter Component ──────────────────────────────────────────────
function EnergyMeter({ level }: { level: string }) {
  const bars = level === 'High' ? 5 : level === 'Medium' ? 3 : 1;
  return (
    <div className="flex items-end gap-0.5 h-4">
      {Array.from({ length: 5 }).map((_, i) => {
        const active = i < bars;
        const color = i >= 4 ? 'bg-red-500' : i >= 3 ? 'bg-yellow-400' : 'bg-green-400';
        return (
          <div
            key={i}
            className={clsx(
              'w-1 rounded-sm transition-all duration-200',
              active ? color : 'bg-slate-700/40'
            )}
            style={{ height: `${40 + i * 15}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Harmonic Match Badge ────────────────────────────────────────────────
function MatchBadge({ score, label }: { score: number; label: string }) {
  if (score < 0.5) return <span className="text-slate-600 text-[9px] font-mono">--</span>;

  const colorClass =
    score >= 0.9 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
    score >= 0.85 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
    score >= 0.7 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    'bg-slate-700/20 text-slate-500 border-slate-700/30';

  return (
    <span className={clsx('px-1.5 py-0.5 text-[8px] font-bold rounded border', colorClass)}>
      {label}
    </span>
  );
}

// ── Track Row Component (extracted for Library line-length compliance) ───
function TrackRow(
  { track, index, match, isOnDeckA, onDragStart, onLoadA, onLoadB }:
  {
    track: Track;
    index: number;
    match?: { score: number; label: string };
    isOnDeckA: boolean;
    onDragStart: (e: React.DragEvent, id: number) => void;
    onLoadA: () => void;
    onLoadB: () => void;
  }
) {
  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, track.id!)}
      className={clsx(
        'group cursor-grab active:cursor-grabbing transition-colors',
        isOnDeckA ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500/50' : 'hover:bg-slate-800/40',
        match && match.score >= 0.85 ? 'bg-green-500/[0.03]' : ''
      )}
    >
      <td className="px-4 py-3 text-sm text-slate-500 w-10">{index + 1}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center border border-slate-700 overflow-hidden relative flex-shrink-0">
            {track.coverArt ? (
              <div className="w-full h-full bg-cover bg-center rounded" style={{ backgroundImage: `url(${track.coverArt})` }} />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#000_120%)] z-10" />
                <div className="w-full h-full bg-slate-800 flex items-center justify-center" style={{ backgroundImage: 'repeating-radial-gradient(#1e293b 0, #1e293b 2px, #0f172a 3px, #0f172a 4px)' }}>
                  <div className="w-3 h-3 bg-accent rounded-full z-20" />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-slate-200 truncate">{track.title}</span>
            {track.hasVocal && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold rounded border border-blue-500/30 flex-shrink-0">VOCAL</span>
            )}
            {track.acoustidVerified && <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">{track.artist}</td>
      <td className="px-4 py-3 text-sm text-accent font-mono">{track.bpm}</td>
      <td className="px-4 py-3 text-sm text-slate-400">{track.key}</td>
      <td className="px-4 py-3 text-sm">
        {match ? <MatchBadge score={match.score} label={match.label} /> : <span className="text-slate-600 text-[9px] font-mono">--</span>}
      </td>
      <td className="px-4 py-3"><EnergyMeter level={track.energy || 'Low'} /></td>
      <td className="px-4 py-3 text-sm text-slate-500">{track.duration}</td>
      <td className="px-4 py-3 text-right relative group/menu">
        <button className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-accent hover:border-accent transition-all duration-200">
          <Plus className="w-4 h-4" />
        </button>
        <div className="absolute right-6 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50 overflow-hidden">
          <div className="flex flex-col">
            <button onClick={onLoadA} className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-accent/10 hover:text-accent transition-colors text-left">
              <Layers className="w-4 h-4" />Add to Deck A
            </button>
            <button onClick={onLoadB} className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-accent/10 hover:text-accent transition-colors text-left border-t border-slate-800/50">
              <Layers className="w-4 h-4 text-pink-500" />Add to Deck B
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-accent/10 hover:text-accent transition-colors text-left border-t border-slate-800/50">
              <ListChecks className="w-4 h-4" />Add to Cue
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-accent/10 hover:text-accent transition-colors text-left border-t border-slate-800/50">
              <ListPlus className="w-4 h-4" />Add to Playlist
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Library Header Bar ──────────────────────────────────────────────────
function LibraryHeader(
  { activeTab, setActiveTab, fileInputRef, onFileInput }:
  {
    activeTab: string;
    setActiveTab: (tab: 'tracks' | 'playlists' | 'history' | 'samples') => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
) {
  return (
    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
      <div className="flex gap-4 items-center">
        {(['tracks', 'playlists', 'history', 'samples'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx('px-4 py-1 rounded text-sm font-bold transition-colors', activeTab === tab ? 'bg-slate-800 text-accent' : 'text-slate-400 hover:text-white')}
          >
            {tab.toUpperCase()}
          </button>
        ))}
        <div className="w-px h-6 bg-slate-800 mx-2" />
        <input type="file" multiple accept=".mp3,.wav,.flac,.m4a,audio/*" className="hidden" ref={fileInputRef} onChange={onFileInput} />
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-bold text-slate-300 transition-colors">
          <UploadCloud className="w-3.5 h-3.5 text-accent" /> UPLOAD
        </button>
      </div>
      {activeTab !== 'samples' && (
        <div className="flex items-center">
          <select className="bg-slate-900 border-slate-800 rounded-lg py-1.5 text-xs focus:ring-accent focus:border-accent text-slate-400 mr-2 cursor-pointer">
            <option>Local</option><option>SoundCloud</option><option>Tidal</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="bg-slate-900 border-slate-800 rounded-lg pl-10 py-1.5 text-sm w-64 focus:ring-accent focus:border-accent text-slate-200" placeholder="Search track, artist, BPM..." type="text" />
          </div>
        </div>
      )}
    </div>
  );
}

const TABLE_COLUMNS = ['#', 'Title', 'Artist', 'BPM', 'Key', 'Match', 'Energy', 'Duration', 'Actions'] as const;

// ── Main Library Component ──────────────────────────────────────────────
export function Library() {
  const [activeTab, setActiveTab] = useState<'tracks' | 'playlists' | 'history' | 'samples'>('tracks');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { tracks, processingTracks, loadTracks, addTrack, seedLibrary } = useLibraryStore();
  const { loadTrack } = useDeckStore();
  const deckATrack = useDeckStore((s) => s.deckA.track);

  useEffect(() => {
    loadTracks().then(() => {
      seedLibrary();
    });
  }, [loadTracks, seedLibrary]);

  // ── Harmonic compatibility scores against Deck A ──
  const matchScores = useMemo(() => {
    const scores = new Map<number, { score: number; label: string }>();
    if (!deckATrack?.key) return scores;

    for (const track of tracks) {
      if (track.id === undefined || !track.key) continue;
      const score = camelotCompatibility(deckATrack.key, track.key);
      const label = getMatchLabel(score);
      scores.set(track.id, { score, label });
    }
    return scores;
  }, [deckATrack, tracks]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await addTrack(file);
    }
  }, [addTrack]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        await addTrack(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTrackDragStart = (e: React.DragEvent, trackId: number) => {
    e.dataTransfer.setData('text/plain', trackId.toString());
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div 
      className="flex-1 min-h-[300px] bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col overflow-hidden relative transition-colors duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-accent/10 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-accent rounded-xl">
          <UploadCloud className="w-16 h-16 text-accent mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Drop Audio Files Here</h2>
          <p className="text-slate-300 mt-2">MP3, WAV, FLAC supported</p>
        </div>
      )}

      <LibraryHeader activeTab={activeTab} setActiveTab={setActiveTab} fileInputRef={fileInputRef} onFileInput={handleFileInput} />
      <div className="overflow-y-auto flex-1">
        {activeTab === 'samples' ? (
          <Sampler />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 sticky top-0 border-b border-slate-800 z-20">
              <tr>
                {TABLE_COLUMNS.map((col) => (
                  <th key={col} className={clsx('px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold', col === 'Actions' && 'text-right', col === '#' && 'w-10')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {/* Processing Tracks */}
              {processingTracks.map((pt) => (
                <tr key={`processing-${pt.id}`} className="bg-slate-800/20 animate-pulse">
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3 text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    </div>
                    <span className="font-medium text-slate-400 italic">Analyzing {pt.name}...</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3"></td>
                </tr>
              ))}

              {/* Loaded Tracks */}
              {tracks.map((track, index) => {
                const match = track.id !== undefined ? matchScores.get(track.id) : undefined;
                const isOnDeckA = deckATrack?.id === track.id;
                return (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={index}
                    match={match}
                    isOnDeckA={isOnDeckA}
                    onDragStart={handleTrackDragStart}
                    onLoadA={() => loadTrack('A', track)}
                    onLoadB={() => loadTrack('B', track)}
                  />
                );
              })}

              {tracks.length === 0 && processingTracks.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="w-8 h-8 text-slate-600" />
                      <p>No tracks in library. Drag and drop audio files here to analyze.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
