"use client";

import { Knob } from "./dj-ui/Knob";

interface FXUnitProps {
  // Filter controls (LPF/HPF)
  filterFreq: number; // 20-20000 Hz, center at 1000
  filterType: "lowpass" | "highpass";
  onFilterFreqChange: (freq: number) => void;
  onFilterTypeChange: (type: "lowpass" | "highpass") => void;

  // Reverb controls
  reverbDryWet: number; // 0 to 1
  onReverbDryWetChange: (value: number) => void;

  // Delay controls
  delayTime: number; // 0 to 1 (maps to 0-1000ms)
  delayFeedback: number; // 0 to 1
  onDelayTimeChange: (value: number) => void;
  onDelayFeedbackChange: (value: number) => void;
}

export function FXUnit({
  filterFreq,
  filterType,
  onFilterFreqChange,
  onFilterTypeChange,
  reverbDryWet,
  onReverbDryWetChange,
  delayTime,
  delayFeedback,
  onDelayTimeChange,
  onDelayFeedbackChange,
}: FXUnitProps) {
  // Map frequency to 0-1 range (20-20000 Hz, logarithmic)
  const freqValue = (Math.log(filterFreq / 20) / Math.log(20000 / 20));
  const handleFreqChange = (value: number) => {
    // Map 0-1 to 20-20000 Hz (logarithmic)
    const newFreq = 20 * Math.pow(20000 / 20, value);
    onFilterFreqChange(newFreq);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800">
      <h3 className="text-lg font-barlow uppercase tracking-wider text-gray-300 text-center mb-2">
        FX RACK
      </h3>

      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {/* Filter Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
            FILTER
          </div>

          {/* Filter Type Toggle */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => onFilterTypeChange("lowpass")}
              className={`px-3 py-1 text-xs font-barlow uppercase rounded border transition-colors ${
                filterType === "lowpass"
                  ? "bg-[#2a2a2a] border-gray-600 text-white"
                  : "bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              LPF
            </button>
            <button
              onClick={() => onFilterTypeChange("highpass")}
              className={`px-3 py-1 text-xs font-barlow uppercase rounded border transition-colors ${
                filterType === "highpass"
                  ? "bg-[#2a2a2a] border-gray-600 text-white"
                  : "bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              HPF
            </button>
          </div>

          <Knob
            value={freqValue}
            onChange={handleFreqChange}
            label="FREQ"
            min={0}
            max={1}
            size={60}
          />
          <div className="text-xs text-gray-500 font-barlow text-center">
            {filterFreq.toFixed(0)} Hz
          </div>
        </div>

        {/* Reverb Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
            REVERB
          </div>
          <Knob
            value={reverbDryWet}
            onChange={onReverbDryWetChange}
            label="DRY/WET"
            min={0}
            max={1}
            size={60}
          />
          <div className="text-xs text-gray-500 font-barlow text-center">
            {Math.round(reverbDryWet * 100)}%
          </div>
        </div>

        {/* Delay Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
            DELAY
          </div>
          <div className="flex flex-col gap-2">
            <Knob
              value={delayTime}
              onChange={onDelayTimeChange}
              label="TIME"
              min={0}
              max={1}
              size={50}
            />
            <Knob
              value={delayFeedback}
              onChange={onDelayFeedbackChange}
              label="FEEDBACK"
              min={0}
              max={1}
              size={50}
            />
          </div>
          <div className="text-xs text-gray-500 font-barlow text-center">
            {Math.round(delayTime * 1000)}ms / {Math.round(delayFeedback * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

