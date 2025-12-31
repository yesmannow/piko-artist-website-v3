"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, FileAudio, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStudioMonitor } from "@/components/ui/StudioMonitor";

interface SignalHatchProps {
  onFileUpload: (file: File) => Promise<void>;
  isProcessing?: boolean;
  processingProgress?: number;
}

/**
 * SignalHatch - V3 Urban Syndicate Audio Ingestion Point
 *
 * "The Loading Dock" - Primary interface for uploading "Unverified Signals"
 * (external audio files) for processing via WASM worker.
 *
 * Features:
 * - Drag & drop file upload
 * - Real-time processing status via StudioMonitor
 * - Brutalist UI with -12deg skew (desktop) / -6deg (mobile)
 * - Professional studio operation language
 */
export function SignalHatch({
  onFileUpload,
  isProcessing = false,
  processingProgress = 0
}: SignalHatchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useStudioMonitor();

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      const errorMsg = `STUDIO_CORE: Invalid file format. Accepted: MP3, WAV, OGG, M4A, AAC`;
      setError(errorMsg);
      addLog(errorMsg);
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      const errorMsg = `STUDIO_CORE: File exceeds maximum size (50MB)`;
      setError(errorMsg);
      addLog(errorMsg);
      return;
    }

    setError(null);
    addLog(`STUDIO_CORE: IMPORT_UNVERIFIED_SIGNAL: ${file.name}`);

    try {
      await onFileUpload(file);
    } catch (err) {
      const errorMsg = `STUDIO_CORE: Upload failed - ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      addLog(errorMsg);
    }
  }, [onFileUpload, addLog]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input to allow same file to be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  return (
    <div className="relative w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          relative border-4 border-[#E0E0E0] bg-[#050505] p-8 md:p-12
          cursor-pointer transition-all
          ${isDragging ? 'border-[#FFD700] bg-[#0A0A0A]' : ''}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        whileHover={{ borderColor: '#FFD700' }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Brutalist Skew Container */}
        <div className="relative" data-urban="skew">
          {/* Content */}
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            {/* Icon */}
            <motion.div
              animate={isDragging ? { scale: 1.1, rotate: 5 } : {}}
              className="text-[#FFD700]"
            >
              <Upload size={48} strokeWidth={2} />
            </motion.div>

            {/* Title */}
            <h3
              className="text-2xl md:text-3xl font-black italic uppercase text-[#E0E0E0]"
              style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
            >
              SIGNAL_HATCH
            </h3>

            {/* Subtitle */}
            <p className="text-sm md:text-base font-mono text-[#E0E0E0]/70 max-w-md">
              Drop unverified signal or click to browse
            </p>

            {/* Accepted Formats */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['MP3', 'WAV', 'OGG', 'M4A', 'AAC'].map((format) => (
                <span
                  key={format}
                  className="px-3 py-1 bg-[#111] border border-[#E0E0E0]/20 text-[10px] font-mono text-[#E0E0E0]/60 uppercase"
                >
                  {format}
                </span>
              ))}
            </div>

            {/* Processing Status */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-md mt-4"
                >
                  <div className="bg-[#111] border border-[#FFD700]/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileAudio size={16} className="text-[#FFD700]" />
                      <span className="text-xs font-mono text-[#FFD700] uppercase">
                        CRACKING_SIGNAL: {Math.round(processingProgress)}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-[#050505] border border-[#E0E0E0]/20">
                      <motion.div
                        className="h-full bg-[#FFD700]"
                        initial={{ width: 0 }}
                        animate={{ width: `${processingProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 mt-4 px-4 py-2 bg-[#1a0000] border border-red-500/50"
                >
                  <AlertCircle size={16} className="text-red-500" />
                  <span className="text-xs font-mono text-red-400">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tactical Border Accent */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#FFD700]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#FFD700]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#FFD700]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#FFD700]" />
      </motion.div>
    </div>
  );
}

