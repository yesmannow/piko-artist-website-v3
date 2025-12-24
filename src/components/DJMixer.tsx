"use client";

import { Knob } from "./dj-ui/Knob";
import { Fader } from "./dj-ui/Fader";
import { Crossfader } from "./dj-ui/Crossfader";
import { AudioReactiveVisualizer } from "./dj-ui/AudioReactiveVisualizer";
import { Circle, Square, Download, Trash2 } from "lucide-react";

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

  // Recording controls
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onDownloadRecording?: () => void;
  hasRecording?: boolean;
  recordingDuration?: number;
  recordingError?: string | null;
  onClearRecording?: () => void;

  // Master limiter
  limiterThreshold?: number;
  onLimiterThresholdChange?: (value: number) => void;
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
  isRecording = false,
  onStartRecording,
  onStopRecording,
  onDownloadRecording,
  hasRecording = false,
  recordingDuration = 0,
  recordingError = null,
  onClearRecording,
  limiterThreshold = -3,
  onLimiterThresholdChange,
}: DJMixerProps) {
  // Calculate limiter gradient percentage
  const limiterPercentage = ((limiterThreshold + 12) / 12) * 100;
  const gradientStyle = `linear-gradient(to right, #00ff00 0%, #00ff00 ${limiterPercentage}%, #0a0a0a ${limiterPercentage}%, #0a0a0a 100%)`;

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 shadow-lg">
      <div className="text-center">
        <h3 className="text-base md:text-lg font-barlow uppercase tracking-wider text-gray-300 mb-2">
          MIXER
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Strip - Deck A */}
        <div className="flex flex-col items-center gap-4 p-4 bg-[#1a1a1a]/50 rounded-lg border border-gray-800/50">
          <div className="text-sm font-barlow uppercase text-[#00d9ff] mb-1 font-bold tracking-wider">
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
        <div className="flex flex-col items-center gap-4 p-4 bg-[#1a1a1a]/50 rounded-lg border border-gray-800/50">
          {/* Enhanced Audio Reactive Visualizer */}
          <div className="w-full">
            <div className="text-xs font-barlow uppercase text-gray-400 mb-2 text-center tracking-wider">
              SPECTRUM
            </div>
            <div className="bg-[#0a0a0a] rounded border border-gray-800/50 p-2">
              <AudioReactiveVisualizer
                audioContext={audioContext}
                masterGainNode={masterGainNode}
                deckAColor="#00d9ff"
                deckBColor="#ff00d9"
              />
            </div>
          </div>

          {/* Crossfader */}
          <div className="w-full" data-tour="master-out">
            <div className="text-xs font-barlow uppercase text-gray-400 mb-2 text-center tracking-wider">
              CROSSFADER
            </div>
            <div className="bg-[#0a0a0a] rounded border border-gray-800/50 p-3 flex justify-center">
              <Crossfader
                value={crossfader}
                onChange={onCrossfaderChange}
                width={typeof window !== "undefined" && window.innerWidth < 768 ? 250 : 200}
                helpText="Blends audio between Deck A and Deck B. Left = Deck A, Right = Deck B"
              />
            </div>
          </div>

          {/* Recording Controls */}
          {(onStartRecording || onStopRecording || onDownloadRecording) && (
            <div className="w-full flex flex-col items-center gap-2 mt-2">
              <div className="text-xs font-barlow uppercase text-gray-400 mb-1 tracking-wider">
                RECORD MIX
              </div>
              <div className="bg-[#0a0a0a] rounded border border-gray-800/50 p-3 w-full">
              <div className="flex gap-2 items-center flex-wrap justify-center">
                {!isRecording ? (
                  <button
                    onClick={onStartRecording}
                    disabled={!audioContext}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-barlow uppercase text-xs rounded border-2 border-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                    aria-label="Start recording mix"
                    title="Start recording"
                  >
                    <Circle className="w-4 h-4 fill-current" />
                    REC
                  </button>
                ) : (
                  <button
                    onClick={onStopRecording}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-barlow uppercase text-xs rounded border-2 border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                    aria-label="Stop recording"
                    title="Stop recording"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    STOP
                  </button>
                )}
                {hasRecording && onDownloadRecording && (
                  <button
                    onClick={onDownloadRecording}
                    className="px-4 py-2 bg-[#00ff00] hover:bg-[#00ff00]/90 text-black font-barlow uppercase text-xs rounded border-2 border-[#00ff00] transition-all focus:outline-none focus:ring-2 focus:ring-[#00ff00] min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                    aria-label="Download recording"
                    title="Download recording"
                  >
                    <Download className="w-4 h-4" />
                    DL
                  </button>
                )}
                {hasRecording && onClearRecording && (
                  <button
                    onClick={onClearRecording}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-barlow uppercase text-xs rounded border-2 border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
                    aria-label="Clear recording"
                    title="Clear recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 text-xs text-red-500 font-barlow">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  RECORDING {recordingDuration > 0 && `(${recordingDuration}s)`}
                </div>
              )}
              {recordingError && (
                <div className="text-xs text-red-500 font-barlow text-center max-w-[200px]">
                  {recordingError}
                </div>
              )}
              </div>
            </div>
          )}

          {/* Master Limiter Control */}
          {onLimiterThresholdChange && (
            <div className="w-full flex flex-col items-center gap-2 mt-2">
              <div className="text-xs font-barlow uppercase text-gray-400 mb-1 tracking-wider">
                MASTER LIMITER
              </div>
              <div className="bg-[#0a0a0a] rounded border border-gray-800/50 p-3 w-full">
              <div className="flex items-center gap-2 w-full max-w-full">
                <span className="text-[10px] text-gray-500 font-barlow">-12</span>
                <input
                  type="range"
                  min="-12"
                  max="0"
                  step="0.5"
                  value={limiterThreshold}
                  onChange={(e) => onLimiterThresholdChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-[#00ff00]"
                  style={{
                    background: gradientStyle,
                  }}
                  aria-label="Master limiter threshold"
                />
                <span className="text-[10px] text-gray-500 font-barlow">0</span>
              </div>
              <div className="text-[10px] font-barlow text-[#00ff00] text-center mt-1">
                {limiterThreshold.toFixed(1)} dB
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Strip - Deck B */}
        <div className="flex flex-col items-center gap-4 p-4 bg-[#1a1a1a]/50 rounded-lg border border-gray-800/50">
          <div className="text-sm font-barlow uppercase text-[#ff00d9] mb-1 font-bold tracking-wider">
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

          {/* EQ Section */}
          <div className="w-full">
            <div className="text-[10px] font-barlow uppercase text-gray-500 mb-2 text-center tracking-wider">
              EQUALIZER
            </div>
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
    </div>
  );
}
