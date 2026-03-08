'use client';

import { useState, useMemo } from 'react';
import { TRACKS, type TrackMeta } from './tracks';
import type { DeckId } from './useWebAudio';

interface TrackLibraryProps {
  loadedA: TrackMeta | null;
  loadedB: TrackMeta | null;
  onLoadTrack: (deckId: DeckId, track: TrackMeta) => void;
  onAddToQueue?: (track: TrackMeta) => void;
}

type SortKey = 'title' | 'duration' | 'bpm' | 'key';

export function TrackLibrary({ loadedA, loadedB, onLoadTrack, onAddToQueue }: TrackLibraryProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'playlists'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sortedTracks = useMemo(() => {
    const filtered = TRACKS.filter(t =>
      [t.title, t.artist, String(t.bpm), t.key]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let valA: any = a[sortKey === 'title' ? 'title' : sortKey];
      let valB: any = b[sortKey === 'title' ? 'title' : sortKey];

      if (sortKey === 'bpm') {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [search, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className={`library-panel flex flex-col bg-[#0c0e16] border-t border-white/5 flex-shrink-0 ${isCollapsed ? 'collapsed' : 'flex-1'}`}>
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 h-12 flex-shrink-0">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-white/5 rounded transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        
        <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">Library</span>

        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2 flex-1 bg-white/5 rounded-lg px-3 py-1.5 max-w-xs ml-2 min-w-[120px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-xs outline-none placeholder:text-white/25 w-full"
              />
            </div>

            <div className="flex gap-2 items-center text-[10px] font-bold text-white/40 uppercase ml-4">
              <span>Sort:</span>
              {(['title', 'duration', 'bpm', 'key'] as SortKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`sort-button text-[11px] px-3 py-1 ${sortKey === key ? 'active' : ''}`}
                >
                  {key} {sortKey === key && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <span className="text-[9px] tracking-widest text-[#00f5d4] invisible lg:visible">● ONLINE</span>
            </div>
          </>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto studio-scroll">
          <div className="library-grid">
            {sortedTracks.map((track) => {
              const isActiveA = loadedA?.id === track.id;
              const isActiveB = loadedB?.id === track.id;
              
              return (
                <div 
                  key={track.id} 
                  className={`track-card ${isActiveA ? 'active-a' : ''} ${isActiveB ? 'active-b' : ''}`}
                  onClick={() => onLoadTrack('A', track)}
                >
                  <div 
                    className="track-card-artwork"
                    style={{ backgroundImage: `url(${track.artwork || '/images/default-track.jpg'})` }}
                  />
                  
                  <div className="track-card-content">
                    <span className="text-sm font-bold truncate leading-tight">{track.title}</span>
                    <span className="text-xs opacity-50 truncate">{track.artist}</span>
                    <div className="track-card-stats text-xs font-semibold">
                      <span style={{ color: '#00f5d4' }} className="mr-1">{track.bpm} BPM</span>
                      <span className="opacity-40">/</span>
                      <span className="mx-1">{track.key}</span>
                      <span className="opacity-40">/</span>
                      <span className="ml-1">{track.duration}</span>
                    </div>
                  </div>

                  <div className="track-card-actions">
                    <button 
                      className="btn-card-action hover:text-[#00f5d4]" 
                      onClick={(e) => { e.stopPropagation(); onLoadTrack('A', track); }}
                    >
                      Load A
                    </button>
                    <button 
                      className="btn-card-action hover:text-[#a855f7]" 
                      onClick={(e) => { e.stopPropagation(); onLoadTrack('B', track); }}
                    >
                      Load B
                    </button>
                    <button 
                      className="btn-card-action" 
                      onClick={(e) => { e.stopPropagation(); onAddToQueue?.(track); }}
                    >
                      + Queue
                    </button>
                  </div>

                  {(isActiveA || isActiveB) && (
                    <div className="track-card-status">
                      <span style={{ color: isActiveA ? '#00f5d4' : '#a855f7' }}>
                        {isActiveA ? 'A' : 'B'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {sortedTracks.length === 0 && (
            <div className="py-20 text-center text-white/20 text-xs italic">No tracks found</div>
          )}
        </div>
      )}
    </div>
  );
}
