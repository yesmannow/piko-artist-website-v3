"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Rewind, FastForward } from "lucide-react";
import { useEventStore } from "@/stores/useEventStore";
import { Event } from "@/lib/events";
import { EventModalContent } from "./EventModalContent";
import { BackdropFX } from "./BackdropFX";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import { AudioReactiveOverlay } from "@/components/visual/AudioReactiveOverlay";

// EventModal component that receives events
interface EventModalWrapperProps {
  events: Event[];
}

export function EventModalWrapper({ events }: EventModalWrapperProps) {
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const setSelectedEvent = useEventStore((state) => state.setSelectedEvent);
  const modalRef = useScrollVisibility(100);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEvent) {
        setSelectedEvent(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedEvent, setSelectedEvent]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedEvent]);

  if (!selectedEvent) return null;

  const currentIndex = events.findIndex((e) => e.id === selectedEvent.id);
  const prevEvent = currentIndex > 0 ? events[currentIndex - 1] : null;
  const nextEvent = currentIndex < events.length - 1 ? events[currentIndex + 1] : null;

  const handlePrev = () => {
    if (prevEvent) setSelectedEvent(prevEvent);
  };

  const handleNext = () => {
    if (nextEvent) setSelectedEvent(nextEvent);
  };

  return (
    <AnimatePresence>
      {selectedEvent && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CRT Monitor Frame */}
            <div className="relative w-full h-full bg-concrete border-4 border-black shadow-hard">
              {/* Backdrop FX */}
              <BackdropFX className="z-10" />

              {/* Audio-Reactive Overlay */}
              {selectedEvent?.audioViz && (
                <AudioReactiveOverlay
                  videoElement={videoElement}
                  enabled={selectedEvent.audioViz}
                  className="z-15"
                />
              )}

              {/* CRT Flicker Effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 bg-white crt-flicker"
                animate={{
                  opacity: [0, 0.02, 0],
                }}
                transition={{
                  duration: 0.1,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2 + 1,
                }}
              />

              {/* Content */}
              <div ref={modalRef} className="relative z-0 p-4 md:p-8 lg:p-12 h-full overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 z-40 w-10 h-10 bg-spray-magenta border-2 border-black text-white font-header font-bold hover:bg-spray-magenta/80 transition-colors flex items-center justify-center shadow-hard"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Navigation Buttons */}
                <div className="absolute top-1/2 -translate-y-1/2 left-4 z-40 flex flex-col gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={!prevEvent}
                    className="w-12 h-12 bg-concrete border-2 border-black text-foreground font-header font-bold hover:bg-toxic-lime hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-hard"
                    aria-label="Previous event"
                  >
                    <Rewind className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!nextEvent}
                    className="w-12 h-12 bg-concrete border-2 border-black text-foreground font-header font-bold hover:bg-toxic-lime hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-hard"
                    aria-label="Next event"
                  >
                    <FastForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-header text-foreground mb-4 leading-tight">
                    {selectedEvent.title}
                  </h2>
                  <div
                    className={`inline-block px-3 py-1 rounded border-2 border-black text-xs font-header font-bold ${
                      selectedEvent.status === "upcoming"
                        ? "bg-safety-orange text-black"
                        : "bg-tape-gray text-black"
                    }`}
                  >
                    {selectedEvent.status === "upcoming" ? "UPCOMING" : "PAST"}
                  </div>
                </div>

                {/* Event Modal Content */}
                <EventModalContent
                  event={selectedEvent}
                  onVideoElementReady={setVideoElement}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

