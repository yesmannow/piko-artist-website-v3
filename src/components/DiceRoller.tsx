"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface DiceRollerProps {
  onRollComplete: (result: number) => void;
}

export function DiceRoller({ onRollComplete }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentFace, setCurrentFace] = useState(1);

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);
    
    // Generate random result (1-6)
    const result = Math.floor(Math.random() * 6) + 1;
    
    // Simulate rolling with multiple face changes
    let count = 0;
    const interval = setInterval(() => {
      setCurrentFace(Math.floor(Math.random() * 6) + 1);
      count++;
      
      if (count > 10) {
        clearInterval(interval);
        setCurrentFace(result);
        setIsRolling(false);
        onRollComplete(result);
      }
    }, 100);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.button
        onClick={rollDice}
        disabled={isRolling}
        className="relative group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-neon-pink to-neon-green rounded-lg shadow-lg flex items-center justify-center text-4xl font-bold text-background relative overflow-hidden"
          animate={{
            rotateX: isRolling ? [0, 360, 720, 1080] : 0,
            rotateY: isRolling ? [0, 360, 720, 1080] : 0,
            rotateZ: isRolling ? [0, 180, 360, 540] : 0,
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Dice number */}
          <span className="z-10 relative drop-shadow-lg">{currentFace}</span>
          
          {/* Neon glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/50 to-neon-green/50 blur-sm" />
        </motion.div>

        {/* Hover effect text */}
        <motion.p
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-tag text-neon-green whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isRolling ? "Rolling..." : "Click to Roll"}
        </motion.p>
      </motion.button>

      {/* Street art style decorative elements */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div
            key={num}
            className={`w-2 h-2 rounded-full transition-all ${
              currentFace === num
                ? "bg-neon-pink scale-125"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
