"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function GlitchText({ text, className = "", delay = 0 }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?~";

  useEffect(() => {
    if (!isGlitching) return;

    let currentIteration = 0;
    const maxIterations = text.length * 2; // Number of cycles before resolving

    const interval = setInterval(() => {
      setDisplayText((prev) =>
        prev
          .split("")
          .map((char, index) => {
            // Gradually resolve characters from left to right
            if (index < currentIteration / 2) {
              return text[index];
            }

            // Scramble remaining characters
            if (char !== " ") {
              return glitchChars[Math.floor(Math.random() * glitchChars.length)];
            }

            return char;
          })
          .join("")
      );

      currentIteration++;

      if (currentIteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsGlitching(false);
      }
    }, 50); // Speed of scrambling

    return () => clearInterval(interval);
  }, [isGlitching, text]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
        delay,
      }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        // Trigger glitch effect when it enters viewport
        setTimeout(() => setIsGlitching(true), delay * 1000);
      }}
      className={`inline-block ${className}`}
    >
      {displayText}
    </motion.span>
  );
}

