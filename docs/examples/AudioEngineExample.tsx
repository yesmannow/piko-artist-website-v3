// @ts-nocheck
/**
 * AudioEngineExample.tsx
 *
 * Example component demonstrating the integration of the Audio Engine Core
 * This shows the basic setup and usage patterns for a DJ mixer interface
 *
 * NOTE: This is a documentation example showing the intended API patterns.
 * Some properties shown here may not yet be implemented in the current codebase.
 */

'use client';

import { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { useAudioEngine } from '@/hooks/useAudioEngine';

export default function AudioEngineExample() {
  // Get store state - using actual properties from useStudioStore
  const masterBpm = useStudioStore((state) => state.masterBpm);
  const setMasterBpm = useStudioStore((state) => state.setMasterBpm);
  const crossfaderPos = useStudioStore((state) => state.crossfaderPos);
  const setCrossfader = useStudioStore((state) => state.setCrossfader);
  const setDeckVolume = useStudioStore((state) => state.setDeckVolume);
  const deckA = useStudioStore((state) => state.deckA);
  const deckB = useStudioStore((state) => state.deckB);

  // Get audio engine controls - using actual properties from useAudioEngine
  const {
    init: initializeAudio,
    isReady: isAudioReady,
    loadTrack,
    play,
    pause,
    stop,
    syncToBpm,
    setDeckEQ,
    setDeckFilter
  } = useAudioEngine();

  const [showInitOverlay, setShowInitOverlay] = useState(true);

  // Initialize audio on user interaction
  const handleInitialize = async () => {
    try {
      await initializeAudio();
      setShowInitOverlay(false);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  // Example: Load track from Cloudflare R2
  const handleLoadTrack = async (deck: 'deckA' | 'deckB') => {
    // Replace with actual R2 URL
    const exampleUrl = `https://r2.example.com/tracks/track-${deck}.mp3`;
    const exampleBpm = deck === 'deckA' ? 128 : 130;

    try {
      await loadTrack(deck, exampleUrl, exampleBpm);
    } catch (error) {
      console.error(`Failed to load track on ${deck}:`, error);
    }
  };

  return (
    <div className="audio-engine-example">
      {/* Mobile Unlock Overlay */}
      {showInitOverlay && !isAudioReady && (
        <div className="init-overlay">
          <div className="init-content">
            <h2>🎵 Piko FG Studio V3</h2>
            <p>Tap to start the audio engine</p>
            <button onClick={handleInitialize}>
              Start Audio Engine
            </button>
          </div>
        </div>
      )}

      {/* Master Controls */}
      <div className="master-section">
        <h2>Master Controls</h2>

        <div className="control-group">
          <label>Master BPM: {masterBpm}</label>
          <input
            type="range"
            min="60"
            max="180"
            value={masterBpm}
            onChange={(e) => setMasterBpm(Number(e.target.value))}
            disabled={!isAudioReady}
          />
        </div>

        <div className="control-group">
          <label htmlFor="crossfader">Crossfader</label>
          <div className="crossfader-control">
            <span className="label-a">A</span>
            <input
              id="crossfader"
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={crossfaderPos}
              onChange={(e) => setCrossfader(Number(e.target.value))}
              disabled={!isAudioReady}
            />
            <span className="label-b">B</span>
          </div>
          <div className="crossfader-value">
            Position: {crossfaderPos.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Deck Controls */}
      <div className="decks-section">
        {/* Deck A */}
        <div className="deck deck-a">
          <h3>Deck A</h3>

          {/* Transport Controls */}
          <div className="transport">
            <button onClick={() => handleLoadTrack('deckA')} disabled={!isAudioReady}>
              Load
            </button>
            <button onClick={() => play('deckA')} disabled={!isAudioReady || !deckA.trackData}>
              ▶ Play
            </button>
            <button onClick={() => pause('deckA')} disabled={!isAudioReady || !deckA.trackData}>
              ⏸ Pause
            </button>
            <button onClick={() => stop('deckA')} disabled={!isAudioReady || !deckA.trackData}>
              ⏹ Stop
            </button>
            <button onClick={() => syncToBpm('deckA')} disabled={!isAudioReady || !deckA.trackData}>
              🔄 Sync
            </button>
          </div>

          {/* Volume Control */}
          <div className="control-group">
            <label>Volume: {Math.round(deckA.volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deckA.volume}
              onChange={(e) => setDeckVolume('deckA', Number(e.target.value))}
              disabled={!isAudioReady}
            />
          </div>

          {/* EQ Controls */}
          <div className="eq-section">
            <h4>3-Band EQ</h4>
            <div className="eq-controls">
              <div className="eq-band">
                <label>Low: {deckA.eq.low}dB</label>
                <input
                  type="range"
                  min="-24"
                  max="12"
                  value={deckA.eq.low}
                  onChange={(e) => setDeckEQ('deckA', { ...deckA.eq, low: Number(e.target.value) })}
                  disabled={!isAudioReady}
                />
              </div>
              <div className="eq-band">
                <label>Mid: {deckA.eq.mid}dB</label>
                <input
                  type="range"
                  min="-24"
                  max="12"
                  value={deckA.eq.mid}
                  onChange={(e) => setDeckEQ('deckA', { ...deckA.eq, mid: Number(e.target.value) })}
                  disabled={!isAudioReady}
                />
              </div>
              <div className="eq-band">
                <label>High: {deckA.eq.high}dB</label>
                <input
                  type="range"
                  min="-24"
                  max="12"
                  value={deckA.eq.high}
                  onChange={(e) => setDeckEQ('deckA', { ...deckA.eq, high: Number(e.target.value) })}
                  disabled={!isAudioReady}
                />
              </div>
            </div>
          </div>

          {/* Filter Control */}
          <div className="control-group">
            <label>Filter: {deckA.filter}Hz</label>
            <input
              type="range"
              min="20"
              max="20000"
              value={deckA.filter || 20000}
              onChange={(e) => setDeckFilter('deckA', Number(e.target.value))}
              disabled={!isAudioReady}
            />
          </div>

          {/* Track Info */}
          {deckA.trackData && (
            <div className="track-info">
              <p><strong>{deckA.trackData.title}</strong></p>
              <p>{deckA.trackData.artist}</p>
              <p>BPM: {deckA.trackData.bpm}</p>
              <p>Playback Rate: {deckA.playbackRate.toFixed(3)}x</p>
            </div>
          )}
        </div>

        {/* Deck B */}
        <div className="deck deck-b">
          <h3>Deck B</h3>

          {/* Transport Controls */}
          <div className="transport">
            <button onClick={() => handleLoadTrack('deckB')} disabled={!isAudioReady}>
              Load
            </button>
            <button onClick={() => play('deckB')} disabled={!isAudioReady || !deckB.trackData}>
              ▶ Play
            </button>
            <button onClick={() => pause('deckB')} disabled={!isAudioReady || !deckB.trackData}>
              ⏸ Pause
            </button>
            <button onClick={() => stop('deckB')} disabled={!isAudioReady || !deckB.trackData}>
              ⏹ Stop
            </button>
            <button onClick={() => syncToBpm('deckB')} disabled={!isAudioReady || !deckB.trackData}>
              🔄 Sync
            </button>
          </div>

          {/* Volume Control */}
          <div className="control-group">
            <label>Volume: {Math.round(deckB.volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deckB.volume}
              onChange={(e) => setDeckVolume('deckB', Number(e.target.value))}
              disabled={!isAudioReady}
            />
          </div>

          {/* EQ Controls */}
          <div className="eq-section">
            <h4>3-Band EQ</h4>
            <div className="eq-controls">
              <div className="eq-band">
                <label>Low: {deckB.eq.low}dB</label>
                <input
                  type="range"
                  min="-24"
                  max="12"
                  value={deckB.eq.low}
                  onChange={(e) => setDeckEQ('deckB', { ...deckB.eq, low: Number(e.target.value) })}
                  disabled={!isAudioReady}
                />
              </div>
              <div className="eq-band">
                <label>Mid: {deckB.eq.mid}dB</label>
                <input
                  type="range"
                  min="-24"
                  max="12"
                  value={deckB.eq.mid}
                  onChange={(e) => setDeckEQ('deckB', { ...deckB.eq, mid: Number(e.target.value) })}
                  disabled={!isAudioReady}
                />
              </div>
              <div className="eq-band">
                <label>High: {deckB.eq.high}dB</label>
                <input
                  type="range"
                  min="-24"
                  max="12"
                  value={deckB.eq.high}
                  onChange={(e) => setDeckEQ('deckB', { ...deckB.eq, high: Number(e.target.value) })}
                  disabled={!isAudioReady}
                />
              </div>
            </div>
          </div>

          {/* Filter Control */}
          <div className="control-group">
            <label>Filter: {deckB.filter}Hz</label>
            <input
              type="range"
              min="20"
              max="20000"
              value={deckB.filter || 20000}
              onChange={(e) => setDeckFilter('deckB', Number(e.target.value))}
              disabled={!isAudioReady}
            />
          </div>

          {/* Track Info */}
          {deckB.trackData && (
            <div className="track-info">
              <p><strong>{deckB.trackData.title}</strong></p>
              <p>{deckB.trackData.artist}</p>
              <p>BPM: {deckB.trackData.bpm}</p>
              <p>Playback Rate: {deckB.playbackRate.toFixed(3)}x</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .audio-engine-example {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .init-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .init-content {
          text-align: center;
          color: white;
        }

        .init-content button {
          margin-top: 20px;
          padding: 15px 30px;
          font-size: 18px;
          background: #00ffff;
          color: black;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .master-section {
          background: #1a1a1a;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          color: white;
        }

        .control-group {
          margin: 15px 0;
        }

        .crossfader-control {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .crossfader-control input {
          flex: 1;
        }

        .decks-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .deck {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          color: white;
        }

        .deck-a {
          border-left: 4px solid #00ffff;
        }

        .deck-b {
          border-left: 4px solid #ff00ff;
        }

        .transport {
          display: flex;
          gap: 10px;
          margin: 15px 0;
          flex-wrap: wrap;
        }

        .transport button {
          padding: 8px 12px;
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 4px;
          cursor: pointer;
        }

        .transport button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .transport button:not(:disabled):hover {
          background: #444;
        }

        .eq-section {
          margin: 20px 0;
        }

        .eq-controls {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .track-info {
          margin-top: 20px;
          padding: 15px;
          background: #1a1a1a;
          border-radius: 4px;
        }

        .track-info p {
          margin: 5px 0;
        }

        input[type="range"] {
          width: 100%;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .decks-section {
            grid-template-columns: 1fr;
          }

          .eq-controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
