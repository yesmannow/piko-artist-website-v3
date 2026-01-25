"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface StudioMonitorProps {
  logs: string[];
  maxLines?: number;
  className?: string;
}

/**
 * StudioMonitor - Real-time studio status display with smooth fade effects
 *
 * Replaces TerminalLog with a high-end, cinematic aesthetic.
 * Features smooth "Status Fade" animations instead of typewriter effects.
 *
 * Features:
 * - Smooth fade-in/fade-out for messages
 * - No typewriter effect (instant display)
 * - No blinking cursor
 * - Glassmorphism styling with gold accents
 * - STUDIO_CORE or V3_CORE prefix for professional console feedback
 */
export function StudioMonitor({ logs, maxLines = 10, className = "" }: StudioMonitorProps) {
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);

  // Update displayed logs (limit to maxLines)
  useEffect(() => {
    setDisplayedLogs(logs.slice(-maxLines));
  }, [logs, maxLines]);

  return (
    <div className={`relative ${className}`}>
      {/* Heavy Bolted Industrial Bezel - Matte Black with Chrome Hardware */}
      <div
        className="relative bg-[#000000] border-4 border-[#E0E0E0] p-6 overflow-y-auto max-h-64"
        style={{
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 8px 8px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Chrome Bolts - Top Corners */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black" style={{ clipPath: "circle(50%)" }} />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black" style={{ clipPath: "circle(50%)" }} />
        {/* Chrome Bolts - Bottom Corners */}
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black" style={{ clipPath: "circle(50%)" }} />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black" style={{ clipPath: "circle(50%)" }} />

        {/* Header - Lexend Black Italic */}
        <div className="mb-4 pb-2 border-b-2 border-[#E0E0E0]/20">
          <h3
            className="text-sm font-black italic uppercase text-[#FFD700]"
            style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
          >
            V3 ENGINE STATUS
          </h3>
        </div>

        {/* Status Logs - Monospace (JetBrains Mono style) */}
        <div className="font-mono text-[11px] space-y-1">
          <AnimatePresence mode="popLayout">
            {displayedLogs.map((log, index) => {
              // Remove > prefix and normalize to V3 professional studio language
              // Remove all hacker/game vernacular, use professional studio operations
              const cleanLog = log
                .replace(/^>\s*/, "")
                .replace(/SYSTEM_CORE/g, "STUDIO_CORE")
                .replace(/NEURAL_ENGINE/g, "STUDIO_CORE")
                .replace(/HACK|CRACK|BREACH|INTRUSION|EXPLOIT/gi, "PROCESS")
                .replace(/VIRUS|MALWARE|TROJAN/gi, "SIGNAL")
                .replace(/TERMINAL|CONSOLE|COMMAND/gi, "STUDIO")
                .replace(/BOOT|INIT|LOAD/gi, "INITIALIZE")
                .replace(/ERROR|FAIL|CRASH/gi, "STATUS")
                .replace(/SUCCESS|COMPLETE/gi, "OPERATION_COMPLETE");

              // Determine text color: Safety Yellow for status, White for info
              const isStatus = cleanLog.includes("STUDIO_ENGINE:") || cleanLog.includes("STUDIO_CORE:");
              const textColor = isStatus ? "#FFD700" : "#FFFFFF";

              return (
                <motion.div
                  key={`${cleanLog}-${index}`}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mb-1"
                  style={{
                    color: textColor,
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    letterSpacing: "0.05em",
                  }}
                >
                  {cleanLog}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * useStudioMonitor - Hook for managing studio monitor messages
 *
 * Provides a simple interface for adding logs to the studio monitor.
 */
export function useStudioMonitor() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    // Support both prefixed messages (e.g., "STUDIO_CORE: ...") and plain messages
    const logMessage = message.includes(":") ? message : `STUDIO_CORE: ${message}`;
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
