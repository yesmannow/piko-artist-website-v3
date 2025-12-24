"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ArrowLeft } from "lucide-react";
import { Event } from "@/lib/events";
import Image from "next/image";
import { useMouseParallax } from "@/hooks/useMouseParallax";

interface PosterModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onBackToEvent: () => void;
}

export function PosterModal({ event, isOpen, onClose, onBackToEvent }: PosterModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const parallax = useMouseParallax(containerRef as React.RefObject<HTMLElement>, { intensity: 0.03, tiltIntensity: 3 });

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleDownload = () => {
    const downloadUrl = event.posterDL || event.poster;
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${event.title}-poster.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!event.poster) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[70]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-[71] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CRT Glow Border */}
            <div className="absolute inset-0 border-4 border-toxic-lime shadow-[0_0_40px_rgba(204,255,0,0.5),inset_0_0_40px_rgba(204,255,0,0.1)] pointer-events-none" />

            {/* Content Container */}
            <div
              ref={containerRef}
              className="relative w-full h-full max-w-7xl max-h-[90vh] bg-black border-4 border-toxic-lime p-4 md:p-8"
              style={{
                transform: `translate(${parallax.x}px, ${parallax.y}px) rotateX(${parallax.rotateX}deg) rotateY(${parallax.rotateY}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 0.1s ease-out",
              }}
            >
              {/* Poster Image */}
              <div
                className={`relative w-full h-full transition-transform duration-300 ${
                  isZoomed ? "scale-150" : "scale-100"
                }`}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
              >
                <Image
                  src={event.poster}
                  alt={`${event.title} event poster - ${event.location} on ${event.date.toLocaleDateString()}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />

                {/* Noise Distortion Layer on Hover */}
                {isZoomed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                      mixBlendMode: "overlay",
                    }}
                  />
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-12 h-12 bg-spray-magenta border-2 border-black text-white font-header font-bold hover:bg-spray-magenta/80 transition-colors flex items-center justify-center shadow-hard"
                aria-label="Close poster view"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Download Button */}
              {(event.posterDL || event.poster) && (
                <button
                  onClick={handleDownload}
                  className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-6 py-3 bg-toxic-lime text-black font-header font-bold border-2 border-black hover:bg-white transition-colors shadow-hard"
                  aria-label="Download poster"
                >
                  <Download className="w-5 h-5" />
                  DOWNLOAD POSTER
                </button>
              )}

              {/* Back to Event Button */}
              <motion.button
                onClick={onBackToEvent}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-6 py-3 bg-concrete border-2 border-black text-foreground font-header font-bold hover:bg-toxic-lime hover:text-black transition-colors shadow-hard"
                aria-label="Back to event details"
              >
                <ArrowLeft className="w-5 h-5" />
                BACK TO EVENT
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

