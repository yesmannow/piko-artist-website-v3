"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Pad {
  key: string;
  soundName: string;
  audioFile: string;
  color: "green" | "pink" | "cyan";
}

const pads: Pad[] = [
  { key: "Q", soundName: "Kick", audioFile: "/audio/samples/kick-drum-426037.mp3", color: "green" },
  { key: "W", soundName: "Snare", audioFile: "/audio/samples/tr909-snare-drum-241413.mp3", color: "pink" },
  { key: "E", soundName: "Hi-Hat", audioFile: "/audio/samples/090241_chimbal-aberto-39488.mp3", color: "cyan" },
  { key: "A", soundName: "Bass", audioFile: "/audio/samples/deep-808-230752.mp3", color: "green" },
  { key: "S", soundName: "Shaker", audioFile: "/audio/samples/shaker-drum-434902.mp3", color: "pink" },
  { key: "D", soundName: "FX", audioFile: "/audio/samples/reverse-cymbal-riser-451412.mp3", color: "cyan" },
];

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

  const getNeonColor = (color: "green" | "pink" | "cyan") => {
    switch (color) {
      case "green":
        return "hsl(var(--neon-green))";
      case "pink":
        return "hsl(var(--neon-pink))";
      case "cyan":
        return "hsl(var(--neon-cyan))";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {pads.map((pad) => {
          const isActive = activePad === pad.key;
          const neonColor = getNeonColor(pad.color);

          return (
            <motion.button
              key={pad.key}
              type="button"
              onClick={() => playSound(pad.key)}
              className={`
                relative aspect-square
                bg-black border-2 rounded-lg
                flex flex-col items-center justify-center
                transition-all duration-150
                ${isActive ? "scale-95" : "scale-100"}
              `}
              style={{
                borderColor: isActive ? neonColor : "rgba(255, 255, 255, 0.2)",
                boxShadow: isActive
                  ? `0 0 20px ${neonColor}, 0 0 40px ${neonColor}, 0 0 60px ${neonColor}`
                  : "none",
                backgroundColor: isActive ? `${neonColor}20` : "transparent",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Key Label */}
              <div
                className="text-2xl md:text-3xl font-bold font-tag mb-2"
                style={{
                  color: isActive ? neonColor : "rgba(255, 255, 255, 0.9)",
                  textShadow: isActive
                    ? `0 0 10px ${neonColor}, 0 0 20px ${neonColor}`
                    : "none",
                }}
              >
                {pad.key}
              </div>

              {/* Sound Name */}
              <div
                className="text-xs md:text-sm font-tag uppercase tracking-wider"
                style={{
                  color: isActive ? neonColor : "rgba(255, 255, 255, 0.6)",
                }}
              >
                {pad.soundName}
              </div>

              {/* Active Flash Overlay */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundColor: neonColor,
                    opacity: 0.3,
                  }}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* LAUNCH PRO STUDIO Button */}
      <div className="mt-8 md:mt-12 flex justify-center">
        <Link href="/beatmaker">
          <motion.button
            className="px-8 py-4 md:px-12 md:py-6 bg-gradient-to-r from-neon-pink via-neon-green to-neon-cyan text-black font-tag text-lg md:text-xl font-bold rounded-lg relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: "0 0 30px hsl(var(--neon-green)), 0 0 60px hsl(var(--neon-pink))",
            }}
          >
            <span className="relative z-10">LAUNCH PRO STUDIO</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-neon-green via-neon-pink to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}

