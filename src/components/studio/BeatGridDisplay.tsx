"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Sync } from 'lucide-react';
import { useBeatGrid } from '@/hooks/useBeatGrid';
import { useKey } from '@/hooks/useKey';
import type { BeatGridData } from '@/engine/BeatGridService';

interface BeatGridDisplayProps {
  audioBuffer: AudioBuffer | null;
  cacheKey?: string;
  onSync?: (beatGrid: BeatGridData) => void;
  className?: string;
}

/**
 * BeatGridDisplay - UI component for displaying BPM and beat grid info
 *
 * Phase 9A: Shows BPM, enables "Sync (tempo only)" button
 *
 * Features:
 * - Real-time BPM display
 * - Beat grid analysis status
 * - Sync button for tempo matching
 */
export function BeatGridDisplay({
  audioBuffer,
  cacheKey,
  onSync,
  className = '',
}: BeatGridDisplayProps) {
  const { isAnalyzing, beatGridData, analyze, error } = useBeatGrid();
  const { isAnalyzing: isAnalyzingKey, keyData, analyze: analyzeKey } = useKey();

  // Auto-analyze beat grid when audio buffer is available
  useEffect(() => {
    if (audioBuffer && !beatGridData && !isAnalyzing) {
      analyze(audioBuffer, cacheKey).catch((err) => {
        console.error('[BeatGridDisplay] Beat grid analysis failed:', err);
      });
    }
  }, [audioBuffer, beatGridData, isAnalyzing, cacheKey, analyze]);

  // Auto-analyze key when audio buffer is available
  useEffect(() => {
    if (audioBuffer && !keyData && !isAnalyzingKey && cacheKey) {
      analyzeKey(audioBuffer, cacheKey).catch((err) => {
        console.error('[BeatGridDisplay] Key analysis failed:', err);
      });
    }
  }, [audioBuffer, keyData, isAnalyzingKey, cacheKey, analyzeKey]);

  const handleSync = () => {
    if (beatGridData && onSync) {
      onSync(beatGridData);
    }
  };

  const canSync = beatGridData !== null && !isAnalyzing;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* BPM Display */}
      <div className="px-4 py-3 bg-black/80 backdrop-blur-sm border-2 border-zinc-700 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-[#FFD700]" />
            <span className="text-xs uppercase tracking-wider text-zinc-400">BPM</span>
          </div>
          <div className="text-right">
            {isAnalyzing ? (
              <span className="text-zinc-500 text-sm">Analyzing...</span>
            ) : beatGridData ? (
              <div>
                <span className="text-2xl font-black text-[#FFD700]">
                  {Math.round(beatGridData.bpm)}
                </span>
                {beatGridData.confidence > 0.5 && (
                  <span className="ml-2 text-xs text-zinc-500">
                    ({(beatGridData.confidence * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-zinc-500 text-sm">--</span>
            )}
          </div>
        </div>

        {/* Beat Grid Info */}
        {beatGridData && (
          <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Beats: {beatGridData.beatTimestamps.length}</span>
              <span>Downbeat: {beatGridData.downbeatTime.toFixed(2)}s</span>
            </div>
          </div>
        )}

        {/* Key Display */}
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-400">KEY</span>
            <div className="text-right">
              {isAnalyzingKey ? (
                <span className="text-zinc-500 text-sm">Analyzing...</span>
              ) : keyData ? (
                <div className="flex items-center gap-2">
                  {keyData.available ? (
                    <>
                      <span className="text-lg font-black text-[#FFD700]">
                        {keyData.camelot}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {keyData.root} {keyData.scale}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">
                      Unavailable
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-zinc-500 text-sm">--</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Button */}
      <motion.button
        onClick={handleSync}
        disabled={!canSync}
        className={`
          w-full px-6 py-3
          bg-black/80 backdrop-blur-sm
          border-2 font-mono text-sm uppercase tracking-wider
          transition-all duration-200
          flex items-center justify-center gap-2
          min-h-[48px]
          ${
            canSync
              ? 'border-[#FFD700] text-[#FFD700] hover:border-[#FFD700]/80 hover:bg-black/90'
              : 'border-zinc-700 text-zinc-500 cursor-not-allowed'
          }
        `}
        whileHover={canSync ? { scale: 1.02 } : {}}
        whileTap={canSync ? { scale: 0.98 } : {}}
      >
        <Sync className="w-4 h-4" />
        <span>SYNC (TEMPO ONLY)</span>
      </motion.button>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-red-900/20 border border-red-500/50 text-red-400 text-xs font-mono"
        >
          ERROR: {error}
        </motion.div>
      )}
    </div>
  );
}
