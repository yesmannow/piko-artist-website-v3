"use client";

import { useUIStore } from '@/store/useUIStore';
import { WaveformView } from './views/WaveformView';
import { MixerView } from './views/MixerView';
import { FXView } from './views/FXView';

export const MainDeckContainer = () => {
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case 'WAVEFORM':
        return <WaveformView />;
      case 'MIXER':
        return <MixerView />;
      case 'FX':
        return <FXView />;
      default:
        return <WaveformView />;
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      {/* Active View */}
      <div className="h-full w-full">
        {renderView()}
      </div>

      {/* Navigation Tabs - Left Edge */}
      <button
        onClick={() => setActiveView('WAVEFORM')}
        className={`absolute left-0 top-0 h-full w-10 flex items-center justify-center transition-all ${
          activeView === 'WAVEFORM' 
            ? 'bg-[#00d9ff]/30 border-r-2 border-[#00d9ff]' 
            : 'bg-gray-900/50 border-r border-gray-700'
        }`}
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        <span 
          className={`text-xs font-barlow uppercase tracking-wider font-bold ${
            activeView === 'WAVEFORM' ? 'text-[#00d9ff]' : 'text-gray-500'
          }`}
        >
          DECKS
        </span>
      </button>

      {/* Navigation Tabs - Right Edge (Top Half - MIXER) */}
      <button
        onClick={() => setActiveView('MIXER')}
        className={`absolute right-0 top-0 h-1/2 w-10 flex items-center justify-center transition-all ${
          activeView === 'MIXER' 
            ? 'bg-[#ff00d9]/30 border-l-2 border-[#ff00d9]' 
            : 'bg-gray-900/50 border-l border-gray-700'
        }`}
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        <span 
          className={`text-xs font-barlow uppercase tracking-wider font-bold ${
            activeView === 'MIXER' ? 'text-[#ff00d9]' : 'text-gray-500'
          }`}
        >
          MIXER
        </span>
      </button>

      {/* Navigation Tabs - Right Edge (Bottom Half - FX) */}
      <button
        onClick={() => setActiveView('FX')}
        className={`absolute right-0 bottom-0 h-1/2 w-10 flex items-center justify-center transition-all border-t ${
          activeView === 'FX' 
            ? 'bg-purple-500/30 border-l-2 border-purple-500' 
            : 'bg-gray-900/50 border-l border-gray-700'
        }`}
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        <span 
          className={`text-xs font-barlow uppercase tracking-wider font-bold ${
            activeView === 'FX' ? 'text-purple-400' : 'text-gray-500'
          }`}
        >
          FX
        </span>
      </button>
    </div>
  );
};
