"use client";

import { Mic, Circle, Square, Play, Download, Trash2, Volume2 } from "lucide-react";

interface VoiceTagPanelProps {
  micEnabled: boolean;
  isRecording: boolean;
  tagUrl: string | null;
  tagDurationMs: number | null;
  level: number;
  error: string | null;
  tagVolume: number;
  onEnableMic: () => Promise<void>;
  onDisableMic: () => void;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onPlayTag: () => void;
  onDownloadTag: () => void;
  onClearTag: () => void;
  onTagVolumeChange: (v: number) => void;
}

export function VoiceTagPanel({
  micEnabled,
  isRecording,
  tagUrl,
  tagDurationMs,
  level,
  error,
  tagVolume,
  onEnableMic,
  onDisableMic,
  onStartRecording,
  onStopRecording,
  onPlayTag,
  onDownloadTag,
  onClearTag,
  onTagVolumeChange,
}: VoiceTagPanelProps) {
  const formatDuration = (ms: number | null): string => {
    if (!ms) return "0.0s";
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div className="mt-4 w-full flex flex-col items-center gap-2">
      <div className="text-xs font-barlow uppercase text-gray-400 mb-1">
        VOICE TAG
      </div>

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-500 font-barlow text-center max-w-[200px] mb-2">
          {error}
        </div>
      )}

      {/* Main controls */}
      <div className="flex gap-2 items-center flex-wrap justify-center">
        {!micEnabled ? (
          <button
            onClick={onEnableMic}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-barlow uppercase text-xs rounded border-2 border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
            aria-label="Enable microphone"
            title="Enable microphone"
          >
            <Mic className="w-4 h-4" />
            ENABLE MIC
          </button>
        ) : (
          <>
            {!isRecording ? (
              <button
                onClick={onStartRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-barlow uppercase text-xs rounded border-2 border-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                aria-label="Record voice tag"
                title="Record voice tag"
              >
                <Circle className="w-4 h-4 fill-current" />
                RECORD
              </button>
            ) : (
              <button
                onClick={onStopRecording}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-barlow uppercase text-xs rounded border-2 border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                aria-label="Stop recording"
                title="Stop recording"
              >
                <Square className="w-4 h-4 fill-current" />
                STOP
              </button>
            )}

            {tagUrl && (
              <>
                <button
                  onClick={onPlayTag}
                  className="px-4 py-2 bg-[#00ff00] hover:bg-[#00ff00]/90 text-black font-barlow uppercase text-xs rounded border-2 border-[#00ff00] transition-all focus:outline-none focus:ring-2 focus:ring-[#00ff00] min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                  aria-label="Drop/Play voice tag"
                  title="Drop/Play voice tag"
                >
                  <Play className="w-4 h-4" />
                  DROP
                </button>

                <button
                  onClick={onDownloadTag}
                  className="px-4 py-2 bg-[#00d9ff] hover:bg-[#00d9ff]/90 text-black font-barlow uppercase text-xs rounded border-2 border-[#00d9ff] transition-all focus:outline-none focus:ring-2 focus:ring-[#00d9ff] min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                  aria-label="Download voice tag"
                  title="Download voice tag"
                >
                  <Download className="w-4 h-4" />
                  DL
                </button>

                <button
                  onClick={onClearTag}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-barlow uppercase text-xs rounded border-2 border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                  aria-label="Clear voice tag"
                  title="Clear voice tag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onDisableMic}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-barlow uppercase text-xs rounded border-2 border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
              aria-label="Disable microphone"
              title="Disable microphone"
            >
              <Mic className="w-4 h-4" />
              OFF
            </button>
          </>
        )}
      </div>

      {/* Status indicators */}
      {isRecording && (
        <div className="flex items-center gap-2 text-xs text-red-500 font-barlow">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          RECORDING {tagDurationMs && `(${formatDuration(tagDurationMs)})`}
        </div>
      )}

      {micEnabled && !isRecording && (
        <div className="flex items-center gap-2 text-xs text-blue-500 font-barlow">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          MIC ENABLED
        </div>
      )}

      {tagUrl && !isRecording && (
        <div className="text-xs text-[#00ff00] font-barlow">
          TAG READY ({formatDuration(tagDurationMs)})
        </div>
      )}

      {/* Level meter (when mic enabled) */}
      {micEnabled && (
        <div className="w-full max-w-[200px] flex flex-col items-center gap-1">
          <div className="text-[10px] font-barlow uppercase text-gray-500">
            LEVEL
          </div>
          <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-[#00ff00] transition-all duration-75"
              style={{ width: `${Math.min(100, level * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tag volume control (when tag exists) */}
      {tagUrl && (
        <div className="mt-2 w-full max-w-[200px] flex flex-col items-center gap-1">
          <div className="text-[10px] font-barlow uppercase text-gray-500 flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            TAG VOL
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[10px] text-gray-500 font-barlow">0</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={tagVolume}
              onChange={(e) => onTagVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-[#00ff00]"
              style={{
                background: `linear-gradient(to right, #00ff00 0%, #00ff00 ${tagVolume * 100}%, #0a0a0a ${tagVolume * 100}%, #0a0a0a 100%)`,
              }}
              aria-label="Tag volume"
            />
            <span className="text-[10px] text-gray-500 font-barlow">100</span>
          </div>
          <div className="text-[10px] font-barlow text-[#00ff00]">
            {Math.round(tagVolume * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}

