"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Pad {
  key: string;
  soundName: string;
  audioFile: string;
  color: "spray-magenta" | "toxic-lime" | "safety-orange";
}

const pads: Pad[] = [
  { key: "Q", soundName: "Kick", audioFile: "/audio/samples/kick-drum-426037.mp3", color: "toxic-lime" },
  { key: "W", soundName: "Snare", audioFile: "/audio/samples/tr909-snare-drum-241413.mp3", color: "spray-magenta" },
  { key: "E", soundName: "Hi-Hat", audioFile: "/audio/samples/090241_chimbal-aberto-39488.mp3", color: "safety-orange" },
  { key: "A", soundName: "Bass", audioFile: "/audio/samples/deep-808-230752.mp3", color: "toxic-lime" },
  { key: "S", soundName: "Shaker", audioFile: "/audio/samples/shaker-drum-434902.mp3", color: "spray-magenta" },
  { key: "D", soundName: "FX", audioFile: "/audio/samples/reverse-cymbal-riser-451412.mp3", color: "safety-orange" },
];

const getColorValue = (color: "spray-magenta" | "toxic-lime" | "safety-orange") => {
  switch (color) {
    case "spray-magenta":
      return "#ff0099";
    case "toxic-lime":
      return "#ccff00";
    case "safety-orange":
      return "#ff6600";
  }
};

export function BeatMakerTeaser() {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [activePad, setActivePad] = useState<string | null>(null);

  // Preload all audio files
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;

    pads.forEach((pad) => {
      const audio = new Audio(pad.audioFile);
      audio.preload = "auto";
      currentAudioRefs[pad.key] = audio;
    });

    return () => {
      // Cleanup
      Object.values(currentAudioRefs).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  // Handle keyboard presses
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const pad = pads.find((p) => p.key === key);
      if (pad) {
        playSound(pad.key);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const playSound = (key: string) => {
    const audio = audioRefs.current[key];
    if (audio) {
      // Reset to start for instant playback
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.error("Error playing sound:", err);
      });

      // Flash effect
      setActivePad(key);
      setTimeout(() => setActivePad(null), 150);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4" style={{ perspective: "1200px" }}>
      {/* 3D-Tilted MPC Container */}
      <motion.div
        className="relative bg-zinc-900 p-6 md:p-8 border-2 border-black shadow-hard"
        style={{
          transform: "rotateX(20deg) rotateZ(-5deg)",
          transformStyle: "preserve-3d",
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Noise Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />

        {/* Screws in corners */}
        {[
          { top: "8px", left: "8px" },
          { top: "8px", right: "8px" },
          { bottom: "8px", left: "8px" },
          { bottom: "8px", right: "8px" },
        ].map((position, idx) => (
          <div
            key={idx}
            className="absolute w-4 h-4 rounded-full bg-zinc-700 border border-black shadow-inner"
            style={position}
          >
            <div className="absolute inset-0.5 border-t border-l border-zinc-500 rounded-full" />
          </div>
        ))}

        {/* Pad Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 relative z-10">
          {pads.map((pad) => {
            const isActive = activePad === pad.key;
            const colorValue = getColorValue(pad.color);

            return (
              <motion.button
                key={pad.key}
                type="button"
                onClick={() => playSound(pad.key)}
                className="relative aspect-square bg-zinc-800 border-2 border-black flex flex-col items-center justify-center transition-all"
                style={{
                  boxShadow: isActive
                    ? `2px 2px 0px 0px rgba(0,0,0,1), 0 0 20px ${colorValue}`
                    : "2px 2px 0px 0px rgba(0,0,0,1)",
                  backgroundColor: isActive ? colorValue : "#27272a",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Key Label */}
                <div
                  className="text-xl md:text-2xl font-header font-bold mb-1"
                  style={{
                    color: isActive ? "#000" : "#fff",
                  }}
                >
                  {pad.key}
                </div>

                {/* Sound Name */}
                <div
                  className="text-xs font-tag uppercase tracking-wider"
                  style={{
                    color: isActive ? "#000" : "#a1a1aa",
                  }}
                >
                  {pad.soundName}
                </div>

                {/* Active Flash Overlay */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: colorValue,
                      opacity: 0.5,
                    }}
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Caution Tape Button */}
        <Link href="/beatmaker" className="block mt-6 md:mt-8">
          <motion.button
            className="w-full py-4 md:py-5 font-header text-lg md:text-xl font-bold text-black border-2 border-black relative overflow-hidden"
            style={{
              background: "repeating-linear-gradient(45deg, #fbbf24 0%, #fbbf24 10%, #000 10%, #000 20%)",
              backgroundSize: "20px 20px",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 bg-yellow-400 px-4 py-2 inline-block">
              LAUNCH PRO STUDIO
            </span>
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
