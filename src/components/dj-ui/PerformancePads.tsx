"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "./Tooltip";

interface PerformancePadsProps {
  onCueSet: (padIndex: number, time: number) => void;
  onCueJump: (time: number) => void;
  onCueClear: (padIndex: number) => void;
  getCurrentTime: () => number;
  onStutter?: (padIndex: number) => void; // Stutter effect trigger
  isPlaying?: boolean; // Track playing state for stutter
  helpText?: string;
  numPads?: number; // Number of pads (default 12, can be 8 for mobile, 4 for very small)
}

export function PerformancePads({
  onCueSet,
  onCueJump,
  onCueClear,
  getCurrentTime,
  onStutter,
  isPlaying = false,
  helpText,
  numPads = 12,
}: PerformancePadsProps) {
  const [cuePoints, setCuePoints] = useState<Record<number, number>>({});
  const [stutterActive, setStutterActive] = useState<Record<number, boolean>>({});
  const longPressTimerRef = useRef<Record<number, NodeJS.Timeout>>({});
  const stutterIntervalRef = useRef<Record<number, NodeJS.Timeout>>({});
  const longPressDelay = 500; // 500ms for long press
  const stutterRate = 8; // Stutter rate in Hz (8 times per second)

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
      // Pad is set - trigger stutter if playing, otherwise jump to cue point
      if (isPlaying && onStutter) {
        // Toggle stutter effect
        if (stutterActive[padIndex]) {
          // Stop stutter
          if (stutterIntervalRef.current[padIndex]) {
            clearInterval(stutterIntervalRef.current[padIndex]);
            delete stutterIntervalRef.current[padIndex];
          }
          setStutterActive((prev) => {
            const newState = { ...prev };
            delete newState[padIndex];
            return newState;
          });
        } else {
          // Start stutter
          setStutterActive((prev) => ({ ...prev, [padIndex]: true }));
          const interval = setInterval(() => {
            onStutter(padIndex);
          }, 1000 / stutterRate);
          stutterIntervalRef.current[padIndex] = interval;
        }
      } else {
        // Jump to cue point
        onCueJump(cuePoints[padIndex]);
      }
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
        // Pad is set - trigger stutter if playing, otherwise jump to cue point
        if (isPlaying && onStutter) {
          // Toggle stutter effect
          if (stutterActive[padIndex]) {
            // Stop stutter
            if (stutterIntervalRef.current[padIndex]) {
              clearInterval(stutterIntervalRef.current[padIndex]);
              delete stutterIntervalRef.current[padIndex];
            }
            setStutterActive((prev) => {
              const newState = { ...prev };
              delete newState[padIndex];
              return newState;
            });
          } else {
            // Start stutter
            setStutterActive((prev) => ({ ...prev, [padIndex]: true }));
            const interval = setInterval(() => {
              onStutter(padIndex);
            }, 1000 / stutterRate);
            stutterIntervalRef.current[padIndex] = interval;
          }
        } else {
          // Jump to cue point
          onCueJump(cuePoints[padIndex]);
        }
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

  // Cleanup stutter intervals on unmount
  useEffect(() => {
    const intervals = stutterIntervalRef.current;
    return () => {
      Object.values(intervals).forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, []);

  // Determine grid layout based on number of pads
  const getGridCols = () => {
    if (numPads === 12) return "grid-cols-4";
    if (numPads === 8) return "grid-cols-4";
    if (numPads === 4) return "grid-cols-2";
    return "grid-cols-2";
  };

  const getMaxWidth = () => {
    if (numPads === 12) return "max-w-[500px]";
    if (numPads === 8) return "max-w-[400px]";
    return "max-w-[200px]";
  };

  const padsContent = (
    <div className={`grid ${getGridCols()} gap-2 md:gap-3 w-full ${getMaxWidth()}`}>
      {Array.from({ length: numPads }, (_, i) => i).map((padIndex) => {
        const isSet = cuePoints[padIndex] !== undefined;
        const isStuttering = stutterActive[padIndex] === true;
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
              isStuttering
                ? "bg-red-600 border-red-400"
                : isSet
                ? "bg-[#1a1a1a] border-[#ccff00]"
                : "bg-[#0a0a0a] border-gray-700 hover:border-gray-600"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: isStuttering
                ? `0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(239, 68, 68, 0.3)`
                : isSet
                ? `0 0 20px rgba(204, 255, 0, 0.4), inset 0 0 10px rgba(204, 255, 0, 0.1)`
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
            aria-label={
              isStuttering
                ? `Stutter active on pad ${padIndex + 1}. Click to stop.`
                : isSet
                ? `Hot cue ${padIndex + 1} set at ${cuePoints[padIndex]?.toFixed(1)}s. ${isPlaying && onStutter ? "Click to stutter" : "Click to jump"}, long press or Shift+Click to clear.`
                : `Hot cue ${padIndex + 1}. Click to set, long press or Shift+Click to clear.`
            }
          >
            {/* Pad number */}
            <div
              className={`absolute top-1 left-1 text-[10px] md:text-xs font-barlow font-bold ${
                isStuttering
                  ? "text-white"
                  : isSet
                  ? "text-[#ccff00]"
                  : "text-gray-500"
              }`}
            >
              {padIndex + 1}
            </div>

            {/* Glow effect when set or stuttering */}
            {(isSet || isStuttering) && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: isStuttering
                    ? `radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)`
                    : `radial-gradient(circle, rgba(204, 255, 0, 0.2) 0%, transparent 70%)`,
                }}
                animate={{
                  opacity: isStuttering ? [0.8, 1, 0.8] : [0.5, 1, 0.5],
                }}
                transition={{
                  duration: isStuttering ? 0.125 : 1.5,
                  repeat: Infinity,
                }}
              />
            )}

            {/* Cue point indicator */}
            {isSet && !isStuttering && (
              <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#ccff00]" />
            )}

            {/* Stutter indicator */}
            {isStuttering && (
              <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
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

