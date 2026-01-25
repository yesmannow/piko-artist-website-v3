"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle?: string;
}

export function VideoModal({ isOpen, onClose, videoId, videoTitle }: VideoModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Scroll to top and handle ESC key when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Scroll to top of page when modal opens to ensure video is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Reset loading state and set iframe src when modal opens or video changes
  useEffect(() => {
    if (isOpen && iframeRef.current) {
      setIsLoading(true);
      // Set credentialless attribute for COEP compatibility
      iframeRef.current.setAttribute('credentialless', 'true');
      // Set iframe src to trigger loading
      iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
      
      // Fallback timeout in case onLoad doesn't fire (10 seconds)
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen, videoId]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Auto-cleanup: Completely unmount iframe when modal closes to stop audio/network
  useEffect(() => {
    if (!isOpen && iframeRef.current) {
      // Remove src to stop playback and network activity
      iframeRef.current.src = "";
      setIsLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Glassmorphism Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-3xl bg-black/60"
            onClick={onClose}
          />

          {/* Glassmorphism Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-5xl aspect-video bg-white/5 border border-white/20 rounded-lg overflow-hidden shadow-2xl"
            style={{
              boxShadow: "0 0 40px rgba(255, 255, 255, 0.1), 0 0 80px rgba(255, 255, 255, 0.05)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full border border-white/20 transition-colors backdrop-blur-sm"
              aria-label="Close video modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Video Title (if provided) */}
            {videoTitle && (
              <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded border border-white/20">
                <h3 className="text-white text-sm md:text-base font-bold uppercase tracking-tight line-clamp-2 max-w-md">
                  {videoTitle}
                </h3>
              </div>
            )}

            {/* Loading Skeleton with fade-out animation */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: isLoading ? 1 : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A] pointer-events-none"
              style={{ display: isLoading ? "flex" : "none" }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <p className="text-white/60 text-sm uppercase tracking-wider">Loading video...</p>
              </div>
            </motion.div>

            {/* YouTube iframe with nocookie domain and credentialless for COEP compatibility */}
            {isOpen && (
              <iframe
                key={videoId}
                ref={iframeRef}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleIframeLoad}
                style={{ 
                  opacity: isLoading ? 0 : 1,
                  visibility: isLoading ? "hidden" : "visible",
                  transition: "opacity 0.3s ease-in-out"
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
