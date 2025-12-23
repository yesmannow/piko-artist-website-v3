"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "./Tooltip";

interface PerformancePadsProps {
  onCueSet: (padIndex: number, time: number) => void;
  onCueJump: (time: number) => void;
  onCueClear: (padIndex: number) => void;
  getCurrentTime: () => number;
  helpText?: string;
}

export function PerformancePads({
  onCueSet,
  onCueJump,
  onCueClear,
  getCurrentTime,
  helpText,
}: PerformancePadsProps) {
  const [cuePoints, setCuePoints] = useState<Record<number, number>>({});

  const handlePadClick = (padIndex: number, e: React.MouseEvent) => {
    e.preventDefault();

    if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
      // Right-click or Ctrl+Click = Clear
      if (cuePoints[padIndex] !== undefined) {
        setCuePoints((prev) => {
          const newPoints = { ...prev };
          delete newPoints[padIndex];
          return newPoints;
        });
        onCueClear(padIndex);
      }
      return;
    }

    // Left-click
    if (cuePoints[padIndex] !== undefined) {
      // Pad is set - jump to cue point
      onCueJump(cuePoints[padIndex]);
    } else {
      // Pad is empty - set hot cue
      const currentTime = getCurrentTime();
      setCuePoints((prev) => ({
        ...prev,
        [padIndex]: currentTime,
      }));
      onCueSet(padIndex, currentTime);
    }
  };

  const padsContent = (
    <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
      {[0, 1, 2, 3].map((padIndex) => {
        const isSet = cuePoints[padIndex] !== undefined;
        return (
          <motion.button
            key={padIndex}
            onMouseDown={(e) => handlePadClick(padIndex, e)}
            onContextMenu={(e) => {
              e.preventDefault();
              handlePadClick(padIndex, { ...e, button: 2 } as any);
            }}
            className={`relative aspect-square rounded-lg border-2 transition-all ${
              isSet
                ? "bg-[#1a1a1a] border-[#ccff00]"
                : "bg-[#0a0a0a] border-gray-700 hover:border-gray-600"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: isSet
                ? `0 0 20px rgba(204, 255, 0, 0.4), inset 0 0 10px rgba(204, 255, 0, 0.1)`
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {/* Pad number */}
            <div
              className={`absolute top-1 left-1 text-xs font-barlow font-bold ${
                isSet ? "text-[#ccff00]" : "text-gray-500"
              }`}
            >
              {padIndex + 1}
            </div>

            {/* Glow effect when set */}
            {isSet && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: `radial-gradient(circle, rgba(204, 255, 0, 0.2) 0%, transparent 70%)`,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* Cue point indicator */}
            {isSet && (
              <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#ccff00]" />
            )}
          </motion.button>
        );
      })}
    </div>
  );

  if (helpText) {
    return <Tooltip content={helpText}>{padsContent}</Tooltip>;
  }

  return padsContent;
}

