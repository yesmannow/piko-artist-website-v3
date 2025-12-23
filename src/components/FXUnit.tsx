"use client";

import { Knob } from "./dj-ui/Knob";

// Map 20Hz-20kHz range to a 0-1 logarithmic knob travel
const FILTER_LOG_OFFSET = 1.3;
const FILTER_LOG_RANGE = 3;
// Cap feedback to prevent runaway echoes
const DELAY_FEEDBACK_MAX = 0.9;

/**
 * Convert a cutoff frequency in Hz to a 0-1 logarithmic knob value.
 * Frequencies are clamped to 20Hz minimum to avoid invalid log inputs.
 * @returns Normalized knob position between 0 and 1.
 */
function normalizeFilterFreq(freq: number) {
  const safeFreq = Math.max(freq, 20);
  return (Math.log10(safeFreq) - FILTER_LOG_OFFSET) / FILTER_LOG_RANGE;
}

/**
 * Convert a normalized knob value back to a cutoff frequency in Hz.
 * @returns Frequency in Hz mapped from a 0-1 knob value.
 */
function denormalizeFilterFreq(value: number) {
  return Math.pow(10, value * FILTER_LOG_RANGE + FILTER_LOG_OFFSET);
}

interface FXUnitProps {
  filterFreq: number;
  filterType: "lowpass" | "highpass";
  onFilterFreqChange: (val: number) => void;
  onFilterTypeChange: (type: "lowpass" | "highpass") => void;
  reverbDryWet: number;
  onReverbDryWetChange: (val: number) => void;
  delayTime: number;
  delayFeedback: number;
  onDelayTimeChange: (val: number) => void;
  onDelayFeedbackChange: (val: number) => void;
  // NEW: Distortion
  distortionAmount: number;
  onDistortionChange: (val: number) => void;
}

export function FXUnit({
  filterFreq, filterType, onFilterFreqChange, onFilterTypeChange,
  reverbDryWet, onReverbDryWetChange,
  delayTime, delayFeedback, onDelayTimeChange, onDelayFeedbackChange,
  distortionAmount, onDistortionChange
}: FXUnitProps) {
  const filterButtonClasses = (type: "lowpass" | "highpass") =>
    `px-2 py-1 text-[10px] rounded border ${
      filterType === type ? "bg-blue-500 text-white border-blue-500" : "border-gray-700 text-gray-500"
    }`;

  return (
    <div className="p-6 bg-[#0a0a0a] rounded-lg border border-gray-800">
      <div className="text-center mb-4">
        <h3 className="text-lg font-barlow uppercase tracking-wider text-gray-300">FX RACK</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* FILTER */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">FILTER</span>
          <div className="flex gap-2 mb-2">
            <button onClick={() => onFilterTypeChange("lowpass")} className={filterButtonClasses("lowpass")}>LPF</button>
            <button onClick={() => onFilterTypeChange("highpass")} className={filterButtonClasses("highpass")}>HPF</button>
          </div>
          <Knob
            value={normalizeFilterFreq(filterFreq)}
            onChange={(v) => onFilterFreqChange(denormalizeFilterFreq(v))}
            label="FREQ"
            min={0}
            max={1}
            size={60}
            color="mid"
          />
        </div>

        {/* NEW: DISTORTION (GRIT) */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">GRIT</span>
          <div className="h-[26px]"></div> {/* Spacer */}
          <Knob value={distortionAmount} onChange={onDistortionChange} label="DRIVE" min={0} max={1} size={60} color="low" />
        </div>

        {/* REVERB */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">REVERB</span>
          <div className="h-[26px]"></div>
          <Knob value={reverbDryWet} onChange={onReverbDryWetChange} label="DRY/WET" min={0} max={1} size={60} color="high" />
        </div>

        {/* DELAY */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">DELAY</span>
          <div className="h-[26px]"></div>
          <div className="flex gap-4">
            <Knob value={delayTime} onChange={onDelayTimeChange} label="TIME" min={0} max={1} size={40} />
            <Knob value={delayFeedback} onChange={onDelayFeedbackChange} label="FDBK" min={0} max={DELAY_FEEDBACK_MAX} size={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
