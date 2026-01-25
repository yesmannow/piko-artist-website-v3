"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

/**
 * Waveform Props
 */
import type { Stem } from '@/lib/types/audio';

export interface WaveformProps {
  audioBuffer: AudioBuffer | null;
  stems?: Map<string, Stem>; // For Producer Mode: drums, bass, vocals, other
  progress?: number; // 0-1
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onNudge?: (rate: number) => void; // Callback for vinyl nudge (playback rate adjustment)
  height?: number;
  className?: string;
}

/**
 * Waveform - Responsive waveform visualization using Wavesurfer.js
 *
 * Implements dynamic decimation strategy:
 * - Mobile (<768px): minPxPerSec: 20, larger barWidth
 * - Desktop (≥768px): minPxPerSec: 50, detailed view
 *
 * Uses useResizeObserver to adapt to screen size changes.
 */
export function Waveform({
  audioBuffer,
  stems,
  progress = 0,
  isPlaying = false,
  onSeek,
  onNudge,
  height = 60,
  className = '',
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Vinyl nudge state
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const lastDragXRef = useRef(0);
  const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to convert AudioBuffer to Blob URL
  const audioBufferToBlobUrl = useCallback((buffer: AudioBuffer): string => {
    // Convert AudioBuffer to WAV format
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;

    // WAV file header
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
    view.setUint16(32, numberOfChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }, []);

  // Initialize Wavesurfer
  useEffect(() => {
    if (!containerRef.current || !audioBuffer) {
      return;
    }

    // Destroy existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    // Check if we're in Producer Mode (stems available)
    const isProducerMode = stems && stems.size > 0;

    // Create new instance with responsive settings
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#E0E0E0',
      progressColor: '#FFD700',
      cursorColor: '#00f0ff',
      barWidth: isMobile ? 3 : 2,
      barRadius: 0, // Brutalist: sharp corners
      barGap: isMobile ? 2 : 1,
      height: isProducerMode ? height * (stems.size + 1) : height, // Stack height for multitrack
      normalize: true,
      minPxPerSec: isMobile ? 20 : 50, // Dynamic decimation
      interact: !!onSeek,
    });

    // Convert AudioBuffer to Blob URL for Wavesurfer
    let blobUrl: string | null = null;
    if (audioBuffer) {
      blobUrl = audioBufferToBlobUrl(audioBuffer);
      wavesurfer.load(blobUrl);
    } else if (isProducerMode && stems && stems.size > 0) {
      // Load first stem if no main buffer
      const firstStem = Array.from(stems.values())[0];
      if (firstStem?.buffer) {
        blobUrl = audioBufferToBlobUrl(firstStem.buffer);
        wavesurfer.load(blobUrl);
      }
    }

    // Handle seek - Wavesurfer v7 uses 'interaction' event for seek
    if (onSeek) {
      wavesurfer.on('interaction', () => {
        const time = wavesurfer.getCurrentTime();
        onSeek(time);
      });
    }

    wavesurferRef.current = wavesurfer;

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioBuffer, stems, height, isMobile, onSeek, audioBufferToBlobUrl]);

  // Update progress
  useEffect(() => {
    if (wavesurferRef.current && !isPlaying) {
      // Only update progress when not playing (Wavesurfer handles playhead during playback)
      const duration = wavesurferRef.current.getDuration();
      if (duration > 0) {
        wavesurferRef.current.seekTo(progress);
      }
    }
  }, [progress, isPlaying]);

  // Update play state
  useEffect(() => {
    if (!wavesurferRef.current) return;

    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying]);

  /**
   * Vinyl Nudge Handler - Emulates vinyl scratching by adjusting playback rate
   * Uses PointerEvents for unified mouse/touch support
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!onNudge || !isPlaying) return;

    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    lastDragXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [onNudge, isPlaying]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !onNudge || !isPlaying) return;

    const deltaX = e.clientX - lastDragXRef.current;
    lastDragXRef.current = e.clientX;

    // Calculate nudge rate based on horizontal drag
    // Positive delta = forward (speed up), negative = backward (slow down)
    const nudgeAmount = deltaX * 0.001; // Sensitivity factor
    const baseRate = 1.0;
    const nudgeRate = Math.max(0.5, Math.min(2.0, baseRate + nudgeAmount));

    // Apply nudge
    onNudge(nudgeRate);

    // Clear existing timeout
    if (nudgeTimeoutRef.current) {
      clearTimeout(nudgeTimeoutRef.current);
    }

    // Reset to normal rate after 100ms of no movement
    nudgeTimeoutRef.current = setTimeout(() => {
      onNudge(1.0);
    }, 100);
  }, [onNudge, isPlaying]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Reset playback rate
    if (onNudge) {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
      }
      onNudge(1.0);
    }
  }, [onNudge]);

  // Cleanup nudge timeout
  useEffect(() => {
    return () => {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full ${className} ${onNudge ? 'touch-action-none cursor-grab active:cursor-grabbing' : ''}`}
      style={{ height: `${height}px` }}
      onPointerDown={onNudge ? handlePointerDown : undefined}
      onPointerMove={onNudge ? handlePointerMove : undefined}
      onPointerUp={onNudge ? handlePointerUp : undefined}
      onPointerCancel={onNudge ? handlePointerUp : undefined}
    />
  );
}
