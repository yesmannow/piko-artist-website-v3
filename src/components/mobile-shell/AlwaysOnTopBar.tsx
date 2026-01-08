"use client";

import { useEffect, useState } from 'react';
import { Cable, Settings } from 'lucide-react';
import { useMIDIStore } from '@/store/useMIDIStore';
import { triggerHaptic, HAPTIC_PATTERNS } from '@/utils/haptics';

interface AlwaysOnTopBarProps {
  onSettingsClick?: () => void;
}

export const AlwaysOnTopBar = ({ onSettingsClick }: AlwaysOnTopBarProps) => {
  const isConnected = useMIDIStore((state) => state.isConnected);
  const deviceName = useMIDIStore((state) => state.deviceName);
  const lastActivity = useMIDIStore((state) => state.lastActivity);
  const [isBlinking, setIsBlinking] = useState(false);

  const handleSettingsClick = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    onSettingsClick?.();
  };

  // Blink indicator on MIDI activity
  useEffect(() => {
    if (lastActivity > 0) {
      setIsBlinking(true);
      const timeout = setTimeout(() => setIsBlinking(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [lastActivity]);

  // Determine MIDI indicator color
  const getMIDIColor = () => {
    if (!isConnected) return 'text-gray-600'; // Gray: No connection
    if (isBlinking) return 'text-yellow-400 animate-pulse'; // Blink: Activity
    return 'text-green-500'; // Green: Connected
  };

  return (
    <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      {/* Left: Title + Settings */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-barlow uppercase tracking-wider text-gray-400">
          Studio V2
        </span>
        <button
          onClick={handleSettingsClick}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-gray-500 hover:text-gray-300" />
        </button>
      </div>

      {/* Center: Device Name (if connected) */}
      {isConnected && deviceName && (
        <span className="text-xs font-mono text-gray-500">
          {deviceName}
        </span>
      )}

      {/* Right: MIDI Indicator */}
      <div className="flex items-center gap-2">
        <Cable className={`w-4 h-4 ${getMIDIColor()} transition-colors`} />
        <span className="text-[10px] font-mono uppercase text-gray-600">
          MIDI
        </span>
      </div>
    </div>
  );
};
