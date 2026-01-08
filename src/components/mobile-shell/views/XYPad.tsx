"use client";

import { useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { getAudioEngine } from '@/engine/AudioEngine';

export const XYPad = () => {
  // REMEDIATION: Use ref for high-frequency position tracking (no re-renders during drag)
  const positionRef = useRef({ x: 0.5, y: 0.5 });
  
  // Only use state for display values (updated on drag end for efficiency)
  const [displayPosition, setDisplayPosition] = useState({ x: 0.5, y: 0.5 });

  // Animate puck position
  const [springProps, api] = useSpring(() => ({
    x: 50, // Start at center (50%)
    y: 50,
    config: { tension: 300, friction: 30 }
  }));

  // Drag gesture handler
  const bind = useDrag(({ offset: [x, y], memo, first, last }) => {
    // Get container dimensions (assume square 300x300 for now, adjust as needed)
    const size = 300;
    
    // Clamp values to container bounds
    const clampedX = Math.max(0, Math.min(size, x));
    const clampedY = Math.max(0, Math.min(size, y));
    
    // Normalize to 0-1 range
    const normalizedX = clampedX / size;
    const normalizedY = 1 - (clampedY / size); // Invert Y (top = 1, bottom = 0)
    
    // REMEDIATION: Update ref (no re-render, main thread stays free)
    positionRef.current = { x: normalizedX, y: normalizedY };
    
    // Update spring animation (convert back to percentage for CSS)
    api.start({
      x: normalizedX * 100,
      y: (1 - normalizedY) * 100 // Invert back for visual positioning
    });
    
    // Apply filter to audio engine (direct access, no state)
    try {
      getAudioEngine().setFilter('deckA', normalizedX, normalizedY);
    } catch (error) {
      // Engine might not be initialized yet
      console.warn('AudioEngine not ready');
    }
    
    // REMEDIATION: Only update display state on drag end (reduces re-renders)
    if (last) {
      setDisplayPosition({ x: normalizedX, y: normalizedY });
    }
    
    return memo;
  }, {
    from: () => [springProps.x.get() * 3, springProps.y.get() * 3], // Convert from % to px
    bounds: { left: 0, right: 300, top: 0, bottom: 300 }
  });

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-barlow uppercase tracking-wider text-white font-bold mb-2">
          XY Filter Pad
        </h2>
        <p className="text-sm text-gray-500">
          X: Frequency • Y: Resonance
        </p>
      </div>

      {/* XY Pad Container */}
      <div className="relative w-[300px] h-[300px] bg-gray-900 rounded-lg border-2 border-gray-700 overflow-hidden touch-none">
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-700/50" />
          {/* Horizontal center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-700/50" />
        </div>

        {/* Draggable Puck */}
        <animated.div
          {...bind()}
          style={{
            left: springProps.x.to((x: number) => `${x}%`),
            top: springProps.y.to((y: number) => `${y}%`),
            transform: 'translate(-50%, -50%)'
          }}
          className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg cursor-grab active:cursor-grabbing border-4 border-white/30 flex items-center justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </animated.div>

        {/* Touch instruction overlay (fades on first touch) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-600 text-xs text-center">
            Drag to control filter
          </div>
        </div>
      </div>

      {/* Value Display */}
      <div className="mt-6 grid grid-cols-2 gap-4 w-[300px]">
        <div className="bg-gray-900 p-3 rounded border border-gray-700">
          <div className="text-xs text-gray-500 uppercase mb-1">Frequency</div>
          <div className="text-lg font-mono text-cyan-400">
            {Math.round(20 * Math.pow(1000, displayPosition.x))} Hz
          </div>
        </div>
        <div className="bg-gray-900 p-3 rounded border border-gray-700">
          <div className="text-xs text-gray-500 uppercase mb-1">Resonance</div>
          <div className="text-lg font-mono text-blue-400">
            {(displayPosition.y * 20).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Deck Indicator */}
      <div className="mt-4 text-xs text-gray-600">
        Controlling: <span className="text-cyan-400 font-bold">DECK A</span>
      </div>
    </div>
  );
};
