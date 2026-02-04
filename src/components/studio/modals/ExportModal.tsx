"use client";

/**
 * ExportModal Component
 * 
 * Framer Motion spring-loaded modal for exporting mixes
 * - Progress bar during rendering
 * - "Share to TikTok" button (simulated deep link)
 * - Haptic feedback on completion
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { useExporter } from '@/hooks/audio/useExporter';
import { useSocialExport } from '@/hooks/integrations/useSocialExport';
import * as Tone from 'tone';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterBus?: Tone.ToneAudioNode;
  recordingBlob?: Blob | null;
  onRecordingConsumed?: () => void;
  onTranscode?: (blob: Blob) => Promise<void> | void;
}

export function ExportModal({
  isOpen,
  onClose,
  masterBus,
  recordingBlob,
  onRecordingConsumed,
  onTranscode,
}: ExportModalProps) {
  const { transcode, recordMasterBus, isTranscoding, progress, error } = useExporter();
  const { convertToSocialMP4, isProcessing, progress: socialProgress } = useSocialExport();
  const [isRecording, setIsRecording] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  };

  const handleExport = async () => {
    if (recordingBlob) {
      try {
        await (onTranscode ? onTranscode(recordingBlob) : transcode(recordingBlob, 'Piko-Studio-Remix'));
        setExportComplete(true);
        triggerHaptic();
        onRecordingConsumed?.();
      } catch (error) {
        console.error('[ExportModal] Export failed:', error);
        alert('Export failed. Please try again.');
      }
      return;
    }

    if (!masterBus) {
      alert('Master bus not available');
      return;
    }

    setIsRecording(true);
    try {
      // Record for 30 seconds (or until manually stopped)
      const blob = await recordMasterBus(masterBus, 30);
      
      if (blob) {
        // Transcode to MP3
        await transcode(blob, 'Piko-Studio-Remix');
        setExportComplete(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error('[ExportModal] Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleShareToTikTok = () => {
    // Simulated TikTok deep link
    // In production, this would use TikTok's Share Kit or generate a video
    const tiktokUrl = `https://www.tiktok.com/upload?audio_url=${encodeURIComponent(window.location.href)}`;
    window.open(tiktokUrl, '_blank');
    triggerHaptic();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExportComplete(false);
      setIsRecording(false);
    }
  }, [isOpen]);

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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-panel p-6 rounded-lg border border-white/10 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black uppercase text-white">Export Mix</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* Progress Bar */}
            {(isRecording || isTranscoding) && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">
                    {isRecording ? 'Recording...' : 'Processing...'}
                  </span>
                  <span className="text-sm font-mono text-white">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-studio-cyan to-studio-purple"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {exportComplete && (
              <div className="mb-6 p-4 bg-studio-cyan/20 border border-studio-cyan/50 rounded-lg">
                <p className="text-sm text-studio-cyan font-bold">✓ Export Complete!</p>
                <p className="text-xs text-white/60 mt-1">Your mix has been downloaded.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={handleExport}
                disabled={isRecording || isTranscoding || (!recordingBlob && !masterBus)}
                className="w-full px-6 py-3 bg-studio-cyan text-black font-black uppercase rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isRecording && !isTranscoding ? { scale: 1.02 } : {}}
                whileTap={!isRecording && !isTranscoding ? { scale: 0.98 } : {}}
              >
                {(isRecording || isTranscoding) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isRecording ? 'Recording...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    {recordingBlob ? 'Export Recording' : 'Export to MP3'}
                  </>
                )}
              </motion.button>

              {exportComplete && (
                <motion.button
                  onClick={handleShareToTikTok}
                  className="w-full px-6 py-3 bg-white/5 border border-white/10 text-white font-black uppercase rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 className="w-5 h-5" />
                  Share to TikTok
                </motion.button>
              )}

              <motion.button
                onClick={async () => {
                  if (!recordingBlob) return;
                  const url = await convertToSocialMP4(recordingBlob, 'Piko-Studio-Drop.mp4');
                  if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Piko-Studio-Drop.mp4';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
                disabled={!recordingBlob || isProcessing}
                className="w-full px-6 py-3 bg-gradient-to-r from-studio-cyan to-studio-purple text-black font-black uppercase rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isProcessing ? { scale: 1.02 } : {}}
                whileTap={!isProcessing ? { scale: 0.98 } : {}}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Exporting MP4... {Math.round(socialProgress)}%
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Export TikTok/Insta Drop (MP4)
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
