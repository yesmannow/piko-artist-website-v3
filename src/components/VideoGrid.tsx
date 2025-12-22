"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
}

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neon-pink scrollbar-track-muted px-4 md:px-0"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--neon-pink)) hsl(var(--muted))",
        }}
      >
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group flex-shrink-0 w-[280px] md:w-[400px] snap-center"
          >
            {/* CRT Video Wrapper with VCR Glitch Effect */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg hover:shadow-neon-green/50 transition-shadow vcr-glitch">
              {/* Video iframe */}
              <iframe
                className="w-full h-full relative z-10 vcr-iframe"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* RGB Split Glitch Overlays using CSS filters */}
              <div className="absolute inset-0 pointer-events-none z-[12] vcr-red-layer" />
              <div className="absolute inset-0 pointer-events-none z-[13] vcr-green-layer" />
              <div className="absolute inset-0 pointer-events-none z-[14] vcr-blue-layer" />

              {/* Drip Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none z-[15]">
                <Image
                  src="/images/overlays/drip-frame.png"
                  alt="Drip Frame"
                  fill
                  className="object-cover opacity-80"
                />
              </div>

              {/* CRT Scanline Overlay */}
              <div className="crt-scanlines absolute inset-0 pointer-events-none z-20" />

              {/* CRT Flicker Effect */}
              <div className="crt-flicker absolute inset-0 pointer-events-none z-20" />

              {/* Retro border glow */}
              <div className="absolute inset-0 border-2 border-neon-green/30 rounded-lg pointer-events-none z-30 group-hover:border-neon-green/60 transition-colors" />
            </div>

            {/* Title with graffiti font */}
            <h3 className="mt-4 font-tag text-xl text-neon-pink group-hover:text-neon-green transition-colors">
              {video.title}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {videos.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-muted-foreground/30 hover:bg-neon-pink transition-colors cursor-pointer"
          />
        ))}
      </div>

      {/* CRT & VCR Glitch Styles */}
      <style jsx>{`
        .crt-scanlines {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          );
          animation: scanlines 8s linear infinite;
        }

        .crt-flicker {
          background: rgba(255, 255, 255, 0.02);
          animation: flicker 0.15s infinite;
        }

        /* VCR Glitch Effect - RGB Split */
        .vcr-glitch:hover .vcr-iframe {
          animation: glitch-shift 0.3s infinite;
        }

        .vcr-red-layer {
          background: linear-gradient(90deg, transparent 0%, rgba(255, 0, 0, 0.3) 50%, transparent 100%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: glitch-red 0.3s infinite;
        }

        .vcr-green-layer {
          background: linear-gradient(90deg, transparent 0%, rgba(0, 255, 0, 0.3) 50%, transparent 100%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: glitch-green 0.3s infinite;
        }

        .vcr-blue-layer {
          background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 255, 0.3) 50%, transparent 100%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: glitch-blue 0.3s infinite;
        }

        .vcr-glitch:hover .vcr-red-layer,
        .vcr-glitch:hover .vcr-green-layer,
        .vcr-glitch:hover .vcr-blue-layer {
          opacity: 1;
        }

        @keyframes scanlines {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 100%;
          }
        }

        @keyframes flicker {
          0% {
            opacity: 0.95;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.98;
          }
        }

        @keyframes glitch-shift {
          0%, 100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-2px);
          }
          40% {
            transform: translateX(2px);
          }
          60% {
            transform: translateX(-1px);
          }
          80% {
            transform: translateX(1px);
          }
        }

        @keyframes glitch-red {
          0%, 100% {
            transform: translateX(-2px) translateY(0) scaleY(1);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translateX(-4px) translateY(-1px) scaleY(1.02);
            clip-path: inset(1% 0 0 0);
          }
          50% {
            transform: translateX(-1px) translateY(1px) scaleY(0.98);
            clip-path: inset(0 0 1% 0);
          }
          75% {
            transform: translateX(-3px) translateY(0) scaleY(1.01);
            clip-path: inset(0.5% 0 0.5% 0);
          }
        }

        @keyframes glitch-green {
          0%, 100% {
            transform: translateX(2px) translateY(0) scaleY(1);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translateX(4px) translateY(1px) scaleY(0.98);
            clip-path: inset(0 0 1% 0);
          }
          50% {
            transform: translateX(1px) translateY(-1px) scaleY(1.02);
            clip-path: inset(1% 0 0 0);
          }
          75% {
            transform: translateX(3px) translateY(0) scaleY(1.01);
            clip-path: inset(0.5% 0 0.5% 0);
          }
        }

        @keyframes glitch-blue {
          0%, 100% {
            transform: translateX(0) translateY(0) scaleY(1);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translateX(1px) translateY(-1px) scaleY(1.01);
            clip-path: inset(0.5% 0 0 0);
          }
          50% {
            transform: translateX(-1px) translateY(1px) scaleY(0.99);
            clip-path: inset(0 0 0.5% 0);
          }
          75% {
            transform: translateX(0) translateY(0) scaleY(1);
            clip-path: inset(0.25% 0 0.25% 0);
          }
        }

        /* Custom scrollbar styling */
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--neon-pink));
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--neon-green));
        }
      `}</style>
    </div>
  );
}
