"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import AudioMotionAnalyzer from "audiomotion-analyzer";

interface AudioReactiveVisualizerProps {
  audioContext?: AudioContext;
  masterGainNode?: GainNode;
  deckAColor?: string;
  deckBColor?: string;
}

export function AudioReactiveVisualizer({
  audioContext,
  masterGainNode,
  deckAColor = "#00d9ff",
  deckBColor = "#ff00d9",
}: AudioReactiveVisualizerProps) {
  const analyzerRef = useRef<HTMLDivElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);
  const [frequencyData, setFrequencyData] = useState<{ low: number; mid: number; high: number }>({
    low: 0,
    mid: 0,
    high: 0,
  });

  // Motion values for smooth animations
  const lowPulse = useMotionValue(1);
  const midPulse = useMotionValue(1);
  const highPulse = useMotionValue(1);
  const colorShift = useMotionValue(0);

  // Spring animations for smooth transitions
  const lowSpring = useSpring(lowPulse, { stiffness: 300, damping: 30 });
  const midSpring = useSpring(midPulse, { stiffness: 300, damping: 30 });
  const highSpring = useSpring(highPulse, { stiffness: 300, damping: 30 });
  const colorSpring = useSpring(colorShift, { stiffness: 100, damping: 20 });

  // Setup AudioMotionAnalyzer
  useEffect(() => {
    if (!audioContext || !masterGainNode || !analyzerRef.current) return;

    let analyzer: AudioMotionAnalyzer | null = null;

    try {
      // Create custom gradient that reacts to frequency bands
      const pikoGradient = {
        bgColor: "#00000000",
        dir: "h",
        colorStops: [
          { pos: 0, color: deckAColor },
          { pos: 1, color: deckBColor },
        ],
      };

      analyzer = new AudioMotionAnalyzer(analyzerRef.current, {
        audioCtx: audioContext,
        source: masterGainNode,
        connectSpeakers: false,
        mode: 5, // 1/3 octave bands
        barSpace: 0.6,
        ledBars: true,
        showScaleX: false,
        showScaleY: false,
        showPeaks: false,
        bgAlpha: 0,
        overlay: true,
        ansiBands: false,
        channelLayout: "dual-combined",
        smoothing: 0.7,
        height: 150,
        lineWidth: 2,
        radial: false,
        gradient: "classic",
        reflexRatio: 0.3,
        reflexAlpha: 0.25,
        reflexBright: 1,
      });

      analyzer.registerGradient("piko-custom", pikoGradient);
      analyzer.setOptions({
        gradient: "piko-custom",
        reflexRatio: 0.3,
        reflexAlpha: 0.25,
        reflexBright: 1,
      });

      audioMotionRef.current = analyzer;

      // Update frequency data for reactive effects
      const updateFrequencyData = () => {
        if (!analyzer) return;

        const bars = analyzer.getBars();
        if (bars && bars.length > 0) {
          // Low frequencies (0-30% of bars)
          const lowEnd = Math.floor(bars.length * 0.3);
          const lowAvg = bars.slice(0, lowEnd).reduce((a, b) => a + b, 0) / lowEnd;

          // Mid frequencies (30-70% of bars)
          const midStart = lowEnd;
          const midEnd = Math.floor(bars.length * 0.7);
          const midAvg = bars.slice(midStart, midEnd).reduce((a, b) => a + b, 0) / (midEnd - midStart);

          // High frequencies (70-100% of bars)
          const highAvg = bars.slice(midEnd).reduce((a, b) => a + b, 0) / (bars.length - midEnd);

          setFrequencyData({
            low: Math.min(lowAvg / 100, 1),
            mid: Math.min(midAvg / 100, 1),
            high: Math.min(highAvg / 100, 1),
          });

          // Update pulse animations based on frequency data
          lowPulse.set(1 + lowAvg * 0.01);
          midPulse.set(1 + midAvg * 0.01);
          highPulse.set(1 + highAvg * 0.01);

          // Color shift based on overall energy
          const totalEnergy = (lowAvg + midAvg + highAvg) / 3;
          colorShift.set(Math.min(totalEnergy / 100, 1));
        }

        requestAnimationFrame(updateFrequencyData);
      };

      updateFrequencyData();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Visualizer failed to initialize:", err);
      }
    }

    return () => {
      if (analyzer) {
        try {
          analyzer.destroy();
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error("Error cleaning up analyzer:", e);
          }
        }
      }
    };
  }, [audioContext, masterGainNode, deckAColor, deckBColor, lowPulse, midPulse, highPulse, colorShift]);

  return (
    <div className="relative w-full">
      {/* Main Spectrum Analyzer */}
      <div
        ref={analyzerRef}
        className="w-full bg-[#0a0a0a] rounded border border-gray-800 relative overflow-hidden"
        style={{ minHeight: 150 }}
      />

      {/* Frequency Band Indicators with Animations */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-4">
        {/* Low Frequency Indicator */}
        <motion.div
          className="flex flex-col items-center gap-1"
          style={{
            scale: lowSpring,
          }}
        >
          <div
            className="w-2 h-8 rounded-full"
            style={{
              background: `linear-gradient(to top, ${deckAColor}40, ${deckAColor})`,
              height: `${Math.max(frequencyData.low * 32, 4)}px`,
            }}
          />
          <span className="text-[8px] text-gray-500 uppercase">LOW</span>
        </motion.div>

        {/* Mid Frequency Indicator */}
        <motion.div
          className="flex flex-col items-center gap-1"
          style={{
            scale: midSpring,
          }}
        >
          <div
            className="w-2 h-8 rounded-full"
            style={{
              background: `linear-gradient(to top, ${deckBColor}40, ${deckBColor})`,
              height: `${Math.max(frequencyData.mid * 32, 4)}px`,
            }}
          />
          <span className="text-[8px] text-gray-500 uppercase">MID</span>
        </motion.div>

        {/* High Frequency Indicator */}
        <motion.div
          className="flex flex-col items-center gap-1"
          style={{
            scale: highSpring,
          }}
        >
          <div
            className="w-2 h-8 rounded-full"
            style={{
              background: `linear-gradient(to top, #ccff0040, #ccff00)`,
              height: `${Math.max(frequencyData.high * 32, 4)}px`,
            }}
          />
          <span className="text-[8px] text-gray-500 uppercase">HIGH</span>
        </motion.div>
      </div>

      {/* Beat Pulse Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, transparent 0%, ${deckAColor}20 100%)`,
          opacity: colorSpring,
        }}
      />
    </div>
  );
}

