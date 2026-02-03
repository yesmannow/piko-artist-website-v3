"use client";

/**
 * Monitor Page - Second-Screen HUD for DJ Setup
 *
 * Phase X: Mobile Mastery - Second-Screen Broadcasting
 *
 * Real-time metadata display for a secondary screen/phone propped next to the mixer.
 * Subscribes to BroadcastChannel from useSmartTrackAnalysis to show:
 * - Track Title & Artist
 * - BPM (large, high-contrast)
 * - Camelot Key (for harmonic mixing)
 * - Energy Level
 *
 * Perfect for dark club environments where the main screen is too small or far away.
 */

import { useEffect, useState } from 'react';

interface TrackMetadata {
  title: string;
  artist: string;
  bpm: number;
  key: string;
  camelotKey: string;
  energy: number;
  confidence: number;
  timestamp: number;
}

export default function MonitorPage() {
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined || !('BroadcastChannel' in globalThis)) {
      console.warn('[Monitor] BroadcastChannel not supported');
      return;
    }

    const channel = new BroadcastChannel('piko_studio_sync');
    setIsConnected(true);

    channel.onmessage = (event) => {
      if (event.data.type === 'track_update') {
        setMetadata(event.data.payload);
      }
    };

    return () => {
      channel.close();
      setIsConnected(false);
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-4 text-studio-cyan">
            BroadcastChannel Not Supported
          </h1>
          <p className="text-lg text-white/60">
            Your browser does not support BroadcastChannel API.
            <br />
            Try Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-4">🎧</div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-4 text-studio-cyan">
            Waiting for Track
          </h1>
          <p className="text-lg text-white/60">
            Load a track in the studio to see metadata here.
          </p>
        </div>
      </div>
    );
  }

  // Energy gradient color (low = cyan, high = crimson)
  const energyColor =
    metadata.energy > 0.6
      ? 'from-studio-red to-studio-orange'
      : 'from-studio-cyan to-studio-purple';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 gap-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-2 text-studio-cyan">
          Second Screen HUD
        </h1>
        <p className="text-lg text-white/40">Live Metadata Feed</p>
      </div>

      {/* Track Info */}
      <div className="text-center max-w-4xl">
        <h2 className="text-5xl md:text-7xl font-black uppercase mb-4 text-white/90 wrap-break-word">
          {metadata.title}
        </h2>
        <p className="text-3xl md:text-5xl font-bold text-white/60 uppercase">
          {metadata.artist}
        </p>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {/* BPM */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-studio-cyan/20 text-center">
          <p className="text-lg uppercase text-studio-cyan/70 mb-2">BPM</p>
          <p className="text-7xl md:text-8xl font-black text-studio-cyan">
            {metadata.bpm}
          </p>
        </div>

        {/* Camelot Key */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-studio-purple/20 text-center">
          <p className="text-lg uppercase text-studio-purple/70 mb-2">Key</p>
          <p className="text-7xl md:text-8xl font-black text-studio-purple">
            {metadata.camelotKey}
          </p>
          <p className="text-xl text-white/40 mt-2">{metadata.key}</p>
        </div>

        {/* Energy */}
        <div className={`bg-linear-to-br ${energyColor} rounded-2xl p-8 text-center`}>
          <p className="text-lg uppercase text-white/70 mb-2">Energy</p>
          <p className="text-7xl md:text-8xl font-black text-white">
            {Math.round(metadata.energy * 100)}
          </p>
          <p className="text-xl text-white/60 mt-2">
            {metadata.energy > 0.6 ? 'HYPE' : 'CHILL'}
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="text-center text-white/30 text-sm">
        <p>✅ Connected to Studio</p>
        <p>Last Update: {new Date(metadata.timestamp).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
