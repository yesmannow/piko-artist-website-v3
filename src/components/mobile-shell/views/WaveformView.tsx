"use client";

import { useUIStore } from "@/store/useUIStore";
import { useAudioStore } from "@/store/useAudioStore";
import { Music } from "lucide-react";
import { WaveformCanvas } from "./WaveformCanvas";
import { ScrubLayer } from "./ScrubLayer";

export const WaveformView = () => {
  const openLibrary = useUIStore((state) => state.openLibrary);
  const deckAState = useAudioStore((state) => state.decks.deckA);
  const deckBState = useAudioStore((state) => state.decks.deckB);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex-none text-center py-2 bg-gray-900/50">
        <h2 className="text-sm font-barlow uppercase tracking-wider text-gray-400">
          Waveforms
        </h2>
      </div>

      {/* Deck Waveforms */}
      <div className="flex-1 flex flex-col gap-2 p-2">
        {/* Deck A */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <div
              className="text-lg font-barlow uppercase tracking-wider font-bold"
              style={{ color: "#00d9ff" }}
            >
              DECK A
            </div>
            <button
              onClick={() => openLibrary("deckA")}
              className="px-4 py-2 rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
              style={{
                backgroundColor: "#00d9ff",
                color: "#000",
              }}
            >
              <Music className="w-4 h-4" />
              LOAD
            </button>
          </div>

          {/* Waveform Container */}
          <div
            className="relative flex-1 rounded-lg border-2 overflow-hidden"
            style={{
              backgroundColor: "rgba(0, 217, 255, 0.05)",
              borderColor: "#00d9ff",
              minHeight: "80px",
            }}
          >
            {deckAState.url ? (
              <>
                <WaveformCanvas deckId="deckA" color="#00d9ff" />
                <ScrubLayer deckId="deckA" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-xs">No track loaded</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deck B */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <div
              className="text-lg font-barlow uppercase tracking-wider font-bold"
              style={{ color: "#ff00d9" }}
            >
              DECK B
            </div>
            <button
              onClick={() => openLibrary("deckB")}
              className="px-4 py-2 rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
              style={{
                backgroundColor: "#ff00d9",
                color: "#000",
              }}
            >
              <Music className="w-4 h-4" />
              LOAD
            </button>
          </div>

          {/* Waveform Container */}
          <div
            className="relative flex-1 rounded-lg border-2 overflow-hidden"
            style={{
              backgroundColor: "rgba(255, 0, 217, 0.05)",
              borderColor: "#ff00d9",
              minHeight: "80px",
            }}
          >
            {deckBState.url ? (
              <>
                <WaveformCanvas deckId="deckB" color="#ff00d9" />
                <ScrubLayer deckId="deckB" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-xs">No track loaded</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
