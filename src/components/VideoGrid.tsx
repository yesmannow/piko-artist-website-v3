"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";

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
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neon-pink scrollbar-track-muted"
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
            className="group flex-shrink-0 w-[400px] snap-center"
          >
            {/* CRT Video Wrapper */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg hover:shadow-neon-green/50 transition-shadow">
              {/* Video iframe */}
              <iframe
                className="w-full h-full relative z-10"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
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

      {/* CRT Styles */}
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
