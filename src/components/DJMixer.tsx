"use client";

import { Knob } from "./dj-ui/Knob";
import { Fader } from "./dj-ui/Fader";
import { Crossfader } from "./dj-ui/Crossfader";
import { AudioReactiveVisualizer } from "./dj-ui/AudioReactiveVisualizer";

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

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800">
      <div className="text-center">
        <h3 className="text-base md:text-lg font-barlow uppercase tracking-wider text-gray-300 mb-2">
          MIXER
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
            height={typeof window !== "undefined" && window.innerWidth < 768 ? 140 : 180}
          />

          {/* EQ Knobs */}
          <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] md:text-xs font-barlow uppercase text-red-500 font-bold mb-1">HIGH</div>
              <Knob
                value={deckAHigh}
                onChange={onDeckAHighChange}
                label=""
                min={-12}
                max={12}
                color="high"
                size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                helpText="Adjusts high frequencies (treble). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckAKillHighChange(!deckAKillHigh)}
                className={`w-10 h-8 md:w-8 md:h-6 text-xs font-barlow uppercase rounded border transition-colors touch-manipulation ${
                  deckAKillHigh
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-red-500/50 text-gray-400 hover:border-red-500 active:bg-red-600/50"
                }`}
                title="Kill High"
                aria-label="Kill High frequencies"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] md:text-xs font-barlow uppercase text-green-500 font-bold mb-1">MID</div>
              <Knob
                value={deckAMid}
                onChange={onDeckAMidChange}
                label=""
                min={-12}
                max={12}
                color="mid"
                size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                helpText="Adjusts mid frequencies. Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckAKillMidChange(!deckAKillMid)}
                className={`w-10 h-8 md:w-8 md:h-6 text-xs font-barlow uppercase rounded border transition-colors touch-manipulation ${
                  deckAKillMid
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-green-500/50 text-gray-400 hover:border-green-500 active:bg-red-600/50"
                }`}
                title="Kill Mid"
                aria-label="Kill Mid frequencies"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] md:text-xs font-barlow uppercase text-blue-500 font-bold mb-1">LOW</div>
              <Knob
                value={deckALow}
                onChange={onDeckALowChange}
                label=""
                min={-12}
                max={12}
                color="low"
                size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                helpText="Adjusts low frequencies (bass). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckAKillLowChange(!deckAKillLow)}
                className={`w-10 h-8 md:w-8 md:h-6 text-xs font-barlow uppercase rounded border transition-colors touch-manipulation ${
                  deckAKillLow
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-blue-500/50 text-gray-400 hover:border-blue-500 active:bg-red-600/50"
                }`}
                title="Kill Low"
                aria-label="Kill Low frequencies"
              >
                K
              </button>
            </div>
          </div>
        </div>

        {/* Center - Spectrum Analyzer & Crossfader */}
        <div className="flex flex-col items-center gap-4">
          {/* Enhanced Audio Reactive Visualizer */}
          <div className="w-full">
            <div className="text-xs font-barlow uppercase text-gray-400 mb-2 text-center">
              SPECTRUM
            </div>
            <AudioReactiveVisualizer
              audioContext={audioContext}
              masterGainNode={masterGainNode}
              deckAColor="#00d9ff"
              deckBColor="#ff00d9"
            />
          </div>

          {/* Crossfader */}
          <div className="mt-auto w-full" data-tour="master-out">
            <Crossfader
              value={crossfader}
              onChange={onCrossfaderChange}
              width={typeof window !== "undefined" && window.innerWidth < 768 ? 250 : 200}
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
            height={typeof window !== "undefined" && window.innerWidth < 768 ? 140 : 180}
            helpText="Adjusts the volume level for Deck B"
          />

          {/* EQ Knobs */}
          <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] md:text-xs font-barlow uppercase text-red-500 font-bold mb-1">HIGH</div>
              <Knob
                value={deckBHigh}
                onChange={onDeckBHighChange}
                label=""
                min={-12}
                max={12}
                color="high"
                size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                helpText="Adjusts high frequencies (treble). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckBKillHighChange(!deckBKillHigh)}
                className={`w-10 h-8 md:w-8 md:h-6 text-xs font-barlow uppercase rounded border transition-colors touch-manipulation ${
                  deckBKillHigh
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-red-500/50 text-gray-400 hover:border-red-500 active:bg-red-600/50"
                }`}
                title="Kill High"
                aria-label="Kill High frequencies"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] md:text-xs font-barlow uppercase text-green-500 font-bold mb-1">MID</div>
              <Knob
                value={deckBMid}
                onChange={onDeckBMidChange}
                label=""
                min={-12}
                max={12}
                color="mid"
                size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                helpText="Adjusts mid frequencies. Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckBKillMidChange(!deckBKillMid)}
                className={`w-10 h-8 md:w-8 md:h-6 text-xs font-barlow uppercase rounded border transition-colors touch-manipulation ${
                  deckBKillMid
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-green-500/50 text-gray-400 hover:border-green-500 active:bg-red-600/50"
                }`}
                title="Kill Mid"
                aria-label="Kill Mid frequencies"
              >
                K
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] md:text-xs font-barlow uppercase text-blue-500 font-bold mb-1">LOW</div>
              <Knob
                value={deckBLow}
                onChange={onDeckBLowChange}
                label=""
                min={-12}
                max={12}
                color="low"
                size={typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 50}
                helpText="Adjusts low frequencies (bass). Boost or cut up to ±12dB"
              />
              <button
                onClick={() => onDeckBKillLowChange(!deckBKillLow)}
                className={`w-10 h-8 md:w-8 md:h-6 text-xs font-barlow uppercase rounded border transition-colors touch-manipulation ${
                  deckBKillLow
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-blue-500/50 text-gray-400 hover:border-blue-500 active:bg-red-600/50"
                }`}
                title="Kill Low"
                aria-label="Kill Low frequencies"
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
