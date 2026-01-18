"use client";

import { useEffect, useRef, useState } from "react";

interface DrawerAudioMetersProps {
  analyser: AnalyserNode | null;
}

export function DrawerAudioMeters({ analyser }: DrawerAudioMetersProps) {
  const [levels, setLevels] = useState({ master: 0, low: 0, mid: 0, high: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!analyser) {
      setLevels({ master: 0, low: 0, mid: 0, high: 0 });
      return;
    }

    // Initialize data array
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    const updateLevels = () => {
      if (!analyser || !dataArrayRef.current) return;

      // @ts-expect-error - TypeScript strictness issue with ArrayBufferLike vs ArrayBuffer
      analyser.getByteFrequencyData(dataArrayRef.current);
      const data = dataArrayRef.current;

      // Calculate frequency bands (assuming 44.1kHz sample rate, 256 FFT)
      // Low: 0-200Hz (bins 0-2)
      // Mid: 200Hz-2kHz (bins 2-20)
      // High: 2kHz-20kHz (bins 20-128)
      const lowEnd = Math.floor((200 / 22050) * bufferLength);
      const midEnd = Math.floor((2000 / 22050) * bufferLength);

      let lowSum = 0;
      let midSum = 0;
      let highSum = 0;
      let masterSum = 0;

      for (let i = 0; i < bufferLength; i++) {
        const value = data[i] / 255; // Normalize to 0-1
        masterSum += value;

        if (i < lowEnd) {
          lowSum += value;
        } else if (i < midEnd) {
          midSum += value;
        } else {
          highSum += value;
        }
      }

      // Average and scale
      const master = Math.min(1, (masterSum / bufferLength) * 2);
      const low = Math.min(1, (lowSum / lowEnd) * 2);
      const mid = Math.min(1, (midSum / (midEnd - lowEnd)) * 2);
      const high = Math.min(1, (highSum / (bufferLength - midEnd)) * 2);

      setLevels({
        master: master || 0,
        low: low || 0,
        mid: mid || 0,
        high: high || 0,
      });

      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser]);

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4">
      <div className="mb-3">
        <label className="text-sm font-barlow uppercase text-gray-300 tracking-wider">
          Audio Levels
        </label>
      </div>

      {/* Master Level Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-barlow text-gray-400 uppercase">MASTER</span>
          <span className="text-xs font-barlow text-[#00ff00] font-bold">
            {Math.round(levels.master * 100)}%
          </span>
        </div>
        <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-full bg-gradient-to-r from-[#00ff00] to-[#00ff00] transition-all duration-75"
            style={{
              width: `${levels.master * 100}%`,
              boxShadow: levels.master > 0.8 ? "0 0 8px rgba(0, 255, 0, 0.5)" : "none",
            }}
          />
        </div>
      </div>

      {/* Frequency Bands */}
      <div className="grid grid-cols-3 gap-3">
        {/* Low Band */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-barlow text-gray-500 uppercase">LOW</span>
          <div className="w-full h-16 bg-[#0a0a0a] rounded border border-gray-700 flex items-end justify-center p-1">
            <div
              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded transition-all duration-75"
              style={{
                height: `${levels.low * 100}%`,
                minHeight: levels.low > 0 ? "2px" : "0",
                boxShadow: levels.low > 0.7 ? "0 0 6px rgba(59, 130, 246, 0.5)" : "none",
              }}
            />
          </div>
        </div>

        {/* Mid Band */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-barlow text-gray-500 uppercase">MID</span>
          <div className="w-full h-16 bg-[#0a0a0a] rounded border border-gray-700 flex items-end justify-center p-1">
            <div
              className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded transition-all duration-75"
              style={{
                height: `${levels.mid * 100}%`,
                minHeight: levels.mid > 0 ? "2px" : "0",
                boxShadow: levels.mid > 0.7 ? "0 0 6px rgba(34, 197, 94, 0.5)" : "none",
              }}
            />
          </div>
        </div>

        {/* High Band */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-barlow text-gray-500 uppercase">HIGH</span>
          <div className="w-full h-16 bg-[#0a0a0a] rounded border border-gray-700 flex items-end justify-center p-1">
            <div
              className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded transition-all duration-75"
              style={{
                height: `${levels.high * 100}%`,
                minHeight: levels.high > 0 ? "2px" : "0",
                boxShadow: levels.high > 0.7 ? "0 0 6px rgba(239, 68, 68, 0.5)" : "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

