'use client';

import { useTimelineStore, TimelineTrack } from '@/hooks/studio-v2/useTimelineStore';
import { timeToPixels, formatTime } from '@/lib/studio-v2/timeline-utils';
import { Music, Volume2, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { useState } from 'react';

interface TrackRowProps {
  rowIndex: number;
  width: number; // Total timeline width
}

/**
 * TrackRow - Single horizontal track lane for timeline
 *
 * Features:
 * - Display tracks placed in this row
 * - Drag-drop zone for adding tracks
 * - Click to select tracks
 * - Visual waveform preview (placeholder for now)
 */
export function TrackRow({ rowIndex, width }: TrackRowProps) {
  const { tracks, zoom, selectedTrackIds, selectTrack, deselectTrack, removeTrack, updateTrack } = useTimelineStore();
  const [dragOver, setDragOver] = useState(false);

  // Filter tracks for this row
  const rowTracks = tracks.filter((t) => t.row === rowIndex);

  // Handle drop from library
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      // Calculate drop position in time
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dropTime = x / zoom;

      // Add track at drop position
      const { addTrack } = useTimelineStore.getState();
      addTrack({
        trackKey: data.trackKey,
        title: data.title,
        artist: data.artist,
        duration: data.duration || 180, // Default 3 minutes if unknown
        startTime: Math.max(0, dropTime),
        row: rowIndex,
        volume: 1,
        fadeIn: 0,
        fadeOut: 0,
        bpm: data.bpm,
        key: data.key,
        color: data.color,
      });
    } catch (err) {
      console.error('Failed to parse drop data:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div
      className={`relative h-24 border border-zinc-800 rounded-lg transition-colors ${
        dragOver ? 'bg-zinc-800 border-purple-500' : 'bg-zinc-900'
      }`}
      style={{ width: `${width}px` }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Row label */}
      <div className="absolute left-2 top-2 text-xs text-zinc-600 font-mono">
        Track {rowIndex + 1}
      </div>

      {/* Tracks in this row */}
      {rowTracks.map((track) => (
        <TrackBlock
          key={track.id}
          track={track}
          zoom={zoom}
          isSelected={selectedTrackIds.includes(track.id)}
          onSelect={() => selectTrack(track.id)}
          onDeselect={() => deselectTrack(track.id)}
          onRemove={() => removeTrack(track.id)}
          onUpdate={(updates) => updateTrack(track.id, updates)}
        />
      ))}

      {/* Empty state hint */}
      {rowTracks.length === 0 && !dragOver && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-700">
          Drop track here
        </div>
      )}

      {/* Drag over hint */}
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-purple-400">
          <Music className="w-5 h-5 mr-2" />
          Release to add track
        </div>
      )}
    </div>
  );
}

/**
 * TrackBlock - Individual track visualization on timeline
 */
interface TrackBlockProps {
  track: TimelineTrack;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<TimelineTrack>) => void;
}

function TrackBlock({ track, zoom, isSelected, onSelect, onDeselect, onRemove }: TrackBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const x = timeToPixels(track.startTime, zoom);
  const width = timeToPixels(track.duration, zoom);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      if (isSelected) {
        onDeselect();
      } else {
        onSelect();
      }
    } else {
      // Single select
      const { clearSelection } = useTimelineStore.getState();
      clearSelection();
      onSelect();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ trackId: track.id }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`absolute top-2 bottom-2 rounded overflow-hidden cursor-move transition-all ${
        isSelected
          ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/50'
          : 'hover:ring-1 hover:ring-zinc-600'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{
        left: `${x}px`,
        width: `${Math.max(width, 40)}px`, // Minimum 40px width
        background: track.color || 'linear-gradient(to right, #3b82f6, #8b5cf6)',
      }}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Track info */}
      <div className="px-2 py-1 text-white text-xs truncate flex items-center gap-2">
        <Music className="w-3 h-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{track.title}</div>
          <div className="text-white/60 truncate text-[10px]">{track.artist}</div>
        </div>
      </div>

      {/* Metadata */}
      <div className="absolute bottom-1 left-2 text-[10px] text-white/60 font-mono flex items-center gap-2">
        {track.bpm && <span>{track.bpm} BPM</span>}
        {track.key && <span>{track.key}</span>}
        <span>{formatTime(track.duration)}</span>
      </div>

      {/* Action buttons (visible on hover/selection) */}
      {isSelected && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="h-6 w-6 min-w-0 bg-black/50 hover:bg-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Resize handles (left/right edges) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-white/40"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          // TODO: Implement resize logic in next iteration
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-white/40"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          // TODO: Implement resize logic in next iteration
        }}
      />

      {/* Fade indicators */}
      {track.fadeIn > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-black/40 pointer-events-none"
          style={{ width: `${timeToPixels(track.fadeIn, zoom)}px` }}
        />
      )}
      {track.fadeOut > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 bg-black/40 pointer-events-none"
          style={{ width: `${timeToPixels(track.fadeOut, zoom)}px` }}
        />
      )}
    </div>
  );
}
