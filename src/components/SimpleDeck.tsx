"use client";

import { getAudioEngine } from '@/engine/AudioEngine';
import { useAudioStore } from '@/store/useAudioStore';

interface SimpleDeckProps {
  deckId: 'deckA' | 'deckB';
  deckColor: string;
  deckLabel: string;
}

export const SimpleDeck = ({ deckId, deckColor, deckLabel }: SimpleDeckProps) => {
  // 1. SELECT only what we need from the store to prevent re-renders
  const deckState = useAudioStore((state) => state.decks[deckId]);
  const { isPlaying, url, volume, currentTime, duration } = deckState;

  // 2. HANDLERS call the Engine directly
  const handlePlayPause = () => {
    if (isPlaying) {
      getAudioEngine().pause(deckId);
    } else {
      getAudioEngine().play(deckId);
    }
  };

  const handleLoadTrack = () => {
    // CORS-friendly test track from Internet Archive
    const testTrack = 'https://archive.org/download/mythium/JLS_ATI.mp3';
    getAudioEngine().loadTrack(deckId, testTrack);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    getAudioEngine().setVolume(deckId, val);
  };

  return (
    <div 
      className="flex flex-col gap-4 p-6 bg-[#0a0a0a] rounded-lg border-2 border-gray-800"
      style={{ borderColor: deckColor }}
    >
      {/* Header */}
      <div className="text-center">
        <h3 
          className="text-xl font-barlow uppercase tracking-wider font-bold mb-2"
          style={{ color: deckColor }}
        >
          {deckLabel}
        </h3>
      </div>

      {/* Status Display */}
      <div className="bg-[#1a1a1a] p-4 rounded border border-gray-700 text-sm font-mono">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Status:</span>
          <span 
            className="font-bold"
            style={{ color: isPlaying ? deckColor : '#666' }}
          >
            {isPlaying ? 'PLAYING' : 'PAUSED'}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Loaded:</span>
          <span className="text-white">{url ? 'Yes' : 'No'}</span>
        </div>
        {url && (
          <>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Time:</span>
              <span className="text-white">
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volume:</span>
              <span className="text-white">{Math.round(volume * 100)}%</span>
            </div>
          </>
        )}
      </div>

      {/* Volume Slider */}
      {url && (
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase text-gray-400 font-barlow tracking-wider">
            Volume
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: deckColor
            }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button 
          onClick={handleLoadTrack}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95"
        >
          Load Test Track
        </button>
        
        <button 
          onClick={handlePlayPause}
          disabled={!url}
          className="px-6 py-3 rounded-lg font-barlow uppercase text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isPlaying ? '#ef4444' : '#22c55e',
            opacity: !url ? 0.5 : 1
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
};
