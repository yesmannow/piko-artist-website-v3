"use client";

/**
 * DJMixerModule.tsx - Complete DJ Mixer Module with DSP Features
 *
 * Phase 2: Integrates audio graph topology, precision playback, crossfader,
 * beat detection, and harmonic mixing into a single React component.
 *
 * Architecture:
 * - Each deck uses AudioBufferSourceNode for instant cueing and pitching
 * - 3-band EQ with kill switch capability (Low-Shelf, Peaking, High-Shelf)
 * - Constant-power crossfader (cos/sin curve)
 * - Beat detection and sync engine with PLL
 * - Dynamic harmonic mixing with Camelot key display
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getStudioEngine } from "@/engine/rt/StudioEngine";
import { useBPMDetection } from "@/hooks/useBPMDetection";
import { useBeatGrid } from "@/hooks/useBeatGrid";
import { useTrackKey } from "@/hooks/useTrackKey";
import { compatibleKeys } from "@/utils/camelot";
import { Crossfader } from "./dj-ui/Crossfader";
import { Fader } from "./dj-ui/Fader";
import { Knob } from "./dj-ui/Knob";

/**
 * Track metadata for a single deck
 */
export interface DeckTrack {
  url: string;
  title: string;
  artist: string;
  audioBuffer?: AudioBuffer | null;
}

/**
 * Deck state for UI control
 */
export interface DeckState {
  playing: boolean;
  volume: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  killLow: boolean;
  killMid: boolean;
  killHigh: boolean;
  playbackRate: number;
  bpm: number | null;
  key: string | null;
  currentTime: number;
  duration: number;
}

/**
 * Props for DJMixerModule component
 */
export interface DJMixerModuleProps {
  // Deck tracks
  deckATrack: DeckTrack | null;
  deckBTrack: DeckTrack | null;

  // Playback callbacks
  onDeckAPlay?: () => void;
  onDeckAPause?: () => void;
  onDeckASeek?: (time: number) => void;
  onDeckAPlaybackRateChange?: (rate: number) => void;

  onDeckBPlay?: () => void;
  onDeckBPause?: () => void;
  onDeckBSeek?: (time: number) => void;
  onDeckBPlaybackRateChange?: (rate: number) => void;

  // Sync callbacks
  onSyncEnable?: (slaveDeck: 'A' | 'B', masterDeck: 'A' | 'B') => void;
  onSyncDisable?: () => void;

  // Cue callbacks
  onDeckACue?: () => void;
  onDeckBCue?: () => void;

  // UI options
  showKeyDisplay?: boolean;
  showBeatGrid?: boolean;
  enableHaptics?: boolean;
  pitchLockEnabled?: boolean; // For future WASM time-stretching
}

/**
 * DJMixerModule - Complete DJ mixer with audio graph and DSP features
 */
export function DJMixerModule({
  deckATrack,
  deckBTrack,
  onDeckAPlay,
  onDeckAPause,
  onDeckASeek,
  onDeckAPlaybackRateChange,
  onDeckBPlay,
  onDeckBPause,
  onDeckBSeek,
  onDeckBPlaybackRateChange,
  onSyncEnable,
  onSyncDisable,
  onDeckACue,
  onDeckBCue,
  showKeyDisplay = true,
  showBeatGrid = true,
  enableHaptics = true,
  pitchLockEnabled = false,
}: DJMixerModuleProps) {
  // Engine state
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<ReturnType<typeof getStudioEngine> | null>(null);

  // Deck states
  const [deckAState, setDeckAState] = useState<DeckState>({
    playing: false,
    volume: 0.8,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    killLow: false,
    killMid: false,
    killHigh: false,
    playbackRate: 1.0,
    bpm: null,
    key: null,
    currentTime: 0,
    duration: 0,
  });

  const [deckBState, setDeckBState] = useState<DeckState>({
    playing: false,
    volume: 0.8,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    killLow: false,
    killMid: false,
    killHigh: false,
    playbackRate: 1.0,
    bpm: null,
    key: null,
    currentTime: 0,
    duration: 0,
  });

  // Crossfader state (0 = Deck A, 1 = Deck B)
  const [crossfaderPosition, setCrossfaderPosition] = useState(0.5);

  // Sync state
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncMaster, setSyncMaster] = useState<'A' | 'B'>('A');

  // BPM detection for both decks
  const deckABPM = useBPMDetection({
    audioBuffer: deckATrack?.audioBuffer || null,
    trackTitle: deckATrack?.title || "",
    trackArtist: deckATrack?.artist || "",
    enabled: !!deckATrack,
  });

  const deckBBPM = useBPMDetection({
    audioBuffer: deckBTrack?.audioBuffer || null,
    trackTitle: deckBTrack?.title || "",
    trackArtist: deckBTrack?.artist || "",
    enabled: !!deckBTrack,
  });

  // Beat grid analysis
  const { analyze: analyzeBeatGrid } = useBeatGrid();

  // Track key detection
  const deckAKey = useTrackKey(deckATrack?.url || null, deckATrack?.url);
  const deckBKey = useTrackKey(deckBTrack?.url || null, deckBTrack?.url);

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const engine = getStudioEngine();
        engineRef.current = engine;

        if (engine.state !== 'ready') {
          await engine.initialize();
        }

        setInitialized(true);
        console.log('[DJMixerModule] Engine initialized');
      } catch (err) {
        console.error('[DJMixerModule] Failed to initialize engine:', err);
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    };

    if (typeof window !== 'undefined') {
      initEngine();
    }
  }, []);

  // Load Deck A track
  useEffect(() => {
    if (!initialized || !engineRef.current || !deckATrack) return;

    const loadTrack = async () => {
      try {
        await engineRef.current!.loadTrack('A', deckATrack.url);
        
        // Analyze beat grid if audioBuffer is available
        if (deckATrack.audioBuffer) {
          await analyzeBeatGrid(deckATrack.audioBuffer, deckATrack.url);
        }

        const deckInfo = engineRef.current!.getDeckInfo('A');
        setDeckAState(prev => ({
          ...prev,
          duration: deckInfo.duration,
        }));
      } catch (err) {
        console.error('[DJMixerModule] Failed to load Deck A track:', err);
      }
    };

    loadTrack();
  }, [initialized, deckATrack, analyzeBeatGrid]);

  // Load Deck B track
  useEffect(() => {
    if (!initialized || !engineRef.current || !deckBTrack) return;

    const loadTrack = async () => {
      try {
        await engineRef.current!.loadTrack('B', deckBTrack.url);

        // Analyze beat grid if audioBuffer is available
        if (deckBTrack.audioBuffer) {
          await analyzeBeatGrid(deckBTrack.audioBuffer, deckBTrack.url);
        }

        const deckInfo = engineRef.current!.getDeckInfo('B');
        setDeckBState(prev => ({
          ...prev,
          duration: deckInfo.duration,
        }));
      } catch (err) {
        console.error('[DJMixerModule] Failed to load Deck B track:', err);
      }
    };

    loadTrack();
  }, [initialized, deckBTrack, analyzeBeatGrid]);

  // Update BPM in deck states
  useEffect(() => {
    if (deckABPM.bpm !== null) {
      setDeckAState(prev => ({ ...prev, bpm: deckABPM.bpm }));
    }
  }, [deckABPM.bpm]);

  useEffect(() => {
    if (deckBBPM.bpm !== null) {
      setDeckBState(prev => ({ ...prev, bpm: deckBBPM.bpm }));
    }
  }, [deckBBPM.bpm]);

  // Update key in deck states
  useEffect(() => {
    if (deckAKey.keyData?.camelot) {
      setDeckAState(prev => ({ ...prev, key: deckAKey.keyData!.camelot }));
    }
  }, [deckAKey.keyData]);

  useEffect(() => {
    if (deckBKey.keyData?.camelot) {
      setDeckBState(prev => ({ ...prev, key: deckBKey.keyData!.camelot }));
    }
  }, [deckBKey.keyData]);

  // Apply crossfader using constant-power curve
  useEffect(() => {
    if (!initialized || !engineRef.current) return;

    // Constant-power gain calculation: cos/sin curve
    const gainA = Math.cos(crossfaderPosition * Math.PI / 2);
    const gainB = Math.sin(crossfaderPosition * Math.PI / 2);

    // Apply gains to decks (combined with volume faders)
    engineRef.current.setGain('A', deckAState.volume * gainA);
    engineRef.current.setGain('B', deckBState.volume * gainB);
  }, [initialized, crossfaderPosition, deckAState.volume, deckBState.volume]);

  // Playback controls
  const handleDeckAPlay = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.play('A');
    setDeckAState(prev => ({ ...prev, playing: true }));
    onDeckAPlay?.();
  }, [onDeckAPlay]);

  const handleDeckAPause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause('A');
    setDeckAState(prev => ({ ...prev, playing: false }));
    onDeckAPause?.();
  }, [onDeckAPause]);

  const handleDeckASeek = useCallback((time: number) => {
    if (!engineRef.current) return;
    engineRef.current.seek('A', time);
    setDeckAState(prev => ({ ...prev, currentTime: time }));
    onDeckASeek?.(time);
  }, [onDeckASeek]);

  const handleDeckAPlaybackRate = useCallback((rate: number) => {
    if (!engineRef.current) return;
    engineRef.current.setPlaybackRate('A', rate);
    setDeckAState(prev => ({ ...prev, playbackRate: rate }));
    onDeckAPlaybackRateChange?.(rate);
  }, [onDeckAPlaybackRateChange]);

  const handleDeckBPlay = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.play('B');
    setDeckBState(prev => ({ ...prev, playing: true }));
    onDeckBPlay?.();
  }, [onDeckBPlay]);

  const handleDeckBPause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause('B');
    setDeckBState(prev => ({ ...prev, playing: false }));
    onDeckBPause?.();
  }, [onDeckBPause]);

  const handleDeckBSeek = useCallback((time: number) => {
    if (!engineRef.current) return;
    engineRef.current.seek('B', time);
    setDeckBState(prev => ({ ...prev, currentTime: time }));
    onDeckBSeek?.(time);
  }, [onDeckBSeek]);

  const handleDeckBPlaybackRate = useCallback((rate: number) => {
    if (!engineRef.current) return;
    engineRef.current.setPlaybackRate('B', rate);
    setDeckBState(prev => ({ ...prev, playbackRate: rate }));
    onDeckBPlaybackRateChange?.(rate);
  }, [onDeckBPlaybackRateChange]);

  // EQ controls with kill switch
  const handleDeckAEQ = useCallback((band: 'low' | 'mid' | 'high', value: number, kill: boolean) => {
    if (!engineRef.current) return;

    // If kill is enabled, set gain to -∞ dB (effectively 0)
    const gainDb = kill ? -100 : value;
    engineRef.current.setEQ('A', band, gainDb);

    setDeckAState(prev => ({
      ...prev,
      [`eq${band.charAt(0).toUpperCase()}${band.slice(1)}`]: value,
      [`kill${band.charAt(0).toUpperCase()}${band.slice(1)}`]: kill,
    }));
  }, []);

  const handleDeckBEQ = useCallback((band: 'low' | 'mid' | 'high', value: number, kill: boolean) => {
    if (!engineRef.current) return;

    const gainDb = kill ? -100 : value;
    engineRef.current.setEQ('B', band, gainDb);

    setDeckBState(prev => ({
      ...prev,
      [`eq${band.charAt(0).toUpperCase()}${band.slice(1)}`]: value,
      [`kill${band.charAt(0).toUpperCase()}${band.slice(1)}`]: kill,
    }));
  }, []);

  // Sync controls
  const handleSyncToggle = useCallback(() => {
    if (!engineRef.current) return;

    if (syncEnabled) {
      engineRef.current.setSyncEnabled('B', false);
      setSyncEnabled(false);
      onSyncDisable?.();
    } else {
      const slave = syncMaster === 'A' ? 'B' : 'A';
      engineRef.current.setSyncEnabled(slave, true, syncMaster);
      setSyncEnabled(true);
      onSyncEnable?.(slave, syncMaster);
    }
  }, [syncEnabled, syncMaster, onSyncEnable, onSyncDisable]);

  // Get compatible keys for harmonic mixing
  const deckACompatibleKeys = deckAState.key ? compatibleKeys(deckAState.key) : [];
  const deckBCompatibleKeys = deckBState.key ? compatibleKeys(deckBState.key) : [];

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
        <h3 className="text-red-500 font-barlow uppercase mb-2">Error</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <p className="text-gray-400 font-barlow uppercase text-sm">Initializing DJ Mixer...</p>
      </div>
    );
  }

  return (
    <div 
      className="dj-mixer-module w-full"
      style={{
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800">
        {/* Deck A */}
        <div className="deck-a-container p-4 bg-[#1a1a1a]/50 rounded border border-gray-800/50">
          <div className="text-center mb-4">
            <h3 className="text-[#00d9ff] font-barlow uppercase font-bold tracking-wider">
              DECK A
            </h3>
            {showKeyDisplay && deckAState.key && (
              <div className="text-sm text-gray-400 mt-1">
                Key: <span className="text-[#00d9ff] font-bold">{deckAState.key}</span>
                {deckBState.key && deckACompatibleKeys.includes(deckBState.key) && (
                  <span className="ml-2 text-green-500">✓ Compatible</span>
                )}
              </div>
            )}
            {showBeatGrid && deckAState.bpm && (
              <div className="text-sm text-gray-400">
                BPM: <span className="text-[#00d9ff] font-bold">{deckAState.bpm.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Volume Fader */}
          <div className="mb-4 flex justify-center">
            <Fader
              value={deckAState.volume}
              onChange={(v) => setDeckAState(prev => ({ ...prev, volume: v }))}
              label="VOLUME"
              height={160}
            />
          </div>

          {/* EQ Section */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-red-500 font-barlow mb-1">HIGH</span>
              <Knob
                value={deckAState.eqHigh}
                onChange={(v) => handleDeckAEQ('high', v, deckAState.killHigh)}
                min={-12}
                max={12}
                size={50}
                color="high"
              />
              <button
                onClick={() => handleDeckAEQ('high', deckAState.eqHigh, !deckAState.killHigh)}
                className={`mt-1 px-2 py-1 text-xs font-barlow rounded ${
                  deckAState.killHigh 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-400 border border-red-500/50'
                }`}
              >
                KILL
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-green-500 font-barlow mb-1">MID</span>
              <Knob
                value={deckAState.eqMid}
                onChange={(v) => handleDeckAEQ('mid', v, deckAState.killMid)}
                min={-12}
                max={12}
                size={50}
                color="mid"
              />
              <button
                onClick={() => handleDeckAEQ('mid', deckAState.eqMid, !deckAState.killMid)}
                className={`mt-1 px-2 py-1 text-xs font-barlow rounded ${
                  deckAState.killMid 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-400 border border-green-500/50'
                }`}
              >
                KILL
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-blue-500 font-barlow mb-1">LOW</span>
              <Knob
                value={deckAState.eqLow}
                onChange={(v) => handleDeckAEQ('low', v, deckAState.killLow)}
                min={-12}
                max={12}
                size={50}
                color="low"
              />
              <button
                onClick={() => handleDeckAEQ('low', deckAState.eqLow, !deckAState.killLow)}
                className={`mt-1 px-2 py-1 text-xs font-barlow rounded ${
                  deckAState.killLow 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-400 border border-blue-500/50'
                }`}
              >
                KILL
              </button>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex gap-2 justify-center mb-2">
            <button
              onClick={deckAState.playing ? handleDeckAPause : handleDeckAPlay}
              className="px-4 py-2 bg-[#00d9ff] text-black font-barlow uppercase rounded hover:bg-[#00d9ff]/80"
            >
              {deckAState.playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={onDeckACue}
              className="px-4 py-2 bg-yellow-500 text-black font-barlow uppercase rounded hover:bg-yellow-400"
            >
              CUE
            </button>
          </div>

          {/* Pitch Control */}
          <div className="mt-2">
            <label className="text-xs text-gray-400 font-barlow block mb-1">
              PITCH: {((deckAState.playbackRate - 1) * 100).toFixed(1)}%
            </label>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.01"
              value={deckAState.playbackRate}
              onChange={(e) => handleDeckAPlaybackRate(parseFloat(e.target.value))}
              className="w-full accent-[#00d9ff]"
            />
            {pitchLockEnabled && (
              <p className="text-xs text-yellow-500 mt-1">⚠️ Pitch Lock (time-stretch) not yet implemented</p>
            )}
          </div>
        </div>

        {/* Center - Crossfader & Sync */}
        <div className="center-container p-4 bg-[#1a1a1a]/50 rounded border border-gray-800/50">
          <div className="text-center mb-6">
            <h3 className="text-gray-300 font-barlow uppercase tracking-wider">MIXER CONTROL</h3>
          </div>

          {/* Crossfader */}
          <div className="mb-6 flex justify-center">
            <Crossfader
              value={crossfaderPosition}
              onChange={setCrossfaderPosition}
              width={250}
              helpText="Equal-power crossfade: cos(x*π/2) for A, sin(x*π/2) for B"
            />
          </div>

          {/* Sync Control */}
          <div className="mb-6">
            <button
              onClick={handleSyncToggle}
              disabled={!deckAState.bpm || !deckBState.bpm}
              className={`w-full px-4 py-3 font-barlow uppercase rounded ${
                syncEnabled
                  ? 'bg-green-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {syncEnabled ? '✓ SYNC ACTIVE' : 'SYNC'}
            </button>
            {syncEnabled && (
              <p className="text-xs text-green-500 text-center mt-2">
                Syncing to Deck {syncMaster}
              </p>
            )}
          </div>

          {/* Harmonic Mixing Display */}
          {showKeyDisplay && (deckAState.key || deckBState.key) && (
            <div className="p-3 bg-[#0a0a0a] rounded border border-gray-800">
              <h4 className="text-xs text-gray-400 font-barlow uppercase mb-2">Harmonic Mix</h4>
              {deckAState.key && deckBState.key && (
                <div className="text-sm">
                  {deckACompatibleKeys.includes(deckBState.key) ? (
                    <p className="text-green-500">✓ Keys are compatible for smooth mixing</p>
                  ) : (
                    <p className="text-yellow-500">⚠️ Key clash - use EQ or effects</p>
                  )}
                </div>
              )}
              {deckAState.key && !deckBState.key && (
                <p className="text-gray-500 text-sm">
                  Compatible with: {deckACompatibleKeys.slice(0, 3).join(', ')}...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Deck B */}
        <div className="deck-b-container p-4 bg-[#1a1a1a]/50 rounded border border-gray-800/50">
          <div className="text-center mb-4">
            <h3 className="text-[#ff00d9] font-barlow uppercase font-bold tracking-wider">
              DECK B
            </h3>
            {showKeyDisplay && deckBState.key && (
              <div className="text-sm text-gray-400 mt-1">
                Key: <span className="text-[#ff00d9] font-bold">{deckBState.key}</span>
                {deckAState.key && deckBCompatibleKeys.includes(deckAState.key) && (
                  <span className="ml-2 text-green-500">✓ Compatible</span>
                )}
              </div>
            )}
            {showBeatGrid && deckBState.bpm && (
              <div className="text-sm text-gray-400">
                BPM: <span className="text-[#ff00d9] font-bold">{deckBState.bpm.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Volume Fader */}
          <div className="mb-4 flex justify-center">
            <Fader
              value={deckBState.volume}
              onChange={(v) => setDeckBState(prev => ({ ...prev, volume: v }))}
              label="VOLUME"
              height={160}
            />
          </div>

          {/* EQ Section */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-red-500 font-barlow mb-1">HIGH</span>
              <Knob
                value={deckBState.eqHigh}
                onChange={(v) => handleDeckBEQ('high', v, deckBState.killHigh)}
                min={-12}
                max={12}
                size={50}
                color="high"
              />
              <button
                onClick={() => handleDeckBEQ('high', deckBState.eqHigh, !deckBState.killHigh)}
                className={`mt-1 px-2 py-1 text-xs font-barlow rounded ${
                  deckBState.killHigh 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-400 border border-red-500/50'
                }`}
              >
                KILL
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-green-500 font-barlow mb-1">MID</span>
              <Knob
                value={deckBState.eqMid}
                onChange={(v) => handleDeckBEQ('mid', v, deckBState.killMid)}
                min={-12}
                max={12}
                size={50}
                color="mid"
              />
              <button
                onClick={() => handleDeckBEQ('mid', deckBState.eqMid, !deckBState.killMid)}
                className={`mt-1 px-2 py-1 text-xs font-barlow rounded ${
                  deckBState.killMid 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-400 border border-green-500/50'
                }`}
              >
                KILL
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-blue-500 font-barlow mb-1">LOW</span>
              <Knob
                value={deckBState.eqLow}
                onChange={(v) => handleDeckBEQ('low', v, deckBState.killLow)}
                min={-12}
                max={12}
                size={50}
                color="low"
              />
              <button
                onClick={() => handleDeckBEQ('low', deckBState.eqLow, !deckBState.killLow)}
                className={`mt-1 px-2 py-1 text-xs font-barlow rounded ${
                  deckBState.killLow 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-400 border border-blue-500/50'
                }`}
              >
                KILL
              </button>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex gap-2 justify-center mb-2">
            <button
              onClick={deckBState.playing ? handleDeckBPause : handleDeckBPlay}
              className="px-4 py-2 bg-[#ff00d9] text-black font-barlow uppercase rounded hover:bg-[#ff00d9]/80"
            >
              {deckBState.playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={onDeckBCue}
              className="px-4 py-2 bg-yellow-500 text-black font-barlow uppercase rounded hover:bg-yellow-400"
            >
              CUE
            </button>
          </div>

          {/* Pitch Control */}
          <div className="mt-2">
            <label className="text-xs text-gray-400 font-barlow block mb-1">
              PITCH: {((deckBState.playbackRate - 1) * 100).toFixed(1)}%
            </label>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.01"
              value={deckBState.playbackRate}
              onChange={(e) => handleDeckBPlaybackRate(parseFloat(e.target.value))}
              className="w-full accent-[#ff00d9]"
            />
            {pitchLockEnabled && (
              <p className="text-xs text-yellow-500 mt-1">⚠️ Pitch Lock (time-stretch) not yet implemented</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
