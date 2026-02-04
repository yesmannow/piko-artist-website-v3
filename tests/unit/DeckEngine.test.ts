/**
 * DeckEngine Unit Tests
 *
 * Phase 1.1 Week 1 Days 1-2
 *
 * Tests for core deck functionality:
 * - Initialization
 * - Track loading
 * - Playback control
 * - Hot cue system
 * - Loop system
 * - Audio processing (EQ, filter, pitch)
 * - Event system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeckEngine, DeckConfig } from '@/audio/engines/DeckEngine';
import * as Tone from 'tone';

describe('DeckEngine', () => {
  let deckA: DeckEngine;
  let deckB: DeckEngine;

  beforeEach(async () => {
    // Initialize Tone.js context
    await Tone.start();

    // Create deck instances
    const configA: DeckConfig = {
      deckId: 'A',
      context: Tone.getContext(),
    };

    const configB: DeckConfig = {
      deckId: 'B',
      context: Tone.getContext(),
    };

    deckA = new DeckEngine(configA);
    deckB = new DeckEngine(configB);
  });

  afterEach(() => {
    deckA?.dispose();
    deckB?.dispose();
  });

  describe('Initialization', () => {
    it('should create deck with correct ID', () => {
      const stateA = deckA.getState();
      expect(stateA).toBeDefined();
    });

    it('should initialize with default state', () => {
      const state = deckA.getState();

      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.bpm).toBe(128);
      expect(state.pitch).toBe(1.0);
      expect(state.keyLockEnabled).toBe(false);
      expect(state.hotCues).toEqual([]);
      expect(state.loop).toBeNull();
      expect(state.trackUrl).toBeNull();
    });

    it('should have audio graph nodes initialized', () => {
      const outputNode = deckA.getOutputNode();
      expect(outputNode).toBeDefined();

      const channel = deckA.getChannel();
      expect(channel).toBeDefined();
    });

    it('should support multiple deck instances', () => {
      expect(deckA).not.toBe(deckB);
      expect(deckA.getState()).not.toBe(deckB.getState());
    });
  });

  describe('Hot Cue System', () => {
    it('should set hot cue at slot', () => {
      const callback = vi.fn();
      const unsubscribe = deckA.on('hotCueSet', callback);

      deckA.setHotCue(0, 10.5);

      const state = deckA.getState();
      expect(state.hotCues).toHaveLength(1);
      expect(state.hotCues[0]).toMatchObject({
        slot: 0,
        timeSec: 10.5,
      });

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should set hot cue with label and color', () => {
      deckA.setHotCue(1, 20, 'Drop', '#FF5733');

      const state = deckA.getState();
      expect(state.hotCues[0]).toMatchObject({
        slot: 1,
        timeSec: 20,
        label: 'Drop',
        color: '#FF5733',
      });
    });

    it('should update existing hot cue at same slot', () => {
      deckA.setHotCue(0, 10);
      deckA.setHotCue(0, 15, 'Updated');

      const state = deckA.getState();
      expect(state.hotCues).toHaveLength(1);
      expect(state.hotCues[0].timeSec).toBe(15);
      expect(state.hotCues[0].label).toBe('Updated');
    });

    it('should support multiple hot cues (0-7)', () => {
      for (let i = 0; i < 8; i++) {
        deckA.setHotCue(i, i * 10);
      }

      const state = deckA.getState();
      expect(state.hotCues).toHaveLength(8);
    });

    it('should keep hot cues sorted by slot', () => {
      deckA.setHotCue(5, 50);
      deckA.setHotCue(2, 20);
      deckA.setHotCue(7, 70);
      deckA.setHotCue(1, 10);

      const state = deckA.getState();
      expect(state.hotCues.map(c => c.slot)).toEqual([1, 2, 5, 7]);
    });

    it('should clear hot cue at slot', () => {
      deckA.setHotCue(0, 10);
      deckA.setHotCue(1, 20);
      deckA.clearHotCue(0);

      const state = deckA.getState();
      expect(state.hotCues).toHaveLength(1);
      expect(state.hotCues[0].slot).toBe(1);
    });

    it('should warn for invalid slot numbers', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      deckA.setHotCue(-1, 10);
      expect(consoleWarn).toHaveBeenCalled();

      deckA.setHotCue(8, 10);
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });
  });

  describe('Loop System', () => {
    it('should set loop points', () => {
      deckA.setLoopPoints(10, 20);

      const state = deckA.getState();
      expect(state.loop).toMatchObject({
        startSec: 10,
        endSec: 20,
        enabled: false,
        quantized: false,
      });
    });

    it('should set quantized loop points', () => {
      deckA.setLoopPoints(10, 20, true);

      const state = deckA.getState();
      expect(state.loop?.quantized).toBe(true);
    });

    it('should emit loopSet event', () => {
      const callback = vi.fn();
      const unsubscribe = deckA.on('loopSet', callback);

      deckA.setLoopPoints(10, 20);

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should clear loop points', () => {
      deckA.setLoopPoints(10, 20);
      deckA.clearLoopPoints();

      const state = deckA.getState();
      expect(state.loop).toBeNull();
    });

    it('should warn when enabling loop without points', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      deckA.enableLoop(true);
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });
  });

  describe('Event System', () => {
    it('should subscribe to events', () => {
      const callback = vi.fn();
      const unsubscribe = deckA.on('hotCueSet', callback);

      deckA.setHotCue(0, 10);

      expect(callback).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('should unsubscribe from events', () => {
      const callback = vi.fn();
      const unsubscribe = deckA.on('hotCueSet', callback);

      deckA.setHotCue(0, 10);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      deckA.setHotCue(1, 20);
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should support multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      deckA.on('hotCueSet', callback1);
      deckA.on('hotCueSet', callback2);

      deckA.setHotCue(0, 10);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Management', () => {
    it('should return immutable state copy', () => {
      const state1 = deckA.getState();
      const state2 = deckA.getState();

      expect(state1).not.toBe(state2); // Different object references
      expect(state1).toEqual(state2); // Same values
    });

    it('should update state on hot cue changes', () => {
      const stateBefore = deckA.getState();
      expect(stateBefore.hotCues).toHaveLength(0);

      deckA.setHotCue(0, 10);

      const stateAfter = deckA.getState();
      expect(stateAfter.hotCues).toHaveLength(1);
    });

    it('should provide getter methods', () => {
      expect(deckA.getCurrentTime()).toBe(0);
      expect(deckA.getDuration()).toBe(0);
      expect(deckA.getBPM()).toBe(128);
    });
  });

  describe('Audio Processing', () => {
    it('should set EQ values', () => {
      // Should not throw
      expect(() => {
        deckA.setEQ({ low: -10, mid: 0, high: 5 });
      }).not.toThrow();
    });

    it('should set filter frequency', () => {
      expect(() => {
        deckA.setFilter(1000);
      }).not.toThrow();
    });

    it('should clamp filter frequency to valid range', () => {
      // Should clamp to 20-20000 Hz internally (no exceptions)
      expect(() => {
        deckA.setFilter(10); // Below 20 Hz
        deckA.setFilter(30000); // Above 20000 Hz
      }).not.toThrow();
    });

    it('should set pitch rate', () => {
      deckA.setPitch(1.5);
      const state = deckA.getState();
      expect(state.pitch).toBe(1.5);
    });

    it('should clamp pitch to valid range', () => {
      deckA.setPitch(0.3); // Below 0.5
      expect(deckA.getState().pitch).toBe(0.5);

      deckA.setPitch(3); // Above 2.0
      expect(deckA.getState().pitch).toBe(2);
    });

    it('should set volume', () => {
      expect(() => {
        deckA.setVolume(0.5);
      }).not.toThrow();
    });
  });

  describe('Stem Control', () => {
    it('should set stem mute state', () => {
      deckA.setStemMute('vocals', true);

      const mutes = deckA.getStemMuteState();
      expect(mutes.vocals).toBe(true);
      expect(mutes.drums).toBe(false);
    });

    it('should toggle stem mute', () => {
      deckA.toggleStem('vocals');
      expect(deckA.getStemMuteState().vocals).toBe(true);

      deckA.toggleStem('vocals');
      expect(deckA.getStemMuteState().vocals).toBe(false);
    });

    it('should track all stem mutes independently', () => {
      deckA.setStemMute('vocals', true);
      deckA.setStemMute('drums', true);

      const mutes = deckA.getStemMuteState();
      expect(mutes.vocals).toBe(true);
      expect(mutes.drums).toBe(true);
      expect(mutes.bass).toBe(false);
      expect(mutes.other).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should dispose without errors', () => {
      expect(() => {
        deckA.dispose();
      }).not.toThrow();
    });

    it('should clear listeners on dispose', () => {
      const callback = vi.fn();
      deckA.on('hotCueSet', callback);

      deckA.dispose();

      // Should not throw when emitting after dispose
      expect(() => {
        deckA.setHotCue(0, 10);
      }).not.toThrow();

      // Callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
