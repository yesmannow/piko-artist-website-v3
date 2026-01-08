"use client";

import { getAudioEngine } from '@/engine/AudioEngine';
import { useAudioStore } from '@/store/useAudioStore';

export const SimpleMixer = () => {
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
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 shadow-lg">
      <div className="text-center">
        <h3 className="text-lg font-barlow uppercase tracking-wider text-gray-300 mb-2">
          MIXER
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Deck A Fader */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm font-barlow uppercase text-[#00d9ff] font-bold tracking-wider">
            DECK A
          </div>
          
          <div className="flex flex-col items-center gap-2 h-48">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volumeA}
              onChange={(e) => handleVolumeChange('deckA', e)}
              className="w-2 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: '#00d9ff',
                writingMode: 'vertical-lr',
                direction: 'rtl'
              }}
            />
            <div className="text-xs text-gray-400 font-mono">
              {Math.round(volumeA * 100)}%
            </div>
          </div>
        </div>

        {/* Master Fader */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm font-barlow uppercase text-white font-bold tracking-wider">
            MASTER
          </div>
          
          <div className="flex flex-col items-center gap-2 h-48">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={masterVolume}
              onChange={handleMasterVolumeChange}
              className="w-2 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: '#ffffff',
                writingMode: 'vertical-lr',
                direction: 'rtl'
              }}
            />
            <div className="text-xs text-gray-400 font-mono">
              {Math.round(masterVolume * 100)}%
            </div>
          </div>
        </div>

        {/* Deck B Fader */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm font-barlow uppercase text-[#ff00d9] font-bold tracking-wider">
            DECK B
          </div>
          
          <div className="flex flex-col items-center gap-2 h-48">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volumeB}
              onChange={(e) => handleVolumeChange('deckB', e)}
              className="w-2 h-full bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: '#ff00d9',
                writingMode: 'vertical-lr',
                direction: 'rtl'
              }}
            />
            <div className="text-xs text-gray-400 font-mono">
              {Math.round(volumeB * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
