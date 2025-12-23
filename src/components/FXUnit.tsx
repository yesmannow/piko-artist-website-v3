"use client";

import { Knob } from "./dj-ui/Knob";

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
            <button onClick={() => onFilterTypeChange("lowpass")} className={`px-2 py-1 text-[10px] rounded border ${filterType === "lowpass" ? "bg-blue-500 text-white border-blue-500" : "border-gray-700 text-gray-500"}`}>LPF</button>
            <button onClick={() => onFilterTypeChange("highpass")} className={`px-2 py-1 text-[10px] rounded border ${filterType === "highpass" ? "bg-blue-500 text-white border-blue-500" : "border-gray-700 text-gray-500"}`}>HPF</button>
          </div>
          <Knob value={(Math.log10(filterFreq) - 1.3) / 3} onChange={(v) => onFilterFreqChange(Math.pow(10, v * 3 + 1.3))} label="FREQ" min={0} max={1} size={60} color="mid" />
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
             <Knob value={delayFeedback} onChange={onDelayFeedbackChange} label="FDBK" min={0} max={0.9} size={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
