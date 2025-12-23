"use client";

import { GlitchText } from "@/components/GlitchText";
import { TrackList } from "@/components/TrackList";
import { useAudio } from "@/context/AudioContext";
import { Music2 } from "lucide-react";

export default function MusicPage() {
  const { currentTrack, isPlaying } = useAudio();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-graffiti mb-4 bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
              <GlitchText text="MUSIC LIBRARY" />
            </h1>
            <p className="text-foreground/60 font-industrial text-sm md:text-base tracking-wider">
              STREAMING • DOWNLOAD • SHARE
            </p>
          </div>

          {/* Now Playing Indicator */}
          {currentTrack && isPlaying && (
            <div className="mb-6 p-4 rounded-lg border-2 border-toxic-lime/30 bg-toxic-lime/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-toxic-lime">
                  <Music2 className="w-5 h-5 animate-pulse" />
                  <span className="font-industrial font-bold text-sm tracking-wider uppercase">
                    NOW PLAYING
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-industrial font-bold text-sm md:text-base truncate">
                    {currentTrack.title}
                  </div>
                  <div className="text-foreground/60 text-xs md:text-sm truncate">
                    {currentTrack.artist}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Track Library */}
          <TrackList featuredOnly={false} />
        </div>
      </section>
    </div>
  );
}


