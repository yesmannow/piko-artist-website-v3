"use client";

import { useRef } from 'react';
import { getAudioEngine } from '@/engine/AudioEngine';
import { useAudioStore } from '@/store/useAudioStore';
import { Play, Pause } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '@/utils/haptics';

export const AlwaysOnBottomBar = () => {
  // Get deck states
  const deckAState = useAudioStore((state) => state.decks.deckA);
  const deckBState = useAudioStore((state) => state.decks.deckB);

  // Track previous crossfader value for center detent haptic
  const prevCrossfaderRef = useRef(0.5);

  // Handlers
  const handleDeckAPlayPause = () => {
    // PHASE 3: Use PLAY_TOGGLE pattern
    triggerHaptic(HAPTIC_PATTERNS.PLAY_TOGGLE);
    if (deckAState.isPlaying) {
      getAudioEngine().pause('deckA');
    } else {
      getAudioEngine().play('deckA');
    }
  };

  const handleDeckBPlayPause = () => {
    // PHASE 3: Use PLAY_TOGGLE pattern
    triggerHaptic(HAPTIC_PATTERNS.PLAY_TOGGLE);
    if (deckBState.isPlaying) {
      getAudioEngine().pause('deckB');
    } else {
      getAudioEngine().play('deckB');
    }
  };

  const handleLoadDeckA = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    const testTrack = 'https://archive.org/download/mythium/JLS_ATI.mp3';
    getAudioEngine().loadTrack('deckA', testTrack);
  };

  const handleLoadDeckB = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    const testTrack = 'https://archive.org/download/mythium/JLS_ATI.mp3';
    getAudioEngine().loadTrack('deckB', testTrack);
  };

  const handleCrossfaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const prev = prevCrossfaderRef.current;

    // PHASE 3: Detect crossing the center point with stronger haptic
    const centerThreshold = 0.02; // 2% threshold
    const wasBeforeCenter = prev < (0.5 - centerThreshold);
    const wasAfterCenter = prev > (0.5 + centerThreshold);
    const isAtCenter = Math.abs(value - 0.5) <= centerThreshold;
    
    if ((wasBeforeCenter || wasAfterCenter) && isAtCenter) {
      triggerHaptic(HAPTIC_PATTERNS.CROSSFADER_CENTER);
    }

    prevCrossfaderRef.current = value;
    // TODO: Apply crossfader logic to audio engine
  };

  // PHASE 8: Sync handlers
  const handleSyncA = () => {
    const engine = getAudioEngine();
    const playbackRate = engine.getPlaybackRate('deckA');

    if (playbackRate !== 1.0) {
      // Already synced, unsync
      triggerHaptic(HAPTIC_PATTERNS.CLICK);
      engine.unsync('deckA');
    } else {
      // PHASE 3: Sync enabled pattern
      triggerHaptic(HAPTIC_PATTERNS.SYNC_ENABLE);
      // Sync to Deck B
      engine.sync('deckA', 'deckB');
    }
  };

  const handleSyncB = () => {
    const engine = getAudioEngine();
    const playbackRate = engine.getPlaybackRate('deckB');

    if (playbackRate !== 1.0) {
      // Already synced, unsync
      triggerHaptic(HAPTIC_PATTERNS.CLICK);
      engine.unsync('deckB');
    } else {
      // PHASE 3: Sync enabled pattern
      triggerHaptic(HAPTIC_PATTERNS.SYNC_ENABLE);
      // Sync to Deck A
      engine.sync('deckB', 'deckA');
    }
  };

  // Get playback rates for sync button states
  const deckAPlaybackRate = getAudioEngine().getPlaybackRate('deckA');
  const deckBPlaybackRate = getAudioEngine().getPlaybackRate('deckB');

  return (
    <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4 gap-4">
      {/* Deck A Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleLoadDeckA}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-barlow uppercase font-bold transition-all active:scale-95"
        >
          Load A
        </button>
        <button
          onClick={handleSyncA}
          disabled={!deckAState.url || !deckBState.url}
          className="px-3 py-2 rounded text-xs font-barlow uppercase font-bold transition-all active:scale-95 disabled:opacity-30"
          style={{
            backgroundColor: deckAPlaybackRate !== 1.0 ? '#3b82f6' : '#374151',
            color: deckAPlaybackRate !== 1.0 ? '#ffffff' : '#9ca3af'
          }}
        >
          SYNC
        </button>
        <button
          onClick={handleDeckAPlayPause}
          disabled={!deckAState.url}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          style={{
            backgroundColor: deckAState.isPlaying ? '#ef4444' : '#00d9ff',
            opacity: !deckAState.url ? 0.3 : 1
          }}
        >
          {deckAState.isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </button>
      </div>

      {/* Crossfader */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-md">
        <label className="text-[10px] uppercase text-gray-500 font-barlow tracking-wider">
          Crossfader
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="0.5"
          onChange={handleCrossfaderChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: '#ffffff'
          }}
        />
      </div>

      {/* Deck B Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDeckBPlayPause}
          disabled={!deckBState.url}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          style={{
            backgroundColor: deckBState.isPlaying ? '#ef4444' : '#ff00d9',
            opacity: !deckBState.url ? 0.3 : 1
          }}
        >
          {deckBState.isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </button>
        <button
          onClick={handleSyncB}
          disabled={!deckAState.url || !deckBState.url}
          className="px-3 py-2 rounded text-xs font-barlow uppercase font-bold transition-all active:scale-95 disabled:opacity-30"
          style={{
            backgroundColor: deckBPlaybackRate !== 1.0 ? '#3b82f6' : '#374151',
            color: deckBPlaybackRate !== 1.0 ? '#ffffff' : '#9ca3af'
          }}
        >
          SYNC
        </button>
        <button
          onClick={handleLoadDeckB}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-barlow uppercase font-bold transition-all active:scale-95"
        >
          Load B
        </button>
      </div>
    </div>
  );
};
