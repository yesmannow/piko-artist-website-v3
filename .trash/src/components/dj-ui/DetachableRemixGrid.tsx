"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { RemixGrid } from "./RemixGrid";
import { useWindowManager, WindowManager } from "../ui/WindowManager";

export interface DetachableRemixGridProps {
  width?: number;
  height?: number;
  bpm?: number;
  isPlaying?: boolean;
  onSampleTrigger?: (sample: any, velocity: number) => void;
  helpText?: string;
}

export function DetachableRemixGrid({
  width = 400,
  height = 400,
  bpm = 120,
  isPlaying = false,
  onSampleTrigger,
  helpText,
}: DetachableRemixGridProps) {
  const { windows, addWindow, updateWindow, closeWindow, focusWindow } =
    useWindowManager();
  const [isDetached, setIsDetached] = useState(false);

  const handleDetach = () => {
    setIsDetached(true);
    addWindow(
      "remix-grid",
      "Live Remix Grid",
      RemixGrid,
      {
        width: 500,
        height: 500,
        bpm,
        isPlaying,
        onSampleTrigger,
        helpText,
      },
      { x: 200, y: 200 },
      { width: 500, height: 500 },
    );
  };

  const handleAttach = () => {
    setIsDetached(false);
    closeWindow("remix-grid");
  };

  // Update detached window when props change
  useEffect(() => {
    if (isDetached) {
      updateWindow("remix-grid", {
        props: {
          width: 500,
          height: 500,
          bpm,
          isPlaying,
          onSampleTrigger,
          helpText,
        },
      });
    }
  }, [bpm, isPlaying, onSampleTrigger, helpText, isDetached, updateWindow]);

  return (
    <>
      {/* Embedded Grid */}
      {!isDetached && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative"
        >
          {/* Detach Button */}
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={handleDetach}
              className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Detach as separate window"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Grid Component */}
          <div className="pt-10">
            <RemixGrid
              width={width}
              height={height}
              bpm={bpm}
              isPlaying={isPlaying}
              onSampleTrigger={onSampleTrigger}
              helpText={helpText}
            />
          </div>
        </motion.div>
      )}

      {/* Attach Button when Detached */}
      {isDetached && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center p-8 bg-gray-900/50 rounded-lg border border-gray-700 border-dashed"
        >
          <button
            onClick={handleAttach}
            className="flex items-center gap-2 px-4 py-2 bg-toxic-lime hover:bg-toxic-lime/80 text-black font-bold rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
            Attach Remix Grid
          </button>
        </motion.div>
      )}

      {/* Window Manager */}
      <WindowManager
        windows={windows}
        onWindowUpdate={updateWindow}
        onWindowClose={closeWindow}
        onWindowFocus={focusWindow}
      />
    </>
  );
}
