"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface EmbedPlayerProps {
  title: string;
  audioUrl: string;
  coverArt: string;
}

export function EmbedPlayer({ title, audioUrl, coverArt }: EmbedPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      await audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10">
        <Image
          src={coverArt}
          alt={title}
          fill
          className="object-cover"
          sizes="320px"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">
            Piko Mix
          </p>
          <p className="text-lg font-semibold">{title}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="rounded-full bg-safety-yellow px-4 py-2 text-black font-bold uppercase tracking-[0.18em] flex items-center gap-2"
        >
          {playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
    </div>
  );
}
