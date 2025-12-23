"use client";

import { useEffect, useRef } from "react";

interface MPCScreenProps {
  kitName: string;
  bpm: number;
  audioContext?: AudioContext;
  masterGainNode?: GainNode;
}

export function MPCScreen({ kitName, bpm, audioContext, masterGainNode }: MPCScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Setup audio analyzer
  useEffect(() => {
    if (!audioContext || !masterGainNode) return;

    try {
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;

      // Tap the signal from master gain to analyzer (parallel connection)
      // The analyzer doesn't need to connect to destination - it just reads data
      masterGainNode.connect(analyzer);

      analyzerRef.current = analyzer;

      return () => {
        try {
          if (analyzerRef.current) {
            analyzerRef.current.disconnect();
          }
        } catch {
          // Ignore disconnect errors
        }
      };
    } catch (error) {
      console.error("Error setting up analyzer:", error);
    }
  }, [audioContext, masterGainNode]);

  // Visualizer animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyzerRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyzer.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "#4ade80"; // LCD green background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw inner shadow effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw oscilloscope line
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#166534"; // Dark green for pixelated look
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // Add pixelated effect by drawing small rectangles
      ctx.fillStyle = "#166534";
      for (let i = 0; i < bufferLength; i += 4) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        const x = (i / bufferLength) * canvas.width;
        ctx.fillRect(x, y, 2, 2);
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        {/* Canvas Visualizer */}
        <div className="mt-2">
          <canvas
            ref={canvasRef}
            width={300}
            height={80}
            className="w-full border border-black/20"
            style={{
              imageRendering: "crisp-edges",
            }}
          />
        </div>
      </div>
    </div>
  );
}

