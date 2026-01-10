/**
 * DJMixerModuleExample.tsx - Example usage of DJMixerModule component
 *
 * This file demonstrates how to integrate the DJMixerModule component
 * into your application with proper track loading and callback handling.
 *
 * Phase 2: DJ Mixer Module & DSP Features
 */

"use client";

import { useState, useEffect } from "react";
import { DJMixerModule, type DeckTrack } from "./DJMixerModule";

/**
 * Example component showing DJMixerModule integration
 */
export function DJMixerModuleExample() {
  const [deckATrack, setDeckATrack] = useState<DeckTrack | null>(null);
  const [deckBTrack, setDeckBTrack] = useState<DeckTrack | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Initialize AudioContext (must be done after user gesture)
  useEffect(() => {
    const initAudioContext = async () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    };

    // Wait for user interaction
    const handleUserGesture = () => {
      initAudioContext();
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('touchstart', handleUserGesture);
    };

    document.addEventListener('click', handleUserGesture);
    document.addEventListener('touchstart', handleUserGesture);

    return () => {
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('touchstart', handleUserGesture);
    };
  }, []);

  /**
   * Load a track from a URL
   */
  const loadTrack = async (
    url: string,
    title: string,
    artist: string
  ): Promise<DeckTrack> => {
    if (!audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Fetch and decode audio
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return {
      url,
      title,
      artist,
      audioBuffer,
    };
  };

  /**
   * Example: Load demo tracks
   */
  const loadDemoTracks = async () => {
    try {
      // Replace these with actual audio file URLs
      const trackA = await loadTrack(
        '/audio/demo-track-1.mp3',
        'Demo Track 1',
        'Artist A'
      );

      const trackB = await loadTrack(
        '/audio/demo-track-2.mp3',
        'Demo Track 2',
        'Artist B'
      );

      setDeckATrack(trackA);
      setDeckBTrack(trackB);
    } catch (error) {
      console.error('Failed to load demo tracks:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-barlow font-bold uppercase tracking-wider mb-2">
            DJ Mixer Module
          </h1>
          <p className="text-gray-400">
            Phase 2: Audio Graph Topology, Precision Playback & Harmonic Mixing
          </p>
        </header>

        {/* Load Tracks Button */}
        {!deckATrack && !deckBTrack && (
          <div className="mb-8 text-center">
            <button
              onClick={loadDemoTracks}
              className="px-6 py-3 bg-[#00d9ff] text-black font-barlow uppercase rounded hover:bg-[#00d9ff]/80 transition-colors"
            >
              Load Demo Tracks
            </button>
            <p className="mt-4 text-sm text-gray-500">
              Note: Replace demo URLs in code with actual audio files
            </p>
          </div>
        )}

        {/* DJ Mixer Module */}
        {audioContext && (
          <DJMixerModule
            deckATrack={deckATrack}
            deckBTrack={deckBTrack}
            onDeckAPlay={() => console.log('[Example] Deck A playing')}
            onDeckAPause={() => console.log('[Example] Deck A paused')}
            onDeckASeek={(time) => console.log('[Example] Deck A seek:', time)}
            onDeckAPlaybackRateChange={(rate) => console.log('[Example] Deck A rate:', rate)}
            onDeckBPlay={() => console.log('[Example] Deck B playing')}
            onDeckBPause={() => console.log('[Example] Deck B paused')}
            onDeckBSeek={(time) => console.log('[Example] Deck B seek:', time)}
            onDeckBPlaybackRateChange={(rate) => console.log('[Example] Deck B rate:', rate)}
            onSyncEnable={(slave, master) =>
              console.log('[Example] Sync enabled:', slave, '→', master)
            }
            onSyncDisable={() => console.log('[Example] Sync disabled')}
            onDeckACue={() => console.log('[Example] Deck A cue')}
            onDeckBCue={() => console.log('[Example] Deck B cue')}
            showKeyDisplay={true}
            showBeatGrid={true}
            enableHaptics={true}
            pitchLockEnabled={false}
          />
        )}

        {/* Feature List */}
        <div className="mt-8 p-6 bg-[#1a1a1a] rounded-lg border border-gray-800">
          <h2 className="text-xl font-barlow uppercase mb-4">Features Implemented</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Audio Graph Topology: AudioBufferSourceNode → EQ (3-band) → Gain → Mixer</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Precision Playback: Tempo control via playbackRate (0.8x - 1.2x)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>EQ with Kill Switches: Low-Shelf, Peaking (Mid), High-Shelf (-∞ dB capability)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Crossfader: Equal-power (cos/sin), Linear, Sharp, Smooth curves</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Beat Detection: Spectral flux analysis with BPM estimation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Sync Engine: PLL phase-locked loop for beat alignment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Harmonic Mixing: Camelot key notation with compatibility display</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Physics-based UI: Faders with elastic boundaries, touch-optimized</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">⚠</span>
              <span>Pitch Lock (time-stretching): Placeholder for future WASM integration</span>
            </li>
          </ul>
        </div>

        {/* API Reference */}
        <div className="mt-8 p-6 bg-[#1a1a1a] rounded-lg border border-gray-800">
          <h2 className="text-xl font-barlow uppercase mb-4">Component API</h2>
          <div className="text-sm text-gray-300 space-y-3">
            <div>
              <h3 className="text-[#00d9ff] font-bold mb-1">Props:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>deckATrack, deckBTrack</code>: DeckTrack objects with url, title, artist, audioBuffer</li>
                <li><code>onDeckAPlay, onDeckAPause, onDeckASeek, onDeckAPlaybackRateChange</code>: Deck A callbacks</li>
                <li><code>onDeckBPlay, onDeckBPause, onDeckBSeek, onDeckBPlaybackRateChange</code>: Deck B callbacks</li>
                <li><code>onSyncEnable, onSyncDisable</code>: Sync state callbacks</li>
                <li><code>onDeckACue, onDeckBCue</code>: Cue point callbacks</li>
                <li><code>showKeyDisplay, showBeatGrid</code>: Display toggles</li>
                <li><code>enableHaptics</code>: Enable haptic feedback</li>
                <li><code>pitchLockEnabled</code>: Enable pitch lock (placeholder)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#00d9ff] font-bold mb-1">Features:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>3-band EQ with kill switches (-∞ dB)</li>
                <li>Volume faders with elastic boundaries</li>
                <li>Crossfader with multiple curve options</li>
                <li>BPM and key display</li>
                <li>Harmonic mixing compatibility indicator</li>
                <li>Beat sync with PLL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
