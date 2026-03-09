"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SessionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  deckATrack: string | null;
  deckBTrack: string | null;
  sessionDuration: number; // in seconds
  remixIntensity: number; // 0-1, calculated from stem manipulations
  onDownload: () => Promise<void>;
  onShare: () => Promise<void>;
}

/**
 * SessionSummary - Cinematic session completion popup
 *
 * Displays a luxury Brushed Gold and Onyx Glassmorphism popup
 * showing session statistics and providing download/share options.
 *
 * Features:
 * - Session breakdown visualization
 * - Track names display
 * - Download rendered mix
 * - Social sharing
 * - Smooth cinematic animations
 */
export function SessionSummary({
  isOpen,
  onClose,
  deckATrack,
  deckBTrack,
  sessionDuration,
  remixIntensity,
  onDownload,
  onShare,
}: SessionSummaryProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } catch (error) {
      console.error("[SessionSummary] Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare();
    } catch (error) {
      console.error("[SessionSummary] Share failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full max-w-2xl bg-black/90 backdrop-blur-xl border-2 border-brushed-gold/30 p-8 md:p-12"
              style={{
                boxShadow: "inset 0 0 60px rgba(212, 175, 55, 0.15), 0 8px 40px rgba(0, 0, 0, 0.5)",
                background: "linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)",
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-brushed-gold/60 hover:text-brushed-gold transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h2 className="text-3xl md:text-4xl font-sans font-bold uppercase tracking-tighter text-brushed-gold mb-2">
                  SESSION COMPLETE
                </h2>
                <p className="text-foreground/60 font-sans text-sm">
                  STUDIO_CORE: SESSION_COMPLETE
                </p>
              </motion.div>

              {/* Track Names */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-brushed-gold/80 font-sans font-semibold text-sm uppercase tracking-wider w-20">
                    DECK A:
                  </span>
                  <span className="text-foreground font-sans">
                    {deckATrack || "No Track"}
                  </span>
                </div>
                {deckBTrack && (
                  <div className="flex items-center gap-3">
                    <span className="text-brushed-gold/80 font-sans font-semibold text-sm uppercase tracking-wider w-20">
                      DECK B:
                    </span>
                    <span className="text-foreground font-sans">
                      {deckBTrack}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Session Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <h3 className="text-brushed-gold/80 font-sans font-semibold text-sm uppercase tracking-wider mb-4">
                  SESSION BREAKDOWN
                </h3>

                {/* Duration */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground/80 font-sans text-sm">Duration</span>
                    <span className="text-brushed-gold font-sans font-semibold">
                      {formatDuration(sessionDuration)}
                    </span>
                  </div>
                </div>

                {/* Remix Intensity Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground/80 font-sans text-sm">Remix Intensity</span>
                    <span className="text-brushed-gold font-sans font-semibold">
                      {Math.round(remixIntensity * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-foreground/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${remixIntensity * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-brushed-gold/60 to-brushed-gold"
                      style={{
                        boxShadow: "0 0 10px rgba(212, 175, 55, 0.5)",
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 px-6 py-4 bg-brushed-gold text-black font-sans font-bold uppercase tracking-wider hover:bg-brushed-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[50px]"
                  style={{
                    boxShadow: "0 4px 20px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  <Download className="w-5 h-5" />
                  {isDownloading ? "RENDERING..." : "DOWNLOAD MIX"}
                </button>

                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex-1 px-6 py-4 bg-transparent border-2 border-brushed-gold/50 text-brushed-gold font-sans font-bold uppercase tracking-wider hover:border-brushed-gold hover:bg-brushed-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[50px]"
                >
                  <Share2 className="w-5 h-5" />
                  {isSharing ? "SHARING..." : "SHARE"}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

