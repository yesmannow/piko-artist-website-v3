/**
 * Example: Integrating 3D Jog Wheels into Deck.tsx
 *
 * This file shows how to add a toggle between 2D and 3D jog wheel modes
 * in the existing Deck component.
 */

import { useState, useEffect } from 'react';
import { JogWheel } from './JogWheel';
import { JogWheel3DWrapper } from './JogWheel3DWrapper';

// Add to Deck component
function Deck({ deckId, showMiniWaveform = true, complexityMode = 'pro' }: DeckProps) {
  // ... existing state ...

  // Add 3D mode state
  const [is3DMode, setIs3DMode] = useState(false);

  // Load 3D preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('jogWheel3DMode');
    if (stored === 'true') {
      setIs3DMode(true);
    }
  }, []);

  // Toggle handler
  const toggle3DMode = () => {
    const newMode = !is3DMode;
    setIs3DMode(newMode);
    localStorage.setItem('jogWheel3DMode', newMode.toString());
  };

  // ... existing code ...

  return (
    <div ref={deckRef} className="deck-container" data-deck-id={deckId}>
      <GlassPanel className="p-6">

        {/* 3D Mode Toggle Button (add to header) */}
        <div className="flex justify-between items-center mb-4">
          <StateBadge label={deckLabel} color={deckColor} />

          <button
            onClick={toggle3DMode}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider
              transition-all duration-200
              ${is3DMode
                ? 'bg-studio-cyan text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
              }
            `}
            title="Toggle 3D Jog Wheel Mode"
          >
            {is3DMode ? '3D Mode' : '2D Mode'}
          </button>
        </div>

        {/* Conditional Jog Wheel Rendering */}
        <div className="jog-wheel-container mb-6">
          {is3DMode ? (
            <JogWheel3DWrapper
              deckId={deckId}
              artworkUrl={trackData?.artUrl}
              progress={progress}
              isPlaying={deck.isPlaying}
              bpm={currentBpm}
              accent={jogAccent}
              className="mx-auto"
            />
          ) : (
            <JogWheel
              artworkUrl={trackData?.artUrl}
              title={trackData?.title}
              progress={progress}
              isPlaying={deck.isPlaying}
              bpm={currentBpm}
              isSynced={isSynced}
              accent={jogAccent}
              energy={energyLevel}
              loading={!isLoaded}
              onPointerDown={handleJogPointerDown}
              onPointerMove={handleJogPointerMove}
              onPointerUp={handleJogPointerUp}
              onPointerCancel={handleJogPointerUp}
            />
          )}
        </div>

        {/* ... rest of component ... */}
      </GlassPanel>
    </div>
  );
}

/**
 * Alternative: Use environment variable or feature flag
 */
const USE_3D_JOG_WHEELS = process.env.NEXT_PUBLIC_3D_JOG_WHEELS === 'true';

function DeckWithFeatureFlag({ deckId }: DeckProps) {
  return (
    <div>
      {USE_3D_JOG_WHEELS ? (
        <JogWheel3DWrapper deckId={deckId} {...props} />
      ) : (
        <JogWheel {...props} />
      )}
    </div>
  );
}

/**
 * Alternative: Gradual rollout with user preference
 */
function DeckWithUserPreference({ deckId }: DeckProps) {
  const userPreference = useUserSettings((state) => state.use3DJogWheels);
  const canUse3D = checkWebGLSupport();

  const shouldUse3D = userPreference && canUse3D;

  return (
    <div>
      {shouldUse3D ? (
        <JogWheel3DWrapper deckId={deckId} {...props} />
      ) : (
        <JogWheel {...props} />
      )}
    </div>
  );
}

/**
 * WebGL Support Detection
 */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch (e) {
    return false;
  }
}

export { Deck, DeckWithFeatureFlag, DeckWithUserPreference };
