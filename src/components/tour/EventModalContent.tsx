"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, ExternalLink, Maximize2 } from "lucide-react";
import { Event } from "@/lib/events";
import Image from "next/image";
import { BackdropFX } from "./BackdropFX";
import { PosterModal } from "./PosterModal";

interface EventModalContentProps {
  event: Event;
  onClose: () => void;
  onVideoElementReady?: (element: HTMLVideoElement | null) => void;
}

export function EventModalContent({ event, onClose, onVideoElementReady }: EventModalContentProps) {
  const [isPosterFullscreen, setIsPosterFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if vhsVideo is YouTube ID or local URL
  const isYouTube = event.vhsVideo?.startsWith("http") === false && event.vhsVideo?.length === 11;
  const youtubeEmbedUrl = isYouTube
    ? `https://www.youtube.com/embed/${event.vhsVideo}?autoplay=0&modestbranding=1&rel=0`
    : null;

  return (
    <>
      {/* Enhanced Poster Modal */}
      <PosterModal
        event={event}
        isOpen={isPosterFullscreen}
        onClose={() => setIsPosterFullscreen(false)}
        onBackToEvent={() => setIsPosterFullscreen(false)}
      />

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 h-full">
        {/* Left: VHS Video */}
        <div className="relative">
          <div className="sticky top-0">
            <div className="relative aspect-video bg-black border-2 border-black shadow-hard overflow-hidden">
              {/* VHS Video Container */}
              {youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${event.title} video`}
                />
              ) : event.vhsVideo ? (
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    onVideoElementReady?.(el);
                  }}
                  src={event.vhsVideo}
                  className="absolute inset-0 w-full h-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-industrial text-foreground/50 text-sm">No video available</p>
                </div>
              )}

              {/* VHS Scanlines Overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-10 opacity-30"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 0, 0.1) 2px,
                    rgba(0, 255, 0, 0.1) 4px
                  )`,
                  mixBlendMode: "screen",
                }}
              />

              {/* VHS Noise Overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-10 opacity-10 vhs-noise"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                  mixBlendMode: "overlay",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Content Blocks */}
        <div className="space-y-6 overflow-y-auto">
          {/* Location + Time */}
          <div className="bg-concrete border-2 border-black p-4 shadow-hard">
            <h3 className="font-header text-lg text-foreground mb-3">📍 LOCATION & TIME</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground/80">
                <MapPin className="w-4 h-4" />
                <span className="font-industrial font-bold uppercase tracking-wider">{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <Calendar className="w-4 h-4" />
                <span className="font-industrial font-bold">
                  {event.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {event.timezone && (
                <div className="text-xs text-foreground/60 font-industrial">
                  Timezone: {event.timezone}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Link */}
          {event.ticketLink && event.status === "upcoming" && (
            <div className="bg-concrete border-2 border-black p-4 shadow-hard">
              <h3 className="font-header text-lg text-foreground mb-3">🎟 TICKETS</h3>
              <a
                href={event.ticketLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-toxic-lime text-black font-header font-bold border-2 border-black hover:bg-white transition-colors shadow-hard"
              >
                Get Tickets
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Press Logos */}
          {event.pressLinks && event.pressLinks.length > 0 && (
            <div className="bg-concrete border-2 border-black p-4 shadow-hard">
              <h3 className="font-header text-lg text-foreground mb-3">📰 PRESS COVERAGE</h3>
              <div className="flex flex-wrap gap-4">
                {event.pressLinks.map((press, index) => (
                  <a
                    key={index}
                    href={press.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 border border-zinc-800 hover:border-toxic-lime transition-colors"
                  >
                    {press.logo ? (
                      <Image
                        src={press.logo}
                        alt={press.name}
                        width={80}
                        height={40}
                        className="object-contain max-h-10"
                      />
                    ) : (
                      <span className="font-industrial text-xs text-foreground/70">{press.name}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recap Clips */}
          {event.recapClips && event.recapClips.length > 0 && (
            <div className="bg-concrete border-2 border-black p-4 shadow-hard">
              <h3 className="font-header text-lg text-foreground mb-3">📹 RECAP CLIPS</h3>
              <div className="grid grid-cols-2 gap-3">
                {event.recapClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="relative aspect-video bg-black border-2 border-black overflow-hidden cursor-pointer hover:border-toxic-lime transition-colors group"
                  >
                    {clip.thumbnail ? (
                      <Image
                        src={clip.thumbnail}
                        alt={clip.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-industrial text-xs text-foreground/50">{clip.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-header text-sm text-white">▶</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Poster Fullscreen Toggle */}
          {event.poster && (
            <div className="bg-concrete border-2 border-black p-4 shadow-hard">
              <button
                onClick={() => setIsPosterFullscreen(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-spray-magenta/20 text-spray-magenta border-2 border-spray-magenta hover:bg-spray-magenta hover:text-black transition-colors font-header font-bold"
              >
                <Maximize2 className="w-4 h-4" />
                VIEW FULL POSTER
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

