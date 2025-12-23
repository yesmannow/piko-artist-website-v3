"use client";

import { useEffect, useRef } from "react";
import AudioMotionAnalyzer from "audiomotion-analyzer";

interface MPCScreenProps {
  kitName: string;
  bpm: number;
  audioContext?: AudioContext;
  masterGainNode?: GainNode;
}

export function MPCScreen({ kitName, bpm, audioContext, masterGainNode }: MPCScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);

  // Setup AudioMotion analyzer
  useEffect(() => {
    if (!audioContext || !masterGainNode || !containerRef.current) return;

    try {
      // Create AudioMotion analyzer instance
      const audioMotion = new AudioMotionAnalyzer(containerRef.current, {
        audioCtx: audioContext,
        source: masterGainNode,
        connectSpeakers: false, // Don't route audio to speakers
        mode: 2, // Discrete Bars - LCD style
        gradient: 'linear-gradient(90deg, #ccff00 0%, #2a2a2a 100%)', // Toxic Lime to Dark
        showScaleX: false,
        ledBars: true, // Segmented look
        height: 80,
        lineWidth: 2,
        smoothing: 0.8,
      });

      audioMotionRef.current = audioMotion;

      return () => {
        try {
          if (audioMotionRef.current) {
            // Destroy the analyzer (handles cleanup internally)
            audioMotionRef.current.destroy();
            audioMotionRef.current = null;
          }
        } catch (error) {
          console.error("Error cleaning up AudioMotion:", error);
        }
      };
    } catch (error) {
      console.error("Error setting up AudioMotion analyzer:", error);
    }
  }, [audioContext, masterGainNode]);

  return (
    <div
      className="relative border-2 border-black shadow-hard"
      style={{
        backgroundColor: "#4ade80",
        boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.5), 4px 4px 0px 0px rgba(0,0,0,1)",
      }}
    >
      {/* LCD Screen Content */}
      <div className="p-4 space-y-2">
        {/* Kit Name Display */}
        <div
          className="font-mono text-lg md:text-xl font-bold"
          style={{
            color: "#166534",
            textShadow: "1px 1px 0px rgba(0,0,0,0.3)",
            letterSpacing: "0.1em",
            fontFamily: "monospace",
          }}
        >
          {kitName.toUpperCase()}
        </div>

        {/* BPM Display */}
        <div
          className="font-mono text-sm md:text-base"
          style={{
            color: "#166534",
            textShadow: "1px 1px 0px rgba(0,0,0,0.3)",
            letterSpacing: "0.1em",
            fontFamily: "monospace",
          }}
        >
          BPM: {bpm}
        </div>

        {/* AudioMotion Visualizer */}
        <div className="mt-2">
          <div
            ref={containerRef}
            className="w-full border border-black/20"
            style={{
              height: "80px",
              minHeight: "80px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

