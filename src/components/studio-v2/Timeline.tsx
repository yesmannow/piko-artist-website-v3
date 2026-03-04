'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Volume2 } from 'lucide-react';
import { useTimelineStore } from '@/hooks/studio-v2/useTimelineStore';
import { useTimelineAudio } from '@/hooks/studio-v2/useTimelineAudio';
import { TimelineGrid } from './TimelineGrid';
import { TrackRow } from './TrackRow';
import { TimelineLibrary } from './TimelineLibrary';
import { formatTime } from '@/lib/studio-v2/timeline-utils';

/**
 * Timeline - Multi-track timeline-based mixing interface
 *
 * Architecture:
 * - Horizontal track arrangement (not vertical decks)
 * - Visual transition editing (not live crossfading)
 * - Export-focused workflow (not live performance)
 *
 * Inspired by: Mixpoint, DJ.Studio, Ableton arrangement view
 */
export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const masterVolumeRef = useRef(0.8);

  const {
    isPlaying,
    playhead,
    zoom,
    tracks,
    projectName,
    getTotalDuration,
    play: storePlay,
    pause: storePause,
    stop: storeStop,
    setZoom,
    zoomIn,
    zoomOut,
  } = useTimelineStore();

  const {
    initAudio,
    isReady: isAudioReady,
    play: audioPlay,
    pause: audioPause,
    stop: audioStop,
    setMasterVolume,
  } = useTimelineAudio();

  const totalDuration = getTotalDuration();
  const trackCount = tracks.length;

  // Calculate timeline width (derived state - no useEffect needed)
  const minWidth = 5000;
  const timelineWidth = Math.max(minWidth, (totalDuration + 60) * zoom);

  // Initialize audio on mount (from user interaction)
  useEffect(() => {
    const initializeAudio = async () => {
      if (!isAudioReady) {
        console.log('[Timeline] Initializing audio engine...');
        await initAudio();
      }
    };

    // Auto-initialize on component mount (safe in modern browsers)
    initializeAudio().catch((error) => {
      console.warn('[Timeline] Audio initialization delayed (user interaction required):', error);
    });
  }, [initAudio, isAudioReady]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioPause();
      storePause();
    } else {
      audioPlay();
      storePlay();
    }
  };

  const handleStop = () => {
    audioStop();
    storeStop();
  };

  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    masterVolumeRef.current = volume;
    setMasterVolume(volume);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {projectName}
          </h1>
          <span className="text-sm text-zinc-500">Timeline Mixer</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-zinc-500">Duration:</span>
            <span className="ml-2 font-mono text-purple-400">{formatTime(totalDuration)}</span>
          </div>
          <div className="text-sm">
            <span className="text-zinc-500">Tracks:</span>
            <span className="ml-2 font-mono text-blue-400">{trackCount}</span>
          </div>
          <div className="text-sm">
            <span className="text-zinc-500">Position:</span>
            <span className="ml-2 font-mono text-pink-400">{formatTime(playhead)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Master Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zinc-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0.8"
              onChange={handleMasterVolumeChange}
              className="w-24"
              title="Master Volume"
            />
          </div>

          <Button
            size="sm"
            variant="flat"
            className="bg-zinc-800 hover:bg-zinc-700"
          >
            Save Project
          </Button>
          <Button
            size="sm"
            color="primary"
            className="bg-linear-to-r from-purple-500 to-pink-500"
          >
            Export Mix
          </Button>
        </div>
      </header>

      {/* Transport Controls */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-zinc-800 hover:bg-zinc-700"
            onClick={handleStop}
            title="Stop (reset to start)"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="lg"
            color={isPlaying ? 'danger' : 'success'}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-zinc-800 hover:bg-zinc-700"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-zinc-800 hover:bg-zinc-700"
            onClick={zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Zoom:</span>
            <input
              type="range"
              min="10"
              max="200"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm font-mono text-zinc-400">{Math.round(zoom)}px/s</span>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-zinc-800 hover:bg-zinc-700"
            onClick={zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Library Sidebar */}
        <aside className="w-80 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto">
          <TimelineLibrary />
        </aside>

        {/* Timeline Grid */}
        <main className="flex-1 bg-zinc-950 overflow-auto" ref={timelineRef}>
          <div className="min-h-full">
            {/* Time Ruler + Grid */}
            <TimelineGrid width={timelineWidth} height={800} />

            {/* Track Rows */}
            <div className="relative" style={{ width: `${timelineWidth}px` }}>
              <div className="space-y-3 p-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((rowIndex) => (
                  <TrackRow key={rowIndex} rowIndex={rowIndex} width={timelineWidth} />
                ))}
              </div>
            </div>

            {/* Empty State */}
            {trackCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-zinc-600">
                  <p className="text-sm">Timeline is empty</p>
                  <p className="text-xs mt-2">Drag tracks from library to start building your mix</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="bg-zinc-900 border-t border-zinc-800 px-6 py-2 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>Studio V2 - Timeline Mixer (Phase 3)</span>
          {isAudioReady ? (
            <span className="text-green-500">🎵 Audio Engine Ready</span>
          ) : (
            <span className="text-yellow-500">⚠ Audio Loading...</span>
          )}
        </div>
        <div>Press Space to Play/Pause • Click ruler to seek • Drag tracks to arrange</div>
      </footer>
    </div>
  );
}
