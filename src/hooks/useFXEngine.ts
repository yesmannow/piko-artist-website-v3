import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { ensureAudioEngineReady } from '@/engine/AudioEngine';
import type {
  AutomationTrack,
  Keyframe,
} from '@/lib/fx/FXAutomation';
import {
  interpolateKeyframes,
  addKeyframe,
  removeKeyframe,
  updateKeyframe,
  getTrackValue,
  createAutomationTrack,
} from '@/lib/fx/FXAutomation';

export type DeckId = 'deckA' | 'deckB';
export type FXType = 'delay' | 'reverb' | 'filter';
export type FXPreset = {
  id: string;
  name: string;
  delay: number;
  reverb: number;
  filter: number;
  deck?: DeckId;
  automationTracks?: AutomationTrack[]; // Optional automation data
};

/**
 * useFXEngine - Hook for managing FX effects and presets
 * 
 * Provides a clean API for:
 * - Setting FX parameters per deck
 * - Managing FX presets
 * - Connecting to timeline player state
 * 
 * @example
 * ```tsx
 * const fx = useFXEngine();
 * fx.setFX('deckA', 'delay', 0.5);
 * fx.savePreset({ name: 'My Preset', delay: 0.5, reverb: 0.3 });
 * ```
 */
export function useFXEngine() {
  const [currentPreset, setCurrentPreset] = useState<FXPreset | null>(null);
  const [presets, setPresets] = useState<FXPreset[]>([]);
  const [activeDeck, setActiveDeck] = useState<DeckId>('deckA');
  const [automationTracks, setAutomationTracks] = useState<AutomationTrack[]>([]);
  const [isAutomationPlaying, setIsAutomationPlaying] = useState(false);
  const [automationTime, setAutomationTime] = useState(0);
  const automationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set FX parameter for a specific deck
  const setFX = useCallback(async (
    deck: DeckId,
    type: FXType,
    amount: number
  ) => {
    const engine = await ensureAudioEngineReady();
    await engine.setFX(deck, type, amount);
  }, []);

  // Set FX for both decks simultaneously
  const setFXBoth = useCallback(async (
    type: FXType,
    amount: number
  ) => {
    await Promise.all([
      setFX('deckA', type, amount),
      setFX('deckB', type, amount),
    ]);
  }, [setFX]);

  // Save current FX state as a preset
  const savePreset = useCallback((preset: Omit<FXPreset, 'id'>) => {
    const newPreset: FXPreset = {
      ...preset,
      id: `preset-${Date.now()}`,
    };
    setPresets(prev => [...prev, newPreset]);
    setCurrentPreset(newPreset);
    return newPreset;
  }, []);

  // Load a preset
  const loadPreset = useCallback(async (preset: FXPreset) => {
    const deck = preset.deck || activeDeck;
    
    await Promise.all([
      setFX(deck, 'delay', preset.delay),
      setFX(deck, 'reverb', preset.reverb),
      setFX(deck, 'filter', preset.filter),
    ]);
    
    setCurrentPreset(preset);
  }, [activeDeck, setFX]);

  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
    if (currentPreset?.id === presetId) {
      setCurrentPreset(null);
    }
  }, [currentPreset]);

  // Reset FX to defaults
  const resetFX = useCallback(async (deck: DeckId) => {
    await Promise.all([
      setFX(deck, 'delay', 0),
      setFX(deck, 'reverb', 0),
      setFX(deck, 'filter', 0),
    ]);
    setCurrentPreset(null);
  }, [setFX]);

  // Get current FX state (would need to read from engine - simplified for now)
  const getCurrentFXState = useCallback(async (deck: DeckId) => {
    // In a real implementation, this would read from the engine
    // For now, return defaults
    return {
      delay: 0,
      reverb: 0,
      filter: 0,
    };
  }, []);

  // Automation controls
  const startAutomation = useCallback(() => {
    setIsAutomationPlaying(true);
  }, []);

  const stopAutomation = useCallback(() => {
    setIsAutomationPlaying(false);
    setAutomationTime(0);
  }, []);

  const pauseAutomation = useCallback(() => {
    setIsAutomationPlaying(false);
  }, []);

  const seekAutomation = useCallback((time: number) => {
    setAutomationTime(time);
  }, []);

  // Apply automation values to engine
  useEffect(() => {
    if (!isAutomationPlaying || automationTracks.length === 0) return;

    const interval = setInterval(async () => {
      // Update time (60fps for smooth updates)
      setAutomationTime((prev) => {
        const newTime = Math.min(prev + 1 / 60, 60); // Max 60 seconds
        
        // Apply automation values
        automationTracks.forEach(async (track) => {
          const value = getTrackValue(track, newTime);
          const deck = track.deck || activeDeck;
          await setFX(deck, track.type, value);
        });

        return newTime;
      });
    }, 1000 / 60); // ~60fps

    automationIntervalRef.current = interval;

    return () => {
      if (automationIntervalRef.current) {
        clearInterval(automationIntervalRef.current);
      }
    };
  }, [isAutomationPlaying, automationTracks, activeDeck, setFX]);

  // Automation track management
  const addAutomationTrack = useCallback((
    name: string,
    type: FXType,
    deck?: DeckId
  ) => {
    const track = createAutomationTrack(name, type, deck);
    setAutomationTracks((prev) => [...prev, track]);
    return track;
  }, []);

  const removeAutomationTrack = useCallback((trackId: string) => {
    setAutomationTracks((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const updateAutomationTrack = useCallback((
    trackId: string,
    updates: Partial<AutomationTrack>
  ) => {
    setAutomationTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
    );
  }, []);

  const addKeyframeToTrack = useCallback((
    trackId: string,
    time: number,
    value: number
  ) => {
    setAutomationTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? addKeyframe(t, time, value) : t
      )
    );
  }, []);

  const removeKeyframeFromTrack = useCallback((
    trackId: string,
    keyframeTime: number
  ) => {
    setAutomationTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? removeKeyframe(t, keyframeTime) : t
      )
    );
  }, []);

  const updateKeyframeInTrack = useCallback((
    trackId: string,
    keyframeTime: number,
    newValue: number
  ) => {
    setAutomationTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? updateKeyframe(t, keyframeTime, newValue)
          : t
      )
    );
  }, []);

  return useMemo(() => ({
    // State
    currentPreset,
    presets,
    activeDeck,
    automationTracks,
    isAutomationPlaying,
    automationTime,
    
    // FX Actions
    setFX,
    setFXBoth,
    setActiveDeck,
    savePreset,
    loadPreset,
    deletePreset,
    resetFX,
    getCurrentFXState,
    
    // Automation Actions
    startAutomation,
    stopAutomation,
    pauseAutomation,
    seekAutomation,
    addAutomationTrack,
    removeAutomationTrack,
    updateAutomationTrack,
    addKeyframeToTrack,
    removeKeyframeFromTrack,
    updateKeyframeInTrack,
  }), [
    currentPreset,
    presets,
    activeDeck,
    automationTracks,
    isAutomationPlaying,
    automationTime,
    setFX,
    setFXBoth,
    savePreset,
    loadPreset,
    deletePreset,
    resetFX,
    getCurrentFXState,
    startAutomation,
    stopAutomation,
    pauseAutomation,
    seekAutomation,
    addAutomationTrack,
    removeAutomationTrack,
    updateAutomationTrack,
    addKeyframeToTrack,
    removeKeyframeFromTrack,
    updateKeyframeInTrack,
  ]);
}
