"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface TerminalLogProps {
  logs: string[];
  maxLines?: number;
  className?: string;
}

/**
 * TerminalLog - Real-time system feedback with typewriter effect
 *
 * Displays system logs with a staggered typewriter animation.
 * Each character appears one by one, creating a "hacker terminal" aesthetic.
 *
 * Features:
 * - Typewriter effect using staggerChildren
 * - Blinking cursor at end of current line
 * - Monospaced font with green/amber text
 * - Auto-scrolls to latest log
 * - Limits displayed lines for performance
 */
export function TerminalLog({ logs, maxLines = 10, className = "" }: TerminalLogProps) {
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Update displayed logs (limit to maxLines)
  useEffect(() => {
    setDisplayedLogs(logs.slice(-maxLines));
  }, [logs, maxLines]);

  // Blinking cursor animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Character animation variants
  const characterVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  // Container variants for stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02, // Delay between each character
      },
    },
  };

  return (
    <div
      className={`bg-black/90 backdrop-blur-sm border-2 border-toxic-lime/30 p-4 font-mono text-xs overflow-y-auto max-h-64 ${className}`}
      style={{
        boxShadow: "inset 0 0 20px rgba(204, 255, 0, 0.1)",
      }}
    >
      <AnimatePresence mode="popLayout">
        {displayedLogs.map((log, index) => {
          const isLastLine = index === displayedLogs.length - 1;
          const characters = log.split("");

          return (
            <motion.div
              key={`${log}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-1"
            >
              <motion.span
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="text-toxic-lime"
              >
                {characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    variants={characterVariants}
                    className={char === " " ? "inline-block w-2" : ""}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.span>

              {/* Blinking cursor on last line */}
              {isLastLine && (
                <motion.span
                  animate={{ opacity: cursorVisible ? 1 : 0 }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-2 text-toxic-lime ml-1"
                >
                  _
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * useTerminalLogs - Hook for managing terminal log messages
 *
 * Provides a simple interface for adding logs to the terminal.
 */
export function useTerminalLogs() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    // Support both prefixed messages (e.g., "SYSTEM_CORE: ...") and plain messages
    const logMessage = message.includes(":") ? `> ${message}` : `> SYSTEM: ${message}`;
    setLogs((prev) => [...prev, logMessage]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return {
    logs,
    addLog,
    clearLogs,
  };
}

