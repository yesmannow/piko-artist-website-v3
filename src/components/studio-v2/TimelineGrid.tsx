'use client';

import { useTimelineStore } from '@/hooks/studio-v2/useTimelineStore';
import { formatTime } from '@/lib/studio-v2/timeline-utils';

interface TimelineGridProps {
  width: number; // Total width in pixels
  height: number; // Height of grid area
}

/**
 * TimelineGrid - Horizontal time ruler with markers and playhead
 *
 * Features:
 * - Zoom-responsive time markers (seconds, 10s, 30s, 1min intervals)
 * - Click to seek playhead position
 * - Visual playhead cursor
 * - Minute:second time display
 */
export function TimelineGrid({ width, height }: TimelineGridProps) {
  const { zoom, playhead, setPlayhead } = useTimelineStore();

  // Calculate total duration visible on screen
  const visibleDuration = width / zoom; // seconds

  // Determine marker interval based on zoom level
  const getMarkerInterval = (): number => {
    if (zoom > 100) return 1; // 1 second intervals (zoomed in)
    if (zoom > 50) return 5; // 5 second intervals
    if (zoom > 20) return 10; // 10 second intervals
    if (zoom > 10) return 30; // 30 second intervals
    return 60; // 1 minute intervals (zoomed out)
  };

  const interval = getMarkerInterval();

  // Generate time markers
  const markers: number[] = [];
  for (let time = 0; time <= visibleDuration; time += interval) {
    markers.push(time);
  }

  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / zoom;
    setPlayhead(time);
  };

  return (
    <div className="relative bg-zinc-900 border-b border-zinc-800">
      {/* Time Ruler */}
      <div
        className="relative h-10 cursor-pointer select-none"
        onClick={handleClick}
        style={{ width: `${width}px` }}
      >
        {/* Time Markers */}
        {markers.map((time) => {
          const x = time * zoom;
          const isMajor = time % (interval * 5) === 0; // Major markers every 5 intervals

          return (
            <div
              key={time}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${x}px` }}
            >
              {/* Tick mark */}
              <div
                className={`w-px bg-zinc-600 ${
                  isMajor ? 'h-6' : 'h-4'
                }`}
              />

              {/* Time label (only on major markers) */}
              {isMajor && (
                <span className="text-[10px] text-zinc-500 font-mono mt-1">
                  {formatTime(time)}
                </span>
              )}
            </div>
          );
        })}

        {/* Playhead cursor */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-purple-500 pointer-events-none z-10"
          style={{ left: `${playhead * zoom}px` }}
        >
          {/* Playhead handle */}
          <div className="absolute top-0 -left-2 w-4 h-4 bg-purple-500 rounded-sm shadow-lg" />

          {/* Playhead time display */}
          <div className="absolute top-5 -left-8 bg-purple-500 text-white text-xs font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
            {formatTime(playhead)}
          </div>
        </div>
      </div>

      {/* Grid lines (vertical time guides) */}
      <div
        className="absolute top-10 pointer-events-none"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {markers.map((time) => {
          const x = time * zoom;
          const isMajor = time % (interval * 5) === 0;

          return (
            <div
              key={`grid-${time}`}
              className={`absolute top-0 bottom-0 w-px ${
                isMajor ? 'bg-zinc-800' : 'bg-zinc-900'
              }`}
              style={{ left: `${x}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}
