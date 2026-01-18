"use client";

import { useState, useCallback } from 'react';
import { Circle, Square, Download } from 'lucide-react';
import type { useCanvasVideoRecorder } from '@/hooks/useCanvasVideoRecorder';

interface RecordSessionControlsProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onExport: () => Blob | null;
  className?: string;
}

/**
 * RecordSessionControls - UI controls for session recording
 *
 * Provides Start, Stop, and Download buttons for recording FX sessions.
 *
 * @example
 * ```tsx
 * const { start, stop, exportBlob, isRecording } = useCanvasVideoRecorder(...);
 *
 * <RecordSessionControls
 *   isRecording={isRecording}
 *   onStart={start}
 *   onStop={stop}
 *   onExport={exportBlob}
 * />
 * ```
 */
export function RecordSessionControls({
  isRecording,
  onStart,
  onStop,
  onExport,
  className = '',
}: RecordSessionControlsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = useCallback(() => {
    const blob = onExport();
    if (!blob) {
      alert('No recording available. Please record first.');
      return;
    }

    setIsExporting(true);

    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fx-recording-${Date.now()}.${blob.type.includes('webm') ? 'webm' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download recording:', error);
      alert('Failed to download recording.');
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-white/10 bg-black/80 p-3 shadow-xl backdrop-blur-md ${className}`}
    >
      {!isRecording ? (
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-lg bg-green-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start Recording"
        >
          <Circle className="h-4 w-4 fill-white" />
          Start
        </button>
      ) : (
        <button
          onClick={onStop}
          className="flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
          title="Stop Recording"
        >
          <Square className="h-4 w-4 fill-white" />
          Stop
        </button>
      )}

      <button
        onClick={handleDownload}
        disabled={isExporting}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download Recording"
      >
        <Download className="h-4 w-4" />
        Download
      </button>

      {isRecording && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <Circle className="h-2 w-2 fill-red-400 animate-pulse" />
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
}
