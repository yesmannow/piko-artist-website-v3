"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2 } from "lucide-react";
import { useStemService } from "@/hooks/useStemService";
import type { SeparatedStems } from "@/engine/StemService";

interface StemSeparatorButtonProps {
  audioBuffer: AudioBuffer | null;
  onStemsReady?: (stems: SeparatedStems) => void;
  cacheKey?: string;
  className?: string;
}

/**
 * StemSeparatorButton - UI component for stem separation
 *
 * Phase 8A: Foundation component with:
 * - Button to trigger separation
 * - Progress indicator with stage updates
 * - Cancellation support
 * - Error handling
 *
 * Features:
 * - Real-time progress updates
 * - Cyberpunk/hacker terminal aesthetic
 * - Smooth animations with Framer Motion
 */
export function StemSeparatorButton({
  audioBuffer,
  onStemsReady,
  cacheKey,
  className = "",
}: StemSeparatorButtonProps) {
  const { isInitialized, isProcessing, progress, error, separate, cancel } =
    useStemService();

  // Handle separation
  const handleSeparate = useCallback(async () => {
    if (!audioBuffer || !isInitialized) {
      return;
    }

    try {
      const stems = await separate(audioBuffer, cacheKey);

      if (stems && onStemsReady) {
        onStemsReady(stems);
      }
    } catch (err) {
      // Error is handled by useStemService hook
      console.error("[StemSeparatorButton] Separation error:", err);
    }
  }, [audioBuffer, isInitialized, cacheKey, onStemsReady, separate]);

  const canSeparate = audioBuffer !== null && isInitialized && !isProcessing;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Button */}
      <motion.button
        onClick={isProcessing ? cancel : handleSeparate}
        disabled={!canSeparate && !isProcessing}
        className={`
          relative w-full px-6 py-3
          bg-black/80 backdrop-blur-sm
          border-2 font-mono text-sm uppercase tracking-wider
          transition-all duration-200
          flex items-center justify-center gap-2
          min-h-[48px]
          ${
            isProcessing
              ? "border-red-500 text-red-400 hover:border-red-400"
              : canSeparate
                ? "border-[#FFD700] text-[#FFD700] hover:border-[#FFD700]/80 hover:bg-black/90"
                : "border-zinc-700 text-zinc-500 cursor-not-allowed"
          }
        `}
        whileHover={canSeparate || isProcessing ? { scale: 1.02 } : {}}
        whileTap={canSeparate || isProcessing ? { scale: 0.98 } : {}}
      >
        {isProcessing ? (
          <>
            <X className="w-4 h-4" />
            <span>CANCEL</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>SEPARATE STEMS</span>
          </>
        )}
      </motion.button>

      {/* Progress Indicator */}
      <AnimatePresence>
        {isProcessing && progress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Progress Bar */}
            <div className="relative h-2 bg-zinc-900 border border-zinc-700 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>

            {/* Progress Text */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">{progress.stage}</span>
              <span className="text-[#FFD700]">
                {Math.round(progress.progress)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 bg-red-900/20 border border-red-500/50 text-red-400 text-xs font-mono"
          >
            ERROR: {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Indicator */}
      {!isInitialized && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Initializing...</span>
        </div>
      )}
    </div>
  );
}
