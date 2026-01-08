"use client";

import { getAudioEngine } from '@/engine/AudioEngine';
import { useAudioStore } from '@/store/useAudioStore';
import { VUMeter } from '../VUMeter';

export const MixerView = () => {
  // Get volumes for both decks
  const volumeA = useAudioStore((state) => state.decks.deckA.volume);
  const volumeB = useAudioStore((state) => state.decks.deckB.volume);
  const masterVolume = useAudioStore((state) => state.masterVolume);
  const setMasterVolume = useAudioStore((state) => state.setMasterVolume);

  const handleVolumeChange = (deckId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    getAudioEngine().setVolume(deckId, val);
  };

  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMasterVolume(val);
    // Note: Master volume control would need to be added to AudioEngine
    // For now, this just updates the store
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
            {/* VU Meter */}
            <VUMeter deckId="deckA" />
            
            {/* Fader */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 h-full">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volumeA}
                onChange={(e) => handleVolumeChange('deckA', e)}
                className="w-3 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: '#00d9ff',
                  writingMode: 'vertical-lr',
                  direction: 'rtl'
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
                accentColor: '#ffffff',
                writingMode: 'vertical-lr',
                direction: 'rtl'
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
                onChange={(e) => handleVolumeChange('deckB', e)}
                className="w-3 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: '#ff00d9',
                  writingMode: 'vertical-lr',
                  direction: 'rtl'
                }}
              />
              <div className="text-lg text-[#ff00d9] font-mono font-bold">
                {Math.round(volumeB * 100)}
              </div>
            </div>
            
            {/* VU Meter */}
            <VUMeter deckId="deckB" />
          </div>
        </div>
      </div>
    </div>
  );
};
