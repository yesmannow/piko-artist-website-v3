"use client";

import { useSpring, animated } from '@react-spring/web';
import { useUIStore } from '@/store/useUIStore';
import { ensureAudioEngineReady } from '@/engine/AudioEngine';
import { X, Music } from 'lucide-react';

const MOCK_TRACKS = [
  { title: "JLS - ATI (Techno)", url: "https://archive.org/download/mythium/JLS_ATI.mp3" },
  { title: "BS - TF (House)", url: "https://archive.org/download/mythium/BS_TF.mp3" },
  { title: "SS - BF (DnB)", url: "https://archive.org/download/mythium/SS_BF.mp3" },
];

export const LibraryDrawer = () => {
  const isLibraryOpen = useUIStore((state) => state.isLibraryOpen);
  const libraryTargetDeck = useUIStore((state) => state.libraryTargetDeck);
  const closeLibrary = useUIStore((state) => state.closeLibrary);

  // Animate drawer slide up/down
  const springProps = useSpring({
    transform: isLibraryOpen ? 'translateY(0%)' : 'translateY(100%)',
    config: { tension: 280, friction: 30 },
  });

  const handleTrackSelect = async (track: typeof MOCK_TRACKS[0]) => {
    // Load track into target deck
    const engine = await ensureAudioEngineReady();
    engine.loadTrack(libraryTargetDeck, track.url);
    // Close drawer
    closeLibrary();
  };

  return (
    <animated.div
      style={springProps}
      className="fixed bottom-0 left-0 w-full h-[90vh] bg-gray-900 z-50 flex flex-col border-t-2 border-gray-700 shadow-2xl"
    >
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-barlow uppercase tracking-wider text-white font-bold">
            Track Library
          </h2>
          <span className="text-xs text-gray-500 font-mono">
            → {libraryTargetDeck === 'deckA' ? 'DECK A' : 'DECK B'}
          </span>
        </div>
        <button
          onClick={closeLibrary}
          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all active:scale-95"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {MOCK_TRACKS.map((track, index) => (
            <button
              key={index}
              onClick={() => handleTrackSelect(track)}
              className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all active:scale-98 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-barlow font-bold truncate">
                    {track.title}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {track.url}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State Hint */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>More tracks coming soon...</p>
          <p className="text-xs mt-2">Tap any track to load it into {libraryTargetDeck === 'deckA' ? 'Deck A' : 'Deck B'}</p>
        </div>
      </div>
    </animated.div>
  );
};
