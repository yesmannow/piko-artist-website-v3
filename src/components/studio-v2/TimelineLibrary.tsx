'use client';

import { Button } from '@heroui/react';
import { Plus, Music } from 'lucide-react';
import { useTimelineStore } from '@/hooks/studio-v2/useTimelineStore';
import { useTimelineAudio } from '@/hooks/studio-v2/useTimelineAudio';
import { normalizeTrackId } from '@/lib/studio-v2/timeline-utils';

/**
 * TimelineLibrary - Track browser sidebar for Studio V2
 *
 * Phase 3: Real audio files from public/audio/tracks
 * Phase 7: Will integrate with full library browser + IndexedDB
 */
export function TimelineLibrary() {
  const { addTrack, tracks } = useTimelineStore();
  const { loadTrack } = useTimelineAudio();

  // Demo tracks using real audio files
  const demoTracks = [
    {
      title: '12_05',
      artist: 'Piko',
      duration: 180, // Will be overridden when audio loads
      bpm: 128,
      key: '8A',
      trackKey: normalizeTrackId('12_05'),
      audioUrl: '/audio/tracks/12_05.mp3',
      color: 'linear-gradient(to right, #f59e0b, #ef4444)',
    },
    {
      title: 'Amor Sincero',
      artist: 'Piko',
      duration: 195,
      bpm: 122,
      key: '5A',
      trackKey: normalizeTrackId('amor-sincero'),
      audioUrl: '/audio/tracks/amor-sincero.mp3',
      color: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    },
    {
      title: 'Amores Perdidos',
      artist: 'Piko',
      duration: 210,
      bpm: 126,
      key: '9A',
      trackKey: normalizeTrackId('amores-perdidos'),
      audioUrl: '/audio/tracks/amores-perdidos.mp3',
      color: 'linear-gradient(to right, #10b981, #3b82f6)',
    },
    {
      title: 'Bungalow',
      artist: 'Piko',
      duration: 165,
      bpm: 120,
      key: '6A',
      trackKey: normalizeTrackId('bungalow'),
      audioUrl: '/audio/tracks/bungalow.mp3',
      color: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
    },
  ];

  const handleAddDemoTrack = async (track: typeof demoTracks[0]) => {
    // Find first available row
    const usedRows = new Set(tracks.map(t => t.row));
    let targetRow = 0;
    for (let i = 0; i < 8; i++) {
      if (!usedRows.has(i)) {
        targetRow = i;
        break;
      }
    }

    // Calculate start time (after last track in row)
    const rowTracks = tracks.filter(t => t.row === targetRow);
    const startTime = rowTracks.length > 0
      ? Math.max(...rowTracks.map(t => t.startTime + t.duration)) + 2
      : 0;

    // Generate unique ID outside render
    const uniqueId = `${track.trackKey}-${crypto.randomUUID()}`;

    // Create track data
    const newTrack = {
      id: uniqueId,
      trackKey: track.trackKey,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      startTime,
      row: targetRow,
      volume: 1,
      fadeIn: 1, // 1 second fade-in
      fadeOut: 2, // 2 second fade-out
      bpm: track.bpm,
      key: track.key,
      color: track.color,
    };

    // Add to timeline
    addTrack(newTrack);

    // Load audio file in background
    try {
      await loadTrack(newTrack, track.audioUrl);
      console.log(`[TimelineLibrary] Loaded audio for ${track.title} ✅`);
    } catch (error) {
      console.error(`[TimelineLibrary] Failed to load audio for ${track.title}:`, error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Track Library</h2>
        <Button
          size="sm"
          variant="flat"
          className="bg-zinc-800 hover:bg-zinc-700"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Demo Tracks */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {demoTracks.map((track) => (
          <div
            key={track.trackKey}
            className="bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors group cursor-pointer"
            onClick={() => handleAddDemoTrack(track)}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: track.color }}
              >
                <Music className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{track.title}</div>
                <div className="text-xs text-zinc-400 truncate">{track.artist}</div>

                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <span>{track.bpm} BPM</span>
                  <span>{track.key}</span>
                  <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="flat"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddDemoTrack(track);
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-zinc-800 rounded-lg text-xs text-zinc-400">
        <p className="font-semibold mb-1">Phase 3 - Audio Playback</p>
        <p>Click any track to add to timeline. Audio files load automatically. Real library integration coming in Phase 7.</p>
      </div>
    </div>
  );
}
