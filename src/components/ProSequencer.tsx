"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Instrument {
  id: string;
  name: string;
  audioFile: string;
  color: "green" | "pink" | "cyan";
}

const instruments: Instrument[] = [
  { id: "kick", name: "Kick", audioFile: "/audio/samples/kick-drum-426037.mp3", color: "green" },
  { id: "snare", name: "Snare", audioFile: "/audio/samples/tr909-snare-drum-241413.mp3", color: "pink" },
  { id: "hihat", name: "Hi-Hat", audioFile: "/audio/samples/090241_chimbal-aberto-39488.mp3", color: "cyan" },
  { id: "bass", name: "Bass", audioFile: "/audio/samples/deep-808-230752.mp3", color: "green" },
  { id: "shaker", name: "Shaker", audioFile: "/audio/samples/shaker-drum-434902.mp3", color: "pink" },
  { id: "fx", name: "FX", audioFile: "/audio/samples/reverse-cymbal-riser-451412.mp3", color: "cyan" },
];

const STEPS = 16;

export function ProSequencer() {
  // State: [instrumentId][stepIndex] = boolean
  const [steps, setSteps] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {};
    instruments.forEach((inst) => {
      initial[inst.id] = new Array(STEPS).fill(false);
    });
    return initial;
  });

  const toggleStep = (instrumentId: string, stepIndex: number) => {
    setSteps((prev) => {
      const newSteps = { ...prev };
      newSteps[instrumentId] = [...newSteps[instrumentId]];
      newSteps[instrumentId][stepIndex] = !newSteps[instrumentId][stepIndex];
      return newSteps;
    });
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
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-graffiti mb-2 bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
          PRO SEQUENCER
        </h2>
        <p className="text-white/60 font-tag text-sm md:text-base">
          Click steps to build your pattern • Audio engine coming soon
        </p>
      </div>

      {/* Sequencer Grid */}
      <div className="bg-black/50 backdrop-blur-sm rounded-lg border-2 border-white/10 p-4 md:p-6">
        {/* Step Numbers Header */}
        <div className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 mb-4">
          <div className="text-xs md:text-sm font-tag text-white/40 text-center">
            Instrument
          </div>
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className="text-xs md:text-sm font-tag text-white/40 text-center"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Instrument Rows */}
        <div className="space-y-3">
          {instruments.map((instrument) => {
            const neonColor = getNeonColor(instrument.color);
            const instrumentSteps = steps[instrument.id] || [];

            return (
              <div
                key={instrument.id}
                className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 items-center"
              >
                {/* Instrument Label */}
                <div
                  className="font-tag text-sm md:text-base font-bold text-center px-2 py-2 rounded border-2"
                  style={{
                    borderColor: neonColor,
                    color: neonColor,
                    backgroundColor: `${neonColor}10`,
                  }}
                >
                  {instrument.name}
                </div>

                {/* Step Buttons */}
                {instrumentSteps.map((isActive, stepIndex) => (
                  <motion.button
                    key={stepIndex}
                    type="button"
                    onClick={() => toggleStep(instrument.id, stepIndex)}
                    className={`
                      aspect-square rounded
                      border-2 transition-all
                      ${isActive ? "scale-95" : "scale-100"}
                    `}
                    style={{
                      borderColor: isActive ? neonColor : "rgba(255, 255, 255, 0.2)",
                      backgroundColor: isActive ? `${neonColor}40` : "rgba(255, 255, 255, 0.05)",
                      boxShadow: isActive
                        ? `0 0 10px ${neonColor}, inset 0 0 10px ${neonColor}20`
                        : "none",
                    }}
                    whileHover={{
                      scale: 1.1,
                      borderColor: neonColor,
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isActive && (
                      <motion.div
                        className="w-full h-full rounded"
                        style={{
                          backgroundColor: neonColor,
                          opacity: 0.6,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Controls Placeholder */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-4">
          <motion.button
            className="px-6 py-3 bg-neon-green/20 border-2 border-neon-green/50 text-neon-green font-tag rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled
          >
            ▶ Play
          </motion.button>
          <motion.button
            className="px-6 py-3 bg-neon-pink/20 border-2 border-neon-pink/50 text-neon-pink font-tag rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const cleared: Record<string, boolean[]> = {};
              instruments.forEach((inst) => {
                cleared[inst.id] = new Array(STEPS).fill(false);
              });
              setSteps(cleared);
            }}
          >
            Clear All
          </motion.button>
        </div>
      </div>
    </div>
  );
}

