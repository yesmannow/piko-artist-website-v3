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
  // Deck A FX
  filterFreqA: number;
  filterTypeA: "lowpass" | "highpass" | "bandpass";
  onFilterFreqChangeA: (val: number) => void;
  onFilterTypeChangeA: (type: "lowpass" | "highpass" | "bandpass") => void;
  reverbDryWetA: number;
  onReverbDryWetChangeA: (val: number) => void;
  delayTimeA: number;
  delayFeedbackA: number;
  onDelayTimeChangeA: (val: number) => void;
  onDelayFeedbackChangeA: (val: number) => void;
  distortionAmountA: number;
  onDistortionChangeA: (val: number) => void;
  // Deck B FX
  filterFreqB: number;
  filterTypeB: "lowpass" | "highpass" | "bandpass";
  onFilterFreqChangeB: (val: number) => void;
  onFilterTypeChangeB: (type: "lowpass" | "highpass" | "bandpass") => void;
  reverbDryWetB: number;
  onReverbDryWetChangeB: (val: number) => void;
  delayTimeB: number;
  delayFeedbackB: number;
  onDelayTimeChangeB: (val: number) => void;
  onDelayFeedbackChangeB: (val: number) => void;
  distortionAmountB: number;
  onDistortionChangeB: (val: number) => void;
  // Active deck toggle
  activeDeck: "A" | "B";
  onActiveDeckChange: (deck: "A" | "B") => void;
  // Clear All handlers
  onClearAllA?: () => void;
  onClearAllB?: () => void;
  // Bypass states
  filterBypassA?: boolean;
  filterBypassB?: boolean;
  reverbBypassA?: boolean;
  reverbBypassB?: boolean;
  delayBypassA?: boolean;
  delayBypassB?: boolean;
  distortionBypassA?: boolean;
  distortionBypassB?: boolean;
  onFilterBypassChangeA?: (bypass: boolean) => void;
  onFilterBypassChangeB?: (bypass: boolean) => void;
  onReverbBypassChangeA?: (bypass: boolean) => void;
  onReverbBypassChangeB?: (bypass: boolean) => void;
  onDelayBypassChangeA?: (bypass: boolean) => void;
  onDelayBypassChangeB?: (bypass: boolean) => void;
  onDistortionBypassChangeA?: (bypass: boolean) => void;
  onDistortionBypassChangeB?: (bypass: boolean) => void;
}

export function FXUnit({
  filterFreqA, filterTypeA, onFilterFreqChangeA, onFilterTypeChangeA,
  reverbDryWetA, onReverbDryWetChangeA,
  delayTimeA, delayFeedbackA, onDelayTimeChangeA, onDelayFeedbackChangeA,
  distortionAmountA, onDistortionChangeA,
  filterFreqB, filterTypeB, onFilterFreqChangeB, onFilterTypeChangeB,
  reverbDryWetB, onReverbDryWetChangeB,
  delayTimeB, delayFeedbackB, onDelayTimeChangeB, onDelayFeedbackChangeB,
  distortionAmountB, onDistortionChangeB,
  activeDeck, onActiveDeckChange,
  onClearAllA, onClearAllB,
  filterBypassA = false, filterBypassB = false,
  reverbBypassA = false, reverbBypassB = false,
  delayBypassA = false, delayBypassB = false,
  distortionBypassA = false, distortionBypassB = false,
  onFilterBypassChangeA, onFilterBypassChangeB,
  onReverbBypassChangeA, onReverbBypassChangeB,
  onDelayBypassChangeA, onDelayBypassChangeB,
  onDistortionBypassChangeA, onDistortionBypassChangeB,
}: FXUnitProps) {
  // Select active deck's values
  const filterFreq = activeDeck === "A" ? filterFreqA : filterFreqB;
  const filterType = activeDeck === "A" ? filterTypeA : filterTypeB;
  const onFilterFreqChange = activeDeck === "A" ? onFilterFreqChangeA : onFilterFreqChangeB;
  const onFilterTypeChange = activeDeck === "A" ? onFilterTypeChangeA : onFilterTypeChangeB;
  const reverbDryWet = activeDeck === "A" ? reverbDryWetA : reverbDryWetB;
  const onReverbDryWetChange = activeDeck === "A" ? onReverbDryWetChangeA : onReverbDryWetChangeB;
  const delayTime = activeDeck === "A" ? delayTimeA : delayTimeB;
  const delayFeedback = activeDeck === "A" ? delayFeedbackA : delayFeedbackB;
  const onDelayTimeChange = activeDeck === "A" ? onDelayTimeChangeA : onDelayTimeChangeB;
  const onDelayFeedbackChange = activeDeck === "A" ? onDelayFeedbackChangeA : onDelayFeedbackChangeB;
  const distortionAmount = activeDeck === "A" ? distortionAmountA : distortionAmountB;
  const onDistortionChange = activeDeck === "A" ? onDistortionChangeA : onDistortionChangeB;

  // Bypass states for active deck
  const filterBypass = activeDeck === "A" ? filterBypassA : filterBypassB;
  const reverbBypass = activeDeck === "A" ? reverbBypassA : reverbBypassB;
  const delayBypass = activeDeck === "A" ? delayBypassA : delayBypassB;
  const distortionBypass = activeDeck === "A" ? distortionBypassA : distortionBypassB;
  const onFilterBypassChange = activeDeck === "A" ? onFilterBypassChangeA : onFilterBypassChangeB;
  const onReverbBypassChange = activeDeck === "A" ? onReverbBypassChangeA : onReverbBypassChangeB;
  const onDelayBypassChange = activeDeck === "A" ? onDelayBypassChangeA : onDelayBypassChangeB;
  const onDistortionBypassChange = activeDeck === "A" ? onDistortionBypassChangeA : onDistortionBypassChangeB;

  const filterButtonClasses = (type: "lowpass" | "highpass" | "bandpass") =>
    `px-2 py-1 text-[10px] rounded border transition-colors ${
      filterType === type ? "bg-blue-500 text-white border-blue-500" : "border-gray-700 text-gray-500 hover:border-gray-600"
    }`;

  return (
    <div className="p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800">
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 flex-wrap">
        <h3 className="text-base md:text-lg font-barlow uppercase tracking-wider text-gray-300">FX RACK</h3>
        {/* Deck Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => onActiveDeckChange("A")}
            className={`px-2 py-1.5 md:px-3 md:py-1 text-xs font-barlow uppercase tracking-wider rounded border-2 transition-all touch-manipulation ${
              activeDeck === "A"
                ? "bg-[#00d9ff] text-white border-[#00d9ff]"
                : "border-gray-700 text-gray-400 hover:border-gray-600 active:bg-gray-800"
            }`}
          >
            DECK A
          </button>
          <button
            onClick={() => onActiveDeckChange("B")}
            className={`px-2 py-1.5 md:px-3 md:py-1 text-xs font-barlow uppercase tracking-wider rounded border-2 transition-all touch-manipulation ${
              activeDeck === "B"
                ? "bg-[#ff00d9] text-white border-[#ff00d9]"
                : "border-gray-700 text-gray-400 hover:border-gray-600 active:bg-gray-800"
            }`}
          >
            DECK B
          </button>
        </div>
        {/* Clear All Button */}
        {(onClearAllA || onClearAllB) && (
          <button
            onClick={() => {
              if (activeDeck === "A" && onClearAllA) {
                onClearAllA();
              } else if (activeDeck === "B" && onClearAllB) {
                onClearAllB();
              }
            }}
            className="px-2 py-1.5 md:px-3 md:py-1 text-xs font-barlow uppercase tracking-wider rounded border-2 border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-500 transition-all touch-manipulation active:bg-red-500/20"
            title="Reset all FX settings to default"
            aria-label="Clear all FX settings"
          >
            CLEAR ALL
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {/* FILTER */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">FILTER</span>
            {onFilterBypassChange && (
              <button
                onClick={() => onFilterBypassChange(!filterBypass)}
                className={`px-2 py-0.5 text-[10px] font-barlow uppercase rounded border transition-all touch-manipulation ${
                  filterBypass
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title={filterBypass ? "Enable filter" : "Bypass filter"}
                aria-label={filterBypass ? "Enable filter" : "Bypass filter"}
              >
                {filterBypass ? "ON" : "BYP"}
              </button>
            )}
          </div>
          <div className="flex gap-1 mb-2 flex-wrap justify-center">
            <button onClick={() => onFilterTypeChange("lowpass")} className={filterButtonClasses("lowpass")}>LPF</button>
            <button onClick={() => onFilterTypeChange("highpass")} className={filterButtonClasses("highpass")}>HPF</button>
            <button onClick={() => onFilterTypeChange("bandpass")} className={filterButtonClasses("bandpass")}>BPF</button>
          </div>
          <Knob
            value={normalizeFilterFreq(filterFreq)}
            onChange={(v) => onFilterFreqChange(denormalizeFilterFreq(v))}
            label="FREQ"
            min={0}
            max={1}
            size={typeof window !== "undefined" && window.innerWidth < 768 ? 70 : 60}
            color="mid"
            helpText="Adjusts filter cutoff frequency. LPF = Low Pass, HPF = High Pass, BPF = Band Pass"
          />
        </div>

        {/* DISTORTION (GRIT) */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">GRIT</span>
            {onDistortionBypassChange && (
              <button
                onClick={() => onDistortionBypassChange(!distortionBypass)}
                className={`px-2 py-0.5 text-[10px] font-barlow uppercase rounded border transition-all touch-manipulation ${
                  distortionBypass
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title={distortionBypass ? "Enable distortion" : "Bypass distortion"}
                aria-label={distortionBypass ? "Enable distortion" : "Bypass distortion"}
              >
                {distortionBypass ? "ON" : "BYP"}
              </button>
            )}
          </div>
          <div className="h-[26px]"></div> {/* Spacer */}
          <Knob value={distortionAmount} onChange={onDistortionChange} label="DRIVE" min={0} max={1} size={typeof window !== "undefined" && window.innerWidth < 768 ? 70 : 60} color="low" />
        </div>

        {/* REVERB */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">REVERB</span>
            {onReverbBypassChange && (
              <button
                onClick={() => onReverbBypassChange(!reverbBypass)}
                className={`px-2 py-0.5 text-[10px] font-barlow uppercase rounded border transition-all touch-manipulation ${
                  reverbBypass
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title={reverbBypass ? "Enable reverb" : "Bypass reverb"}
                aria-label={reverbBypass ? "Enable reverb" : "Bypass reverb"}
              >
                {reverbBypass ? "ON" : "BYP"}
              </button>
            )}
          </div>
          <div className="h-[26px]"></div>
          <Knob value={reverbDryWet} onChange={onReverbDryWetChange} label="DRY/WET" min={0} max={1} size={typeof window !== "undefined" && window.innerWidth < 768 ? 70 : 60} color="high" />
        </div>

        {/* DELAY */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">DELAY</span>
            {onDelayBypassChange && (
              <button
                onClick={() => onDelayBypassChange(!delayBypass)}
                className={`px-2 py-0.5 text-[10px] font-barlow uppercase rounded border transition-all touch-manipulation ${
                  delayBypass
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
                title={delayBypass ? "Enable delay" : "Bypass delay"}
                aria-label={delayBypass ? "Enable delay" : "Bypass delay"}
              >
                {delayBypass ? "ON" : "BYP"}
              </button>
            )}
          </div>
          <div className="h-[26px]"></div>
          <div className="flex gap-3 md:gap-4">
            <Knob value={delayTime} onChange={onDelayTimeChange} label="TIME" min={0} max={1} size={typeof window !== "undefined" && window.innerWidth < 768 ? 50 : 40} />
            <Knob value={delayFeedback} onChange={onDelayFeedbackChange} label="FDBK" min={0} max={DELAY_FEEDBACK_MAX} size={typeof window !== "undefined" && window.innerWidth < 768 ? 50 : 40} />
          </div>
        </div>
      </div>
    </div>
  );
}
