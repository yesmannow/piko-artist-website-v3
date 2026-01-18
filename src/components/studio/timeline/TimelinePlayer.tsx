"use client";

import { useEffect, useRef, useState } from 'react';
import { useFXEngine } from '@/hooks/useFXEngine';
import { Play, Pause, Square } from 'lucide-react';
import type { AutomationTrack } from '@/lib/fx/FXAutomation';

interface TimelinePlayerProps {
  engine?: ReturnType<typeof useFXEngine>;
  onTimeUpdate?: (time: number) => void;
}

/**
 * TimelinePlayer - Visual component for FX automation playback
 * 
 * Features:
 * - Play/pause automation timeline
 * - Visual timeline scrubber
 * - Integration with FX engine for real-time parameter updates
 * - Timeline markers for preset changes
 */
export function TimelinePlayer({ 
  engine,
  onTimeUpdate 
}: TimelinePlayerProps) {
  // Use provided engine or create new instance
  const defaultEngine = useFXEngine();
  const fx = engine ?? defaultEngine;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(60); // 60 seconds default
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Sync with FX engine automation state
  useEffect(() => {
    if (fx.isAutomationPlaying !== isPlaying) {
      setIsPlaying(fx.isAutomationPlaying);
    }
  }, [fx.isAutomationPlaying, isPlaying]);

  useEffect(() => {
    setCurrentTime(fx.automationTime);
  }, [fx.automationTime]);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newTime = Math.min(elapsed, duration);
        setCurrentTime(newTime);
        fx.seekAutomation(newTime);
        
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }

        if (newTime < duration) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
          fx.stopAutomation();
        }
      };
      
      startTimeRef.current = Date.now() - currentTime * 1000;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, duration, currentTime, onTimeUpdate, fx]);

  const handlePlay = () => {
    setIsPlaying(true);
    fx.startAutomation();
  };

  const handlePause = () => {
    setIsPlaying(false);
    fx.pauseAutomation();
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    fx.stopAutomation();
    fx.seekAutomation(0);
  };

  const handleSeek = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(clampedTime);
    fx.seekAutomation(clampedTime);
    if (onTimeUpdate) {
      onTimeUpdate(clampedTime);
    }
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Timeline Player</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c1ff00] text-black hover:bg-[#c1ff00]/80 transition"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
          <button
            onClick={handleStop}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
          >
            <Square className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <div className="relative h-2 w-full rounded-full bg-white/10">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c1ff00] to-[#7c3aed] transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="flex justify-between text-xs text-white/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Preset Markers */}
      {fx.presets.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/60">
            Preset Markers
          </label>
          <div className="flex gap-2 flex-wrap">
            {fx.presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => fx.loadPreset(preset)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  fx.currentPreset?.id === preset.id
                    ? 'border-[#c1ff00] bg-[#c1ff00]/20 text-[#c1ff00]'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
