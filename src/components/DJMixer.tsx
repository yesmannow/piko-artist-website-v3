"use client";

import { useEffect, useRef } from "react";
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { Knob } from "./dj-ui/Knob";
import { Fader } from "./dj-ui/Fader";
import { Crossfader } from "./dj-ui/Crossfader";

interface DJMixerProps {
  // Deck A controls
  deckAVolume: number;
  deckAHigh: number;
  deckAMid: number;
  deckALow: number;
  onDeckAVolumeChange: (value: number) => void;
  onDeckAHighChange: (value: number) => void;
  onDeckAMidChange: (value: number) => void;
  onDeckALowChange: (value: number) => void;
  deckAKillHigh: boolean;
  deckAKillMid: boolean;
  deckAKillLow: boolean;
  onDeckAKillHighChange: (kill: boolean) => void;
  onDeckAKillMidChange: (kill: boolean) => void;
  onDeckAKillLowChange: (kill: boolean) => void;

  // Deck B controls
  deckBVolume: number;
  deckBHigh: number;
  deckBMid: number;
  deckBLow: number;
  onDeckBVolumeChange: (value: number) => void;
  onDeckBHighChange: (value: number) => void;
  onDeckBMidChange: (value: number) => void;
  onDeckBLowChange: (value: number) => void;
  deckBKillHigh: boolean;
  deckBKillMid: boolean;
  deckBKillLow: boolean;
  onDeckBKillHighChange: (kill: boolean) => void;
  onDeckBKillMidChange: (kill: boolean) => void;
  onDeckBKillLowChange: (kill: boolean) => void;

  // Crossfader
  crossfader: number; // 0 = left (Deck A), 1 = right (Deck B)
  onCrossfaderChange: (value: number) => void;

  // Audio context for spectrum analyzer
  audioContext?: AudioContext;
  masterGainNode?: GainNode;
}

export function DJMixer({
  deckAVolume,
  deckAHigh,
  deckAMid,
  deckALow,
  onDeckAVolumeChange,
  onDeckAHighChange,
  onDeckAMidChange,
  onDeckALowChange,
  deckAKillHigh,
  deckAKillMid,
  deckAKillLow,
  onDeckAKillHighChange,
  onDeckAKillMidChange,
  onDeckAKillLowChange,
  deckBVolume,
  deckBHigh,
  deckBMid,
  deckBLow,
  onDeckBVolumeChange,
  onDeckBHighChange,
  onDeckBMidChange,
  onDeckBLowChange,
  deckBKillHigh,
  deckBKillMid,
  deckBKillLow,
  onDeckBKillHighChange,
  onDeckBKillMidChange,
  onDeckBKillLowChange,
  crossfader,
  onCrossfaderChange,
  audioContext,
  masterGainNode,
}: DJMixerProps) {
  const analyzerRef = useRef<HTMLDivElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);

  // Setup Spectrum Analyzer
  useEffect(() => {
    if (!audioContext || !masterGainNode || !analyzerRef.current) return;

    try {
      const audioMotion = new AudioMotionAnalyzer(analyzerRef.current, {
        audioCtx: audioContext,
        source: masterGainNode,
        connectSpeakers: false,
        mode: 10, // Octave Bands
        gradient: "linear-gradient(90deg, #4a90e2 0%, #e24a4a 100%)",
        showScaleX: false,
        showScaleY: false,
        height: 150,
        lineWidth: 2,
        smoothing: 0.8,
        radial: false,
        overlay: true,
      });

      audioMotionRef.current = audioMotion;

      return () => {
        try {
          if (audioMotionRef.current) {
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
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0a] rounded-lg border border-gray-800">
      <div className="text-center">
        <h3 className="text-lg font-barlow uppercase tracking-wider text-gray-300 mb-2">
          MIXER
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Left Strip - Deck A */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm font-barlow uppercase text-gray-400 mb-1">
            DECK A
          </div>

          {/* Volume Fader */}
          <Fader
            value={deckAVolume}
            onChange={onDeckAVolumeChange}
            label="VOL"
            height={180}
          />

          {/* EQ Knobs */}
          <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <Knob
                value={deckAHigh}
                onChange={onDeckAHighChange}
                label="HIGH"
                min={-12}
                max={12}
                color="high"
                size={50}
                helpText="Adjusts high frequencies (treble). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckAKillHighChange(!deckAKillHigh)}
                className={`w-8 h-6 text-xs font-barlow uppercase rounded border transition-colors ${
                  deckAKillHigh
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title="Kill High"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Knob
                value={deckAMid}
                onChange={onDeckAMidChange}
                label="MID"
                min={-12}
                max={12}
                color="mid"
                size={50}
                helpText="Adjusts mid frequencies. Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckAKillMidChange(!deckAKillMid)}
                className={`w-8 h-6 text-xs font-barlow uppercase rounded border transition-colors ${
                  deckAKillMid
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title="Kill Mid"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Knob
                value={deckALow}
                onChange={onDeckALowChange}
                label="LOW"
                min={-12}
                max={12}
                color="low"
                size={50}
                helpText="Adjusts low frequencies (bass). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckAKillLowChange(!deckAKillLow)}
                className={`w-8 h-6 text-xs font-barlow uppercase rounded border transition-colors ${
                  deckAKillLow
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title="Kill Low"
              >
                K
              </button>
            </div>
          </div>
        </div>

        {/* Center - Spectrum Analyzer & Crossfader */}
        <div className="flex flex-col items-center gap-4">
          {/* Spectrum Analyzer */}
          <div className="w-full">
            <div className="text-xs font-barlow uppercase text-gray-400 mb-2 text-center">
              SPECTRUM
            </div>
            <div
              ref={analyzerRef}
              className="w-full bg-[#0a0a0a] rounded border border-gray-800"
              style={{ minHeight: 150 }}
            />
          </div>

          {/* Crossfader */}
          <div className="mt-auto w-full" data-tour="master-out">
            <Crossfader
              value={crossfader}
              onChange={onCrossfaderChange}
              width={200}
              helpText="Blends audio between Deck A and Deck B. Left = Deck A, Right = Deck B"
            />
          </div>
        </div>

        {/* Right Strip - Deck B */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm font-barlow uppercase text-gray-400 mb-1">
            DECK B
          </div>

          {/* Volume Fader */}
          <Fader
            value={deckBVolume}
            onChange={onDeckBVolumeChange}
            label="VOL"
            height={180}
            helpText="Adjusts the volume level for Deck B"
          />

          {/* EQ Knobs */}
          <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <Knob
                value={deckBHigh}
                onChange={onDeckBHighChange}
                label="HIGH"
                min={-12}
                max={12}
                color="high"
                size={50}
                helpText="Adjusts high frequencies (treble). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckBKillHighChange(!deckBKillHigh)}
                className={`w-8 h-6 text-xs font-barlow uppercase rounded border transition-colors ${
                  deckBKillHigh
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title="Kill High"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Knob
                value={deckBMid}
                onChange={onDeckBMidChange}
                label="MID"
                min={-12}
                max={12}
                color="mid"
                size={50}
                helpText="Adjusts mid frequencies. Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckBKillMidChange(!deckBKillMid)}
                className={`w-8 h-6 text-xs font-barlow uppercase rounded border transition-colors ${
                  deckBKillMid
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title="Kill Mid"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Knob
                value={deckBLow}
                onChange={onDeckBLowChange}
                label="LOW"
                min={-12}
                max={12}
                color="low"
                size={50}
                helpText="Adjusts low frequencies (bass). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckBKillLowChange(!deckBKillLow)}
                className={`w-8 h-6 text-xs font-barlow uppercase rounded border transition-colors ${
                  deckBKillLow
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title="Kill Low"
              >
                K
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

