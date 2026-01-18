"use client";

import { useState } from 'react';
import type { AutomationTrack, Keyframe } from '@/lib/fx/FXAutomation';
import { Trash2, Plus } from 'lucide-react';

interface AutomationTrackEditorProps {
  track: AutomationTrack;
  duration: number;
  onUpdate: (track: AutomationTrack) => void;
  onDelete: () => void;
  onAddKeyframe: (time: number, value: number) => void;
  onRemoveKeyframe: (time: number) => void;
  onUpdateKeyframe: (time: number, value: number) => void;
}

/**
 * AutomationTrackEditor - Visual editor for automation tracks
 *
 * Features:
 * - Visual timeline with keyframes
 * - Click to add keyframes
 * - Drag keyframes to adjust
 * - Delete keyframes
 */
export function AutomationTrackEditor({
  track,
  duration,
  onUpdate,
  onDelete,
  onAddKeyframe,
  onRemoveKeyframe,
  onUpdateKeyframe,
}: AutomationTrackEditorProps) {
  const [draggingKeyframe, setDraggingKeyframe] = useState<number | null>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    const value = 0.5; // Default value, user can adjust
    onAddKeyframe(time, value);
  };

  const handleKeyframeDrag = (keyframeTime: number, e: React.MouseEvent) => {
    if (draggingKeyframe === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTime = Math.max(0, Math.min((x / rect.width) * duration, duration));
    const newValue = Math.max(0, Math.min(1 - (y / rect.height), 1));

    onUpdateKeyframe(keyframeTime, newValue);
  };

  const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time);

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white">{track.name}</h4>
          <p className="text-xs text-white/60">
            {track.type} • {track.deck || 'Both'} • {track.keyframes.length} keyframes
          </p>
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Visual Timeline */}
      <div className="relative h-32 w-full rounded-lg border border-white/10 bg-white/5">
        <div
          className="relative h-full w-full cursor-crosshair"
          onClick={handleTimelineClick}
          onMouseMove={(e) => {
            if (draggingKeyframe !== null) {
              handleKeyframeDrag(draggingKeyframe, e);
            }
          }}
          onMouseUp={() => setDraggingKeyframe(null)}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-full border-l border-white/5"
                style={{ width: '10%' }}
              />
            ))}
          </div>

          {/* Value lines */}
          <div className="absolute inset-0 flex flex-col">
            {[0, 0.25, 0.5, 0.75, 1].map((val) => (
              <div
                key={val}
                className="w-full border-t border-white/5"
                style={{ height: '20%' }}
              />
            ))}
          </div>

          {/* Automation curve */}
          {sortedKeyframes.length > 0 && (
            <svg className="absolute inset-0 h-full w-full">
              <polyline
                points={sortedKeyframes
                  .map(
                    (kf) =>
                      `${(kf.time / duration) * 100}%,${(1 - kf.value) * 100}%`
                  )
                  .join(' ')}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c1ff00" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Keyframes */}
          {sortedKeyframes.map((kf, idx) => (
            <div
              key={idx}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-[#c1ff00] shadow-lg active:cursor-grabbing"
              style={{
                left: `${(kf.time / duration) * 100}%`,
                top: `${(1 - kf.value) * 100}%`,
              }}
              onMouseDown={() => setDraggingKeyframe(kf.time)}
              onDoubleClick={() => onRemoveKeyframe(kf.time)}
              title={`Time: ${kf.time.toFixed(2)}s, Value: ${kf.value.toFixed(2)}`}
            />
          ))}
        </div>

        {/* Time labels */}
        <div className="mt-1 flex justify-between text-xs text-white/40">
          <span>0s</span>
          <span>{duration}s</span>
        </div>
      </div>

      {/* Keyframe list */}
      {sortedKeyframes.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-white/60">
            Keyframes
          </label>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {sortedKeyframes.map((kf, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
              >
                <span className="text-white/80">
                  {kf.time.toFixed(2)}s: {kf.value.toFixed(2)}
                </span>
                <button
                  onClick={() => onRemoveKeyframe(kf.time)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
