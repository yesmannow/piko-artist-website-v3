"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "./Tooltip";

interface PerformancePadsProps {
  onCueSet: (padIndex: number, time: number) => void;
  onCueJump: (time: number) => void;
  onCueClear: (padIndex: number) => void;
  getCurrentTime: () => number;
  helpText?: string;
  numPads?: number; // Number of pads (default 8, can be 4 for mobile)
}

export function PerformancePads({
  onCueSet,
  onCueJump,
  onCueClear,
  getCurrentTime,
  helpText,
  numPads = 8,
}: PerformancePadsProps) {
  const [cuePoints, setCuePoints] = useState<Record<number, number>>({});
  const longPressTimerRef = useRef<Record<number, NodeJS.Timeout>>({});
  const longPressDelay = 500; // 500ms for long press

  const clearLongPressTimer = (padIndex: number) => {
    if (longPressTimerRef.current[padIndex]) {
      clearTimeout(longPressTimerRef.current[padIndex]);
      delete longPressTimerRef.current[padIndex];
    }
  };

  const handlePadClick = (padIndex: number, e: React.MouseEvent) => {
    e.preventDefault();

    // Clear any pending long press
    clearLongPressTimer(padIndex);

    if (e.button === 2 || (e.button === 0 && (e.ctrlKey || e.shiftKey))) {
      // Right-click, Ctrl+Click, or Shift+Click = Clear
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

  const handlePadMouseDown = (padIndex: number, e: React.MouseEvent) => {
    // Start long press timer for desktop (Shift+Click is faster, but long press works too)
    if (e.button === 0 && !e.shiftKey && !e.ctrlKey) {
      // e is used above
      longPressTimerRef.current[padIndex] = setTimeout(() => {
        // Long press detected - clear cue
        if (cuePoints[padIndex] !== undefined) {
          setCuePoints((prev) => {
            const newPoints = { ...prev };
            delete newPoints[padIndex];
            return newPoints;
          });
          onCueClear(padIndex);
        }
        delete longPressTimerRef.current[padIndex];
      }, longPressDelay);
    }
  };

  const handlePadMouseUp = (padIndex: number) => {
    clearLongPressTimer(padIndex);
  };

  const handlePadTouchStart = (padIndex: number, _e: React.TouchEvent) => {
    // Start long press timer for mobile
    longPressTimerRef.current[padIndex] = setTimeout(() => {
      // Long press detected - clear cue
      if (cuePoints[padIndex] !== undefined) {
        setCuePoints((prev) => {
          const newPoints = { ...prev };
          delete newPoints[padIndex];
          return newPoints;
        });
        onCueClear(padIndex);
      }
      delete longPressTimerRef.current[padIndex];
    }, longPressDelay);
  };

  const handlePadTouchEnd = (padIndex: number, e: React.TouchEvent) => {
    clearLongPressTimer(padIndex);

    // If it wasn't a long press, handle as normal tap
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.closest(`[data-pad-index="${padIndex}"]`)) {
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
    }
    // e is used above via e.changedTouches
  };

  const padsContent = (
    <div className={`grid ${numPads === 8 ? "grid-cols-4" : "grid-cols-2"} gap-2 md:gap-3 w-full ${numPads === 8 ? "max-w-[400px]" : "max-w-[200px]"}`}>
      {Array.from({ length: numPads }, (_, i) => i).map((padIndex) => {
        const isSet = cuePoints[padIndex] !== undefined;
        return (
          <motion.button
            key={padIndex}
            data-pad-index={padIndex}
            onMouseDown={(e) => handlePadMouseDown(padIndex, e)}
            onMouseUp={() => handlePadMouseUp(padIndex)}
            onClick={(e) => handlePadClick(padIndex, e)}
            onTouchStart={(e) => handlePadTouchStart(padIndex, e)}
            onTouchEnd={(e) => handlePadTouchEnd(padIndex, e)}
            onContextMenu={(e) => {
              e.preventDefault();
              handlePadClick(padIndex, { ...e, button: 2 } as React.MouseEvent);
            }}
            className={`relative aspect-square rounded-lg border-2 transition-all touch-manipulation min-h-[44px] min-w-[44px] ${
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
            aria-label={isSet ? `Hot cue ${padIndex + 1} set at ${cuePoints[padIndex]?.toFixed(1)}s. Click to jump, long press or Shift+Click to clear.` : `Hot cue ${padIndex + 1}. Click to set, long press or Shift+Click to clear.`}
          >
            {/* Pad number */}
            <div
              className={`absolute top-1 left-1 text-[10px] md:text-xs font-barlow font-bold ${
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

