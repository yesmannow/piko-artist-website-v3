"use client";

import { useDeck } from '../hooks/useDeck';
import { useChannelStrip } from '../hooks/useChannelStrip';
import { Waveform } from './Waveform';
import { AudioContextManager } from '../lib/AudioContextManager';
import { useDeviceCapabilities } from '../../ai-separation/hooks/useDeviceCapabilities';
import { StemService } from '../../ai-separation/services/StemService';
import { useState, useEffect, useRef } from 'react';
import type { Stem } from '@/lib/types/audio';
import { useHaptic } from '@/hooks/useHaptic';
import { Fader } from '../../ui-glass/controls/Fader';

/**
 * Deck Component Props
 */
export interface DeckProps {
  deckId: 'A' | 'B';
  trackUrl: string | null;
  color?: string;
  onDrop?: (url: string) => void;
}

/**
 * Deck - Individual DJ deck component
 *
 * Features:
 * - Audio playback with fire-and-forget pattern
 * - Responsive waveform visualization
 * - Vinyl nudge/scratching
 * - AI stem separation (if enabled)
 * - 4-stem visualization (mobile toggles, desktop faders)
 */
export function Deck({ deckId, trackUrl, color = '#00f0ff', onDrop }: DeckProps) {
  const manager = AudioContextManager.getInstance();
  const audioContext = manager.getContext();

  const channelStrip = useChannelStrip(deckId);
  const capabilities = useDeviceCapabilities();

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [stems, setStems] = useState<Map<string, Stem>>(new Map());
  const [isSeparating, setIsSeparating] = useState(false);
  const [separationProgress, setSeparationProgress] = useState(0);

  const stemServiceRef = useRef<StemService | null>(null);

  const deck = useDeck(trackUrl, channelStrip);
  const { triggerHaptic } = useHaptic();

  // Load audio buffer when track changes
  useEffect(() => {
    if (!trackUrl || !audioContext) return;

    const loadBuffer = async () => {
      try {
        const response = await fetch(trackUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
      } catch (error) {
        console.error('[Deck] Failed to load audio:', error);
      }
    };

    loadBuffer();
  }, [trackUrl, audioContext]);

  // Initialize stem service if AI is enabled
  useEffect(() => {
    if (capabilities.ai && !stemServiceRef.current) {
      stemServiceRef.current = new StemService();
      stemServiceRef.current.initialize();
    }

    return () => {
      if (stemServiceRef.current) {
        stemServiceRef.current.terminate();
        stemServiceRef.current = null;
      }
    };
  }, [capabilities.ai]);

  // Handle stem separation
  const handleSeparateStems = async () => {
    if (!audioBuffer || !stemServiceRef.current || !capabilities.ai) return;

    setIsSeparating(true);
    setSeparationProgress(0);

    try {
      const result = await stemServiceRef.current.separateStems(
        audioBuffer,
        (progress) => {
          setSeparationProgress(progress.progress);
        }
      );

      // Convert AudioBuffers to Stem objects
      const stemMap = new Map<string, Stem>();
      result.stems.forEach((buffer, name) => {
        stemMap.set(name, {
          name: name as 'drums' | 'bass' | 'vocals' | 'other',
          buffer,
          gain: 1.0,
        });
      });

      setStems(stemMap);
    } catch (error) {
      console.error('[Deck] Stem separation failed:', error);
    } finally {
      setIsSeparating(false);
    }
  };

  // Handle vinyl nudge
  const handleNudge = (rate: number) => {
    deck.setPlaybackRate(rate);
  };

  const isMobile = capabilities.isMobile;

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      const track = JSON.parse(data);
      if (track.track_metadata?.url && onDrop) {
        onDrop(track.track_metadata.url);
      }
    } catch (error) {
      console.error('[Deck] Failed to parse drop data:', error);
    }
  };

  return (
    <div
      className="bg-glass-surface border border-glass-border p-4 rounded-lg"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Deck {deckId}</h3>

        {/* Waveform */}
        {audioBuffer && (
          <Waveform
            audioBuffer={audioBuffer}
            progress={deck.state.currentTime / deck.state.duration}
            isPlaying={deck.state.isPlaying}
            onSeek={deck.seek}
            onNudge={handleNudge}
            height={isMobile ? 80 : 120}
          />
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => {
              triggerHaptic(10); // Haptic feedback on play/pause
              if (deck.state.isPlaying) {
                deck.pause();
              } else {
                deck.play();
              }
            }}
            className="w-14 h-14 bg-[#FFD700] text-black rounded-full flex items-center justify-center touch-manipulation"
            aria-label={deck.state.isPlaying ? 'Pause' : 'Play'}
          >
            {deck.state.isPlaying ? '⏸' : '▶'}
          </button>

          {/* AI Separation Button (Desktop only) */}
          {capabilities.ai && !isMobile && (
            <button
              onClick={handleSeparateStems}
              disabled={isSeparating || !audioBuffer}
              className="px-4 py-2 bg-[#00f0ff] text-black rounded font-bold touch-manipulation disabled:opacity-50"
            >
              {isSeparating ? `Separating... ${Math.round(separationProgress * 100)}%` : 'Separate Stems'}
            </button>
          )}
        </div>

        {/* Stem Controls */}
        {stems.size > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-bold text-white mb-2">Stems</h4>

            {isMobile ? (
              // Mobile: Toggle buttons
              <div className="grid grid-cols-2 gap-2">
                {Array.from(stems.entries()).map(([name, stem]) => (
                  <button
                    key={name}
                    onClick={() => {
                      triggerHaptic(10); // Haptic feedback on toggle
                      const newStems = new Map(stems);
                      newStems.set(name, { ...stem, gain: stem.gain > 0 ? 0 : 1.0 });
                      setStems(newStems);
                    }}
                    className={`px-3 py-2 rounded border-2 touch-manipulation ${
                      stem.gain > 0
                        ? 'bg-[#FFD700] text-black border-[#FFD700]'
                        : 'bg-transparent text-white border-white/20'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              // Desktop: Vertical faders
              <div className="flex gap-4">
                {Array.from(stems.entries()).map(([name, stem]) => (
                  <Fader
                    key={name}
                    value={stem.gain}
                    onChange={(newValue) => {
                      const newStems = new Map(stems);
                      newStems.set(name, { ...stem, gain: newValue });
                      setStems(newStems);
                    }}
                    orientation="vertical"
                    min={0}
                    max={1}
                    step={0.01}
                    label={name}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
