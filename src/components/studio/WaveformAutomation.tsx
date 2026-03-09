'use client';

import React, { useState, MouseEvent as ReactMouseEvent } from 'react';
import { useDeckStore } from '@/store/deckStore';
import { TrackAutomation } from '@/lib/db';

interface WaveformAutomationProps {
  deckId: 'A' | 'B';
  width: number;
  height: number;
  activeParam: 'volume' | 'hpf' | 'reverb';
}

export function WaveformAutomation({ deckId, width, height, activeParam }: WaveformAutomationProps) {
  const deckState = useDeckStore((state) => (deckId === 'A' ? state.deckA : state.deckB));
  const updateTrackAutomation = useDeckStore((state) => state.updateTrackAutomation);
  const track = deckState.track;

  // Local state for immediate drawing response
  const [points, setPoints] = useState<TrackAutomation['points']>([]);
  const [isDragging, setIsDragging] = useState<number | null>(null);

  const [prevTrack, setPrevTrack] = useState(track);
  const [prevParam, setPrevParam] = useState(activeParam);

  if (track !== prevTrack || activeParam !== prevParam) {
    setPrevTrack(track);
    setPrevParam(activeParam);
    if (track && track.automation) {
      const auto = track.automation.find(a => a.param === activeParam);
      setPoints(auto ? auto.points : []);
    } else {
      setPoints([]);
    }
  }

  const getSnappedTime = (timeSec: number, bpm?: string) => {
    if (!bpm || Number(bpm) <= 0) return timeSec;
    const beatDuration = 60 / Number(bpm);
    const sixteenth = beatDuration / 4;
    return Math.round(timeSec / sixteenth) * sixteenth;
  };

  const timeToX = (time: number) => {
    if (!track || !deckState.duration) return 0;
    return (time / deckState.duration) * width;
  };

  const xToTime = (x: number) => {
    if (!deckState.duration) return 0;
    return Math.max(0, Math.min(deckState.duration, (x / width) * deckState.duration));
  };

  const valueToY = (value: number) => {
    return height - (value * height);
  };

  const yToValue = (y: number) => {
    return Math.max(0, Math.min(1, 1 - (y / height)));
  };

  const handlePointerDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = getSnappedTime(xToTime(x), track.bpm);
    const value = yToValue(y);

    // Click on existing point? (threshold 10px)
    const clickedIndex = points.findIndex(p => {
      const px = timeToX(p.time);
      const py = valueToY(p.value);
      return Math.hypot(px - x, py - y) < 10;
    });

    if (clickedIndex !== -1) {
      if (e.shiftKey) {
        // Delete point
        const newPoints = points.filter((_, i) => i !== clickedIndex);
        setPoints(newPoints);
        updateTrackDb(newPoints);
      } else {
        setIsDragging(clickedIndex);
      }
    } else {
      // Add new point
      const newPoints = [...points, { time, value, curve: 'linear' as const }].sort((a, b) => a.time - b.time);
      setPoints(newPoints);
      setIsDragging(newPoints.findIndex(p => p.time === time));
    }
  };

  const handlePointerMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isDragging === null || !track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = getSnappedTime(xToTime(x), track.bpm);
    const value = yToValue(y);

    const newPoints = [...points];
    newPoints[isDragging] = { ...newPoints[isDragging], time, value };
    // Sort just in case we dragged past another point
    newPoints.sort((a, b) => a.time - b.time);
    
    // Update dragging index if position changed due to sort
    const newIndex = newPoints.findIndex(p => p.time === time && p.value === value);
    if (newIndex !== -1) setIsDragging(newIndex);
    
    setPoints(newPoints);
  };

  const handlePointerUp = () => {
    if (isDragging !== null) {
      setIsDragging(null);
      updateTrackDb(points);
    }
  };

  const updateTrackDb = (newPoints: TrackAutomation['points']) => {
    if (!track || !deckState.duration) return;
    
    const currentAutomation = track.automation ? [...track.automation] : [];
    const existingIndex = currentAutomation.findIndex(a => a.param === activeParam);
    
    if (existingIndex !== -1) {
      currentAutomation[existingIndex] = { ...currentAutomation[existingIndex], points: newPoints };
    } else {
      currentAutomation.push({ param: activeParam, points: newPoints });
    }
    
    updateTrackAutomation(deckId, currentAutomation);
    
    // Dispatch an event so useDeckAudio can sync with the worker
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('update-automation', { detail: { deckId, automation: currentAutomation } }));
    }
  };

  return (
    <div 
      className="absolute inset-0 z-40 touch-none backdrop-blur-[2px] border border-white/10"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg width={width} height={height} className="pointer-events-none drop-shadow-md">
        <polyline 
          points={points.map(p => `${timeToX(p.time)},${valueToY(p.value)}`).join(' ')}
          fill="none"
          stroke={activeParam === 'volume' ? '#00f2ff' : activeParam === 'hpf' ? '#f43f5e' : '#a855f7'}
          strokeWidth="2"
          className="opacity-70"
        />
        {points.map((p, i) => (
          <circle 
            key={i}
            cx={timeToX(p.time)}
            cy={valueToY(p.value)}
            r={isDragging === i ? 6 : 4}
            fill="white"
            className="transition-all duration-100 ease-out"
          />
        ))}
      </svg>
    </div>
  );
}
