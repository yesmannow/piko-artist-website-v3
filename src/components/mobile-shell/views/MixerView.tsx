"use client";

import { useRef } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { useAudioStore } from "@/store/useAudioStore";
import { triggerHaptic, HAPTIC_PATTERNS } from "@/utils/haptics";

export const MixerView = () => {
  // Get volumes for both decks
  const volumeA = useAudioStore((state) => state.decks.deckA.volume);
  const volumeB = useAudioStore((state) => state.decks.deckB.volume);
  const masterVolume = useAudioStore((state) => state.masterVolume);
  const setMasterVolume = useAudioStore((state) => state.setMasterVolume);

  // PHASE 3: Track last volume to detect midpoint crossing
  const lastVolumeA = useRef(volumeA);
  const lastVolumeB = useRef(volumeB);
  const lastMaster = useRef(masterVolume);

  /**
   * PHASE 3: Detect if fader crossed midpoint (0.5)
   */
  const checkMidpointCrossing = (prevValue: number, newValue: number) => {
    const midpoint = 0.5;
    const threshold = 0.02; // 2% threshold around midpoint

    // Check if we crossed the midpoint zone
    const wasBeforeMidpoint = prevValue < midpoint - threshold;
    const wasAfterMidpoint = prevValue > midpoint + threshold;
    const isAtMidpoint = Math.abs(newValue - midpoint) <= threshold;

    if ((wasBeforeMidpoint || wasAfterMidpoint) && isAtMidpoint) {
      // Crossed into midpoint zone - trigger haptic
      triggerHaptic(HAPTIC_PATTERNS.FADER_MIDPOINT);
    }
  };

  const handleVolumeChange = async (
    deckId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = parseFloat(e.target.value);

    // PHASE 3: Check for midpoint crossing
    const lastVol =
      deckId === "deckA" ? lastVolumeA.current : lastVolumeB.current;
    checkMidpointCrossing(lastVol, val);

    // Update last volume
    if (deckId === "deckA") {
      lastVolumeA.current = val;
    } else {
      lastVolumeB.current = val;
    }

    const engine = await ensureAudioEngineReady();
    engine.setVolume(deckId, val);
  };

  const handleMasterVolumeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = parseFloat(e.target.value);

    // PHASE 3: Check for midpoint crossing
    checkMidpointCrossing(lastMaster.current, val);
    lastMaster.current = val;

    setMasterVolume(val);
    const engine = await ensureAudioEngineReady();
    await engine.setMasterVolume(val);
  };

  return (
    <div className="h-full w-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex-none text-center py-3 bg-gray-900/50 border-b border-gray-800">
        <h2 className="text-sm font-barlow uppercase tracking-wider text-gray-300">
          Mixer
        </h2>
      </div>

      {/* Faders Grid */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-6">
        {/* Deck A Fader */}
        <div className="flex flex-col items-center gap-3 h-full">
          <div className="text-xs font-barlow uppercase text-[#00d9ff] font-bold tracking-wider">
            DECK A
          </div>

          <div className="flex-1 flex items-center justify-center gap-2 w-full">
            {/* VU Meter placeholder - requires analyser node */}
            <div className="w-8 h-32 bg-gray-800 rounded flex flex-col justify-end p-1">
              <div
                className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded transition-all duration-75"
                style={{ height: `${volumeA * 100}%` }}
              />
            </div>

            {/* Fader */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 h-full">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumeA}
                onChange={(e) => handleVolumeChange("deckA", e)}
                className="w-3 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: "#00d9ff",
                  writingMode: "vertical-lr",
                  direction: "rtl",
                }}
              />
              <div className="text-lg text-[#00d9ff] font-mono font-bold">
                {Math.round(volumeA * 100)}
              </div>
            </div>
          </div>
        </div>

        {/* Master Fader */}
        <div className="flex flex-col items-center gap-3 h-full">
          <div className="text-xs font-barlow uppercase text-white font-bold tracking-wider">
            MASTER
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-3 w-full">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={handleMasterVolumeChange}
              className="w-3 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: "#ffffff",
                writingMode: "vertical-lr",
                direction: "rtl",
              }}
            />
            <div className="text-lg text-white font-mono font-bold">
              {Math.round(masterVolume * 100)}
            </div>
          </div>
        </div>

        {/* Deck B Fader */}
        <div className="flex flex-col items-center gap-3 h-full">
          <div className="text-xs font-barlow uppercase text-[#ff00d9] font-bold tracking-wider">
            DECK B
          </div>

          <div className="flex-1 flex items-center justify-center gap-2 w-full">
            {/* Fader */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 h-full">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumeB}
                onChange={(e) => handleVolumeChange("deckB", e)}
                className="w-3 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: "#ff00d9",
                  writingMode: "vertical-lr",
                  direction: "rtl",
                }}
              />
              <div className="text-lg text-[#ff00d9] font-mono font-bold">
                {Math.round(volumeB * 100)}
              </div>
            </div>

            {/* VU Meter placeholder - requires analyser node */}
            <div className="w-8 h-32 bg-gray-800 rounded flex flex-col justify-end p-1">
              <div
                className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded transition-all duration-75"
                style={{ height: `${volumeB * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
