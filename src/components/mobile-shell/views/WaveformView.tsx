"use client";

import { useUIStore } from '@/store/useUIStore';
import { Music } from 'lucide-react';

export const WaveformView = () => {
  const openLibrary = useUIStore((state) => state.openLibrary);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex-none text-center py-2 bg-gray-900/50">
        <h2 className="text-sm font-barlow uppercase tracking-wider text-gray-400">
          Waveforms
        </h2>
      </div>

      {/* Deck Placeholders */}
      <div className="flex-1 flex gap-2 p-2">
        {/* Deck A */}
        <div 
          className="flex-1 rounded-lg border-2 flex items-center justify-center relative"
          style={{ 
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderColor: '#00d9ff'
          }}
        >
          <div className="text-center">
            <div 
              className="text-4xl font-barlow uppercase tracking-wider font-bold mb-4"
              style={{ color: '#00d9ff' }}
            >
              DECK A
            </div>
            <div className="text-xs text-gray-500 mb-6">
              Waveform visualization coming soon
            </div>
            
            {/* Load Button */}
            <button
              onClick={() => openLibrary('deckA')}
              className="px-8 py-4 rounded-lg font-barlow uppercase text-lg font-bold transition-all active:scale-95 flex items-center gap-2 mx-auto"
              style={{
                backgroundColor: '#00d9ff',
                color: '#000'
              }}
            >
              <Music className="w-5 h-5" />
              LOAD TRACK
            </button>
          </div>
        </div>

        {/* Deck B */}
        <div 
          className="flex-1 rounded-lg border-2 flex items-center justify-center relative"
          style={{ 
            backgroundColor: 'rgba(255, 0, 217, 0.1)',
            borderColor: '#ff00d9'
          }}
        >
          <div className="text-center">
            <div 
              className="text-4xl font-barlow uppercase tracking-wider font-bold mb-4"
              style={{ color: '#ff00d9' }}
            >
              DECK B
            </div>
            <div className="text-xs text-gray-500 mb-6">
              Waveform visualization coming soon
            </div>
            
            {/* Load Button */}
            <button
              onClick={() => openLibrary('deckB')}
              className="px-8 py-4 rounded-lg font-barlow uppercase text-lg font-bold transition-all active:scale-95 flex items-center gap-2 mx-auto"
              style={{
                backgroundColor: '#ff00d9',
                color: '#000'
              }}
            >
              <Music className="w-5 h-5" />
              LOAD TRACK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
