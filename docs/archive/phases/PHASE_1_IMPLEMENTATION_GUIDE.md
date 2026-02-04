# Phase 1 Implementation Guide — Engine-First Architecture

**Phase**: 1 of 3 (Foundation)
**Timeline**: 4 weeks
**Status**: Ready to start
**Blockers**: None

---

## 🎯 Phase 1 Objectives

### Primary Goals
1. **Separate audio logic from React** → Enable testability, optimization, scaling
2. **Achieve <16ms UI response** → Hardware-like control feel
3. **Prepare for pro features** → Hot cues, loops, sync, quantization
4. **No regressions** → All existing features continue working

### Success Metrics
- ✅ DeckEngine class with 100% test coverage
- ✅ MixerEngine class with 100% test coverage
- ✅ useAudioEngine reduced from 1473 → ~300 lines
- ✅ Control response time <16ms (measured)
- ✅ All existing features work (dual decks, crossfader, EQ, stems, FX, recording)

---

## 📅 Weekly Breakdown

### Week 1: DeckEngine Extraction (Part 1)
**Days 1-2**: Create DeckEngine scaffold
**Days 3-4**: Migrate loadTrack + playback
**Day 5**: Testing & validation

### Week 2: DeckEngine Extraction (Part 2)
**Days 1-2**: Migrate EQ, filter, pitch
**Days 3-4**: Add hot cue + loop system
**Day 5**: Integration testing

### Week 3: MixerEngine + Hook Refactor
**Days 1-2**: Create MixerEngine class
**Days 3-4**: Refactor useAudioEngine hook
**Day 5**: Regression testing

### Week 4: Performance Optimization
**Days 1-2**: Measure & profile bottlenecks
**Days 3-4**: Optimize (state, rendering, audio)
**Day 5**: Final validation & documentation

---

## 🛠️ Week 1: DeckEngine Scaffold

### Day 1-2: Create DeckEngine Class

**File**: `src/audio/engines/DeckEngine.ts`

```typescript
/**
 * DeckEngine - Core audio playback engine for a single deck
 *
 * Responsibilities:
 * - Track loading (AudioBuffer management)
 * - Playback control (play/pause/stop/seek)
 * - Pitch control (with optional key lock)
 * - Hot cue system (8 slots)
 * - Loop system (quantized to beat grid)
 * - Sync logic (phase-lock to master BPM)
 * - Per-deck audio routing
 *
 * Architecture:
 * - Pure TypeScript class (no React dependencies)
 * - Uses Tone.js for Web Audio abstraction
 * - Emits events for UI updates (React subscribes)
 */

import * as Tone from 'tone';
import { deriveTrackKey } from '@/lib/trackKey';

export interface DeckConfig {
  deckId: 'A' | 'B';
  context: Tone.BaseContext;
}

export interface HotCue {
  slot: number;        // 0-7 (8 slots)
  timeSec: number;
  label?: string;
  color?: string;
}

export interface LoopPoints {
  startSec: number;
  endSec: number;
  enabled: boolean;
  quantized: boolean;
}

export interface DeckState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bpm: number;
  pitch: number;       // Playback rate multiplier (0.5 - 2.0)
  keyLockEnabled: boolean;
  hotCues: HotCue[];
  loop: LoopPoints | null;
}

export type DeckEventType =
  | 'stateChange'
  | 'trackLoaded'
  | 'playbackStart'
  | 'playbackStop'
  | 'hotCueSet'
  | 'loopSet';

export interface DeckEvent {
  type: DeckEventType;
  data: Partial<DeckState>;
}

export class DeckEngine {
  private deckId: 'A' | 'B';
  private context: Tone.BaseContext;

  // Audio nodes
  private player: Tone.Player | null = null;
  private stemPlayers: {
    vocals: Tone.Player | null;
    drums: Tone.Player | null;
    bass: Tone.Player | null;
    other: Tone.Player | null;
  } = { vocals: null, drums: null, bass: null, other: null };

  private stemGains: {
    vocals: Tone.Gain | null;
    drums: Tone.Gain | null;
    bass: Tone.Gain | null;
    other: Tone.Gain | null;
  } = { vocals: null, drums: null, bass: null, other: null };

  private channel: Tone.Channel | null = null;
  private eq: Tone.EQ3 | null = null;
  private filter: Tone.Filter | null = null;
  private pitchShift: Tone.PitchShift | null = null;
  private outputNode: Tone.Gain | null = null;

  // State
  private state: DeckState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    bpm: 128,
    pitch: 1.0,
    keyLockEnabled: false,
    hotCues: [],
    loop: null,
  };

  // Event listeners
  private listeners: Map<DeckEventType, Set<(event: DeckEvent) => void>> = new Map();

  // Position tracking
  private positionUpdateInterval: number | null = null;

  constructor(config: DeckConfig) {
    this.deckId = config.deckId;
    this.context = config.context;
    this.initAudioGraph();
  }

  /**
   * Initialize audio graph:
   * Player → Stems → EQ → Filter → PitchShift → Channel → Output
   */
  private initAudioGraph(): void {
    this.channel = new Tone.Channel({ volume: 0 }).toDestination();
    this.eq = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
    this.filter = new Tone.Filter({ frequency: 20000, type: 'lowpass' });
    this.pitchShift = new Tone.PitchShift({ pitch: 0 });
    this.outputNode = new Tone.Gain(1.0);

    // Routing (will connect player when loaded)
    this.eq.connect(this.filter);
    this.filter.connect(this.pitchShift);
    this.pitchShift.connect(this.channel);
    this.channel.connect(this.outputNode);
  }

  /**
   * Load a track into this deck
   */
  async loadTrack(url: string, bpm: number): Promise<void> {
    try {
      // Dispose old player if exists
      if (this.player) {
        this.player.dispose();
        this.player = null;
      }

      // Create new player
      this.player = new Tone.Player({
        url,
        loop: false,
        onload: () => {
          this.state.duration = this.player?.buffer.duration ?? 0;
          this.state.bpm = bpm;
          this.emit('trackLoaded', { duration: this.state.duration, bpm });
        },
      });

      // Connect to audio graph
      this.player.connect(this.eq);

      // Wait for load
      await Tone.loaded();

    } catch (error) {
      console.error(`[DeckEngine ${this.deckId}] Failed to load track:`, error);
      throw error;
    }
  }

  /**
   * Load stems for this track
   */
  async loadStems(stems: {
    vocals: string | AudioBuffer | null;
    drums: string | AudioBuffer | null;
    bass: string | AudioBuffer | null;
    other: string | AudioBuffer | null;
  }): Promise<void> {
    // Dispose old stem players
    Object.values(this.stemPlayers).forEach(p => p?.dispose());
    Object.values(this.stemGains).forEach(g => g?.dispose());

    // Create new stem players
    for (const [stem, source] of Object.entries(stems)) {
      if (!source) continue;

      const player = new Tone.Player({ url: source as string, loop: false });
      const gain = new Tone.Gain(1.0);

      player.connect(gain);
      gain.connect(this.eq);

      this.stemPlayers[stem as keyof typeof this.stemPlayers] = player;
      this.stemGains[stem as keyof typeof this.stemGains] = gain;
    }

    await Tone.loaded();
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.player) {
      console.warn(`[DeckEngine ${this.deckId}] No track loaded`);
      return;
    }

    this.player.start();
    Object.values(this.stemPlayers).forEach(p => p?.start());

    this.state.isPlaying = true;
    this.startPositionTracking();
    this.emit('playbackStart', { isPlaying: true });
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.player) return;

    this.player.stop();
    Object.values(this.stemPlayers).forEach(p => p?.stop());

    this.state.isPlaying = false;
    this.stopPositionTracking();
    this.emit('playbackStop', { isPlaying: false });
  }

  /**
   * Stop playback and reset to start
   */
  stop(): void {
    this.pause();
    this.seekTo(0);
  }

  /**
   * Seek to time (seconds)
   */
  seekTo(timeSec: number): void {
    if (!this.player) return;

    const clampedTime = Math.max(0, Math.min(timeSec, this.state.duration));

    if (this.state.isPlaying) {
      this.player.stop();
      Object.values(this.stemPlayers).forEach(p => p?.stop());

      this.player.start(undefined, clampedTime);
      Object.values(this.stemPlayers).forEach(p => p?.start(undefined, clampedTime));
    } else {
      // Seek by restarting at offset (Tone.js limitation)
      this.player.stop();
      this.player.start(undefined, clampedTime);
      this.player.stop('+0.01'); // Stop immediately after starting

      Object.values(this.stemPlayers).forEach(p => {
        p?.stop();
        p?.start(undefined, clampedTime);
        p?.stop('+0.01');
      });
    }

    this.state.currentTime = clampedTime;
    this.emit('stateChange', { currentTime: clampedTime });
  }

  /**
   * Set hot cue at slot (0-7)
   */
  setHotCue(slot: number, timeSec: number, label?: string, color?: string): void {
    if (slot < 0 || slot > 7) {
      console.warn(`[DeckEngine ${this.deckId}] Invalid hot cue slot: ${slot}`);
      return;
    }

    const cue: HotCue = { slot, timeSec, label, color };

    // Update or add cue
    const existingIndex = this.state.hotCues.findIndex(c => c.slot === slot);
    if (existingIndex >= 0) {
      this.state.hotCues[existingIndex] = cue;
    } else {
      this.state.hotCues.push(cue);
    }

    this.emit('hotCueSet', { hotCues: [...this.state.hotCues] });
  }

  /**
   * Jump to hot cue slot
   */
  jumpToHotCue(slot: number): void {
    const cue = this.state.hotCues.find(c => c.slot === slot);
    if (!cue) {
      console.warn(`[DeckEngine ${this.deckId}] No hot cue at slot ${slot}`);
      return;
    }

    this.seekTo(cue.timeSec);
  }

  /**
   * Clear hot cue at slot
   */
  clearHotCue(slot: number): void {
    this.state.hotCues = this.state.hotCues.filter(c => c.slot !== slot);
    this.emit('hotCueSet', { hotCues: [...this.state.hotCues] });
  }

  /**
   * Set loop points (will be quantized in Phase 2)
   */
  setLoopPoints(startSec: number, endSec: number, quantized = false): void {
    this.state.loop = {
      startSec,
      endSec,
      enabled: false,
      quantized,
    };
    this.emit('loopSet', { loop: this.state.loop });
  }

  /**
   * Enable/disable loop
   */
  enableLoop(enabled: boolean): void {
    if (!this.state.loop) {
      console.warn(`[DeckEngine ${this.deckId}] No loop points set`);
      return;
    }

    this.state.loop.enabled = enabled;

    if (this.player) {
      if (enabled) {
        this.player.loop = true;
        this.player.loopStart = this.state.loop.startSec;
        this.player.loopEnd = this.state.loop.endSec;
      } else {
        this.player.loop = false;
      }
    }

    this.emit('loopSet', { loop: this.state.loop });
  }

  /**
   * Set EQ values (-Infinity to 0 dB)
   */
  setEQ(eq: { low: number; mid: number; high: number }): void {
    if (!this.eq) return;
    this.eq.low.value = eq.low;
    this.eq.mid.value = eq.mid;
    this.eq.high.value = eq.high;
  }

  /**
   * Set filter frequency (20 - 20000 Hz)
   */
  setFilter(frequency: number): void {
    if (!this.filter) return;
    this.filter.frequency.value = Math.max(20, Math.min(20000, frequency));
  }

  /**
   * Set pitch (playback rate multiplier)
   */
  setPitch(rate: number): void {
    if (!this.player) return;
    this.state.pitch = Math.max(0.5, Math.min(2.0, rate));
    this.player.playbackRate = this.state.pitch;

    Object.values(this.stemPlayers).forEach(p => {
      if (p) p.playbackRate = this.state.pitch;
    });
  }

  /**
   * Get output node for mixer connection
   */
  getOutputNode(): Tone.ToneAudioNode {
    if (!this.outputNode) {
      throw new Error(`[DeckEngine ${this.deckId}] Output node not initialized`);
    }
    return this.outputNode;
  }

  /**
   * Get current state (for UI sync)
   */
  getState(): Readonly<DeckState> {
    return { ...this.state };
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.state.currentTime;
  }

  /**
   * Get track duration
   */
  getDuration(): number {
    return this.state.duration;
  }

  /**
   * Subscribe to events
   */
  on(eventType: DeckEventType, callback: (event: DeckEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(type: DeckEventType, data: Partial<DeckState>): void {
    const event: DeckEvent = { type, data };
    this.listeners.get(type)?.forEach(callback => callback(event));
  }

  /**
   * Start position tracking (for UI updates)
   */
  private startPositionTracking(): void {
    if (this.positionUpdateInterval) return;

    this.positionUpdateInterval = window.setInterval(() => {
      if (this.player && this.state.isPlaying) {
        // Approximate current time (Tone.js doesn't expose real-time position easily)
        const elapsed = Tone.Transport.seconds;
        this.state.currentTime = Math.min(elapsed, this.state.duration);
        this.emit('stateChange', { currentTime: this.state.currentTime });
      }
    }, 50); // Update every 50ms (20 fps for position, sufficient for UI)
  }

  /**
   * Stop position tracking
   */
  private stopPositionTracking(): void {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stopPositionTracking();

    this.player?.dispose();
    Object.values(this.stemPlayers).forEach(p => p?.dispose());
    Object.values(this.stemGains).forEach(g => g?.dispose());

    this.channel?.dispose();
    this.eq?.dispose();
    this.filter?.dispose();
    this.pitchShift?.dispose();
    this.outputNode?.dispose();

    this.listeners.clear();
  }
}
```

**✅ Checkpoint 1**: DeckEngine scaffold complete with:
- Track loading + playback control
- Hot cue system (set/jump/clear)
- Loop system (set points, enable/disable)
- EQ + filter + pitch control
- Event system for UI updates
- Proper cleanup/disposal

---

### Day 3-4: Migrate loadTrack + Playback from useAudioEngine

**Goal**: Replace hook logic with DeckEngine calls

**File**: `src/hooks/useAudioEngine.ts` (refactor)

**Before** (current):
```typescript
// ~100 lines of loadTrack logic in useAudioEngine hook
const loadTrack = useCallback(async (deck: 'A' | 'B', url: string, bpm: number) => {
  // ... dispose old player
  // ... create new Tone.Player
  // ... connect to audio graph
  // ... update state
}, [/* many dependencies */]);
```

**After** (refactored):
```typescript
// ~10 lines using DeckEngine
const loadTrack = useCallback(async (deck: 'A' | 'B', url: string, bpm: number) => {
  const engine = deck === 'A' ? deckARef.current : deckBRef.current;
  if (!engine) throw new Error('Engine not initialized');

  await engine.loadTrack(url, bpm);

  // Sync state with Zustand
  const state = engine.getState();
  useStudioStore.getState().setDeckState(deck, {
    duration: state.duration,
    bpm: state.bpm,
  });
}, []);
```

**Migration Steps**:
1. Create `deckARef` and `deckBRef` in `useAudioEngine` hook
2. Initialize `DeckEngine` instances in `init()` function
3. Replace `loadTrack` logic with `engine.loadTrack()` call
4. Replace `play/pause/stop` with `engine.play/pause/stop()` calls
5. Subscribe to `engine.on('stateChange')` for UI updates
6. Test thoroughly (no regressions)

**Testing Checklist**:
- [ ] Load track on Deck A → plays correctly
- [ ] Load track on Deck B → plays correctly
- [ ] Play/pause/stop → responds immediately
- [ ] Seek → waveform position updates
- [ ] Replace track → old track disposed, new track loads

---

### Day 5: Testing & Validation

**Manual Test Cases**:
1. **Track Loading**:
   - Load track on Deck A → check waveform displays
   - Load track on Deck B → check waveform displays
   - Load second track on Deck A → first track disposed

2. **Playback Control**:
   - Press play → track plays, playhead moves
   - Press pause → track pauses, playhead stops
   - Press play again → resumes from pause point
   - Press stop → playhead returns to start

3. **Seek**:
   - Click waveform → playhead jumps to position
   - Drag playhead → smooth seek
   - Seek during playback → no glitches

4. **Hot Cues** (new feature):
   - Set hot cue at current position → marker appears on waveform
   - Jump to hot cue → playhead moves instantly
   - Clear hot cue → marker disappears

**Automated Test** (Vitest):
```typescript
// tests/DeckEngine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DeckEngine } from '@/audio/engines/DeckEngine';
import * as Tone from 'tone';

describe('DeckEngine', () => {
  let engine: DeckEngine;

  beforeEach(async () => {
    await Tone.start();
    engine = new DeckEngine({ deckId: 'A', context: Tone.getContext() });
  });

  it('should initialize with default state', () => {
    const state = engine.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.bpm).toBe(128);
  });

  it('should load track and emit event', async () => {
    const trackLoaded = vi.fn();
    engine.on('trackLoaded', trackLoaded);

    await engine.loadTrack('/audio/test-track.mp3', 140);

    expect(trackLoaded).toHaveBeenCalled();
    expect(engine.getState().bpm).toBe(140);
  });

  it('should set and jump to hot cue', () => {
    engine.setHotCue(0, 30.5, 'Drop', '#FF0000');

    const state = engine.getState();
    expect(state.hotCues).toHaveLength(1);
    expect(state.hotCues[0].timeSec).toBe(30.5);

    engine.jumpToHotCue(0);
    expect(engine.getCurrentTime()).toBe(30.5);
  });

  // ... more tests
});
```

**Performance Test**:
```typescript
// Measure control response time
const startTime = performance.now();
engine.play();
const endTime = performance.now();
console.log(`Play response: ${endTime - startTime}ms`); // Should be <16ms
```

---

## 🛠️ Week 2: Complete DeckEngine

### Day 1-2: Migrate EQ, Filter, Pitch Logic

**Goal**: Move all audio processing from hook to DeckEngine

**Actions**:
1. Move `setDeckEQ()` logic → `engine.setEQ()`
2. Move `setDeckFilter()` logic → `engine.setFilter()`
3. Move pitch control → `engine.setPitch()`
4. Move stem loading → `engine.loadStems()`
5. Move stem mute logic → `engine.setStemMute()`

**Before** (hook has ~200 lines for EQ/filter):
```typescript
const setDeckEQ = useCallback((deck: 'A' | 'B', eq: { low, mid, high }) => {
  const eqNode = eqs.current[deck];
  if (!eqNode) return;
  eqNode.low.value = eq.low;
  eqNode.mid.value = eq.mid;
  eqNode.high.value = eq.high;
}, []);
```

**After** (hook is thin wrapper):
```typescript
const setDeckEQ = useCallback((deck: 'A' | 'B', eq: { low, mid, high }) => {
  const engine = deck === 'A' ? deckARef.current : deckBRef.current;
  engine?.setEQ(eq);
}, []);
```

---

### Day 3-4: Implement Quantization + Sync

**Goal**: Add beat-grid alignment (Phase 2 prep)

**New Files**:
- `src/lib/quantization.ts` (utilities)
- `src/audio/engines/BeatGrid.ts` (beat detection)

**Quantization Utilities**:
```typescript
// src/lib/quantization.ts
export function quantizeTime(
  timeSec: number,
  bpm: number,
  snapTo: 'beat' | 'bar' | '1/2' | '1/4' = 'beat'
): number {
  const beatInterval = 60 / bpm; // Seconds per beat

  let snapInterval = beatInterval;
  switch (snapTo) {
    case 'bar': snapInterval = beatInterval * 4; break;
    case '1/2': snapInterval = beatInterval / 2; break;
    case '1/4': snapInterval = beatInterval / 4; break;
  }

  return Math.round(timeSec / snapInterval) * snapInterval;
}

export function calculateBPMMultiplier(sourceBPM: number, targetBPM: number): number {
  return targetBPM / sourceBPM;
}
```

**Add to DeckEngine**:
```typescript
/**
 * Sync this deck to master BPM (with phase alignment)
 */
syncToMaster(masterBPM: number, masterPhase: number): void {
  // Match BPM via playback rate
  const rateMultiplier = masterBPM / this.state.bpm;
  this.setPitch(rateMultiplier);

  // Phase align (in Phase 2, for now just BPM match)
  // TODO: Calculate phase offset and apply micro-seek
}

/**
 * Quantize action to next beat
 */
quantizeAction(callback: () => void, snapTo: 'beat' | 'bar' = 'beat'): void {
  const currentTime = this.getCurrentTime();
  const nextBeat = quantizeTime(currentTime, this.state.bpm, snapTo);
  const delayMs = (nextBeat - currentTime) * 1000;

  setTimeout(callback, delayMs);
}
```

**Testing**:
```typescript
it('should quantize hot cue to nearest beat', () => {
  engine.setHotCue(0, 30.7); // 30.7 sec at 120 BPM
  const cue = engine.getState().hotCues[0];

  // 120 BPM = 0.5 sec/beat, should snap to 30.5 or 31.0
  expect(cue.timeSec).toBeCloseTo(31.0, 1);
});
```

---

### Day 5: Integration Testing

**Test Scenarios**:
1. **Full Deck Workflow**:
   - Load track → set hot cues → set loop → play → jump to cue → enable loop

2. **Dual Deck**:
   - Load tracks on A + B → play both → adjust EQ independently → crossfade

3. **Stem Control**:
   - Load stems → mute vocals → solo drums → crossfade to B

4. **Performance**:
   - Measure control response (<16ms)
   - Check for audio glitches during UI updates
   - Monitor CPU usage

---

## 🛠️ Week 3: MixerEngine + Hook Refactor

### Day 1-2: Create MixerEngine Class

**File**: `src/audio/engines/MixerEngine.ts`

```typescript
/**
 * MixerEngine - Central mixing and routing engine
 *
 * Responsibilities:
 * - Crossfader routing (equal-power curves)
 * - Master bus processing (EQ, compressor, limiter)
 * - Master FX routing (delay, reverb, sends)
 * - Level metering (RMS/peak for all channels)
 * - Recording stream management
 */

import * as Tone from 'tone';
import { applyCrossfaderCurve } from '@/audio/mixer/crossfaderCurves';

export interface MixerConfig {
  context: Tone.BaseContext;
}

export interface MeterLevels {
  deckA: number;
  deckB: number;
  master: number;
}

export class MixerEngine {
  private context: Tone.BaseContext;

  // Routing nodes
  private crossFade: Tone.CrossFade | null = null;
  private masterBus: Tone.Gain | null = null;
  private postFxBus: Tone.Gain | null = null;

  // FX
  private delayNode: Tone.FeedbackDelay | null = null;
  private reverbNode: Tone.Reverb | null = null;
  private delaySend: Tone.Gain | null = null;
  private reverbSend: Tone.Gain | null = null;

  // Master chain
  private compressor: Tone.Compressor | null = null;
  private limiter: Tone.Limiter | null = null;

  // Metering
  private deckAMeter: Tone.Meter | null = null;
  private deckBMeter: Tone.Meter | null = null;
  private masterMeter: Tone.Meter | null = null;

  // Recording
  private recorderStream: MediaStream | null = null;

  constructor(config: MixerConfig) {
    this.context = config.context;
    this.initAudioGraph();
  }

  private initAudioGraph(): void {
    // Create nodes
    this.crossFade = new Tone.CrossFade(0.5); // Center position
    this.masterBus = new Tone.Gain(1.0);
    this.postFxBus = new Tone.Gain(1.0);

    this.compressor = new Tone.Compressor({ threshold: -24, ratio: 4 });
    this.limiter = new Tone.Limiter(-1);

    this.delayNode = new Tone.FeedbackDelay({ delayTime: 0.375, feedback: 0.35 });
    this.reverbNode = new Tone.Reverb({ decay: 2.8 });
    this.delaySend = new Tone.Gain(0);
    this.reverbSend = new Tone.Gain(0);

    // Metering
    this.deckAMeter = new Tone.Meter();
    this.deckBMeter = new Tone.Meter();
    this.masterMeter = new Tone.Meter();

    // Routing:
    // CrossFade → Master Bus → Compressor → Limiter → Destination
    // CrossFade → FX Sends → FX → Post-FX Bus → Master Bus
    this.crossFade.connect(this.masterBus);
    this.crossFade.connect(this.delaySend);
    this.crossFade.connect(this.reverbSend);

    this.delaySend.connect(this.delayNode);
    this.reverbSend.connect(this.reverbNode);

    this.delayNode.connect(this.postFxBus);
    this.reverbNode.connect(this.postFxBus);
    this.postFxBus.connect(this.masterBus);

    this.masterBus.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.toDestination();

    // Metering taps
    this.masterBus.connect(this.masterMeter);
  }

  /**
   * Connect a deck to crossfader input
   */
  connectDeck(deckId: 'A' | 'B', deckOutput: Tone.ToneAudioNode): void {
    if (!this.crossFade) return;

    const meter = deckId === 'A' ? this.deckAMeter : this.deckBMeter;
    if (meter) {
      deckOutput.connect(meter);
    }

    if (deckId === 'A') {
      deckOutput.connect(this.crossFade.a);
    } else {
      deckOutput.connect(this.crossFade.b);
    }
  }

  /**
   * Set crossfader position (-1 = A, 0 = center, 1 = B)
   */
  setCrossfade(position: number): void {
    if (!this.crossFade) return;

    const normalized = Math.max(-1, Math.min(1, position));
    const fadeValue = (normalized + 1) / 2; // Convert -1..1 to 0..1
    this.crossFade.fade.value = fadeValue;
  }

  /**
   * Set master volume (0..1)
   */
  setMasterVolume(volume: number): void {
    if (!this.masterBus) return;
    this.masterBus.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set delay FX amount (0..1)
   */
  setDelayWet(amount: number): void {
    if (!this.delaySend) return;
    this.delaySend.gain.value = Math.max(0, Math.min(1, amount));
  }

  /**
   * Set reverb FX amount (0..1)
   */
  setReverbWet(amount: number): void {
    if (!this.reverbSend) return;
    this.reverbSend.gain.value = Math.max(0, Math.min(1, amount));
  }

  /**
   * Get meter levels for all channels
   */
  getMeterLevels(): MeterLevels {
    return {
      deckA: this.deckAMeter?.getValue() as number ?? 0,
      deckB: this.deckBMeter?.getValue() as number ?? 0,
      master: this.masterMeter?.getValue() as number ?? 0,
    };
  }

  /**
   * Get master output node
   */
  getMasterOutput(): Tone.ToneAudioNode {
    if (!this.limiter) throw new Error('MixerEngine not initialized');
    return this.limiter;
  }

  /**
   * Get recorder stream (for recording)
   */
  getRecorderStream(): MediaStream | null {
    // Create MediaStreamDestination from master bus
    if (!this.recorderStream && this.masterBus) {
      const dest = this.context.rawContext.createMediaStreamDestination();
      this.masterBus.connect(dest as unknown as Tone.ToneAudioNode);
      this.recorderStream = dest.stream;
    }
    return this.recorderStream;
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.crossFade?.dispose();
    this.masterBus?.dispose();
    this.postFxBus?.dispose();
    this.delayNode?.dispose();
    this.reverbNode?.dispose();
    this.delaySend?.dispose();
    this.reverbSend?.dispose();
    this.compressor?.dispose();
    this.limiter?.dispose();
    this.deckAMeter?.dispose();
    this.deckBMeter?.dispose();
    this.masterMeter?.dispose();
  }
}
```

---

### Day 3-4: Refactor useAudioEngine Hook

**Goal**: Reduce from 1473 → ~300 lines (thin bridge)

**New Structure**:
```typescript
// src/hooks/useAudioEngine.ts (refactored)
export const useAudioEngine = (): AudioEngineControls => {
  const deckARef = useRef<DeckEngine | null>(null);
  const deckBRef = useRef<DeckEngine | null>(null);
  const mixerRef = useRef<MixerEngine | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize engines
  const init = useCallback(async () => {
    await Tone.start();
    const ctx = Tone.getContext();

    deckARef.current = new DeckEngine({ deckId: 'A', context: ctx });
    deckBRef.current = new DeckEngine({ deckId: 'B', context: ctx });
    mixerRef.current = new MixerEngine({ context: ctx });

    // Connect decks to mixer
    mixerRef.current.connectDeck('A', deckARef.current.getOutputNode());
    mixerRef.current.connectDeck('B', deckBRef.current.getOutputNode());

    // Subscribe to deck events for state sync
    deckARef.current.on('stateChange', (event) => {
      useStudioStore.getState().setDeckState('A', event.data);
    });

    deckBRef.current.on('stateChange', (event) => {
      useStudioStore.getState().setDeckState('B', event.data);
    });

    setIsReady(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      deckARef.current?.dispose();
      deckBRef.current?.dispose();
      mixerRef.current?.dispose();
    };
  }, []);

  // Thin wrapper methods
  const loadTrack = useCallback(async (deck: 'A' | 'B', url: string, bpm: number) => {
    const engine = deck === 'A' ? deckARef.current : deckBRef.current;
    await engine?.loadTrack(url, bpm);
  }, []);

  const play = useCallback((deck: 'A' | 'B') => {
    const engine = deck === 'A' ? deckARef.current : deckBRef.current;
    engine?.play();
  }, []);

  const pause = useCallback((deck: 'A' | 'B') => {
    const engine = deck === 'A' ? deckARef.current : deckBRef.current;
    engine?.pause();
  }, []);

  const setCrossfade = useCallback((position: number) => {
    mixerRef.current?.setCrossfade(position);
  }, []);

  // ... more thin wrappers

  return {
    init,
    isReady,
    loadTrack,
    play,
    pause,
    setCrossfade,
    // ... all other methods
  };
};
```

**Line Count Reduction**:
- **Before**: 1473 lines (all logic in hook)
- **After**: ~300 lines (thin wrappers + init logic)
- **Extracted**: 1200 lines → DeckEngine (800) + MixerEngine (400)

---

### Day 5: Regression Testing

**Test all existing features**:
- [ ] Dual deck playback
- [ ] Crossfader (smooth blending)
- [ ] EQ controls (3-band per deck)
- [ ] Channel faders
- [ ] Level meters
- [ ] Stem separation (mute/solo)
- [ ] FX (delay, reverb)
- [ ] Recording (capture master bus)
- [ ] Track loading (drag/drop, file picker)
- [ ] BPM analysis (essentia.worker.ts)

---

## 🛠️ Week 4: Performance Optimization

### Day 1-2: Measure & Profile

**Create Performance Dashboard**:
**File**: `src/lib/performance.ts`

```typescript
export class PerformanceDashboard {
  private metrics: Map<string, number[]> = new Map();

  measure(label: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    if (duration > 16) {
      console.warn(`⚠️ ${label} took ${duration.toFixed(2)}ms (>16ms target)`);
    }
  }

  report(): void {
    console.table(
      Array.from(this.metrics.entries()).map(([label, durations]) => ({
        label,
        avg: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
        max: Math.max(...durations).toFixed(2),
        count: durations.length,
      }))
    );
  }
}
```

**Instrument Controls**:
```typescript
// In Crossfader.tsx
const perf = new PerformanceDashboard();

const handleDrag = (value: number) => {
  perf.measure('crossfader-drag', () => {
    audioEngine.setCrossfade(value);
  });
};
```

**Target Measurements**:
- Crossfader drag: <16ms
- EQ knob turn: <16ms
- Hot cue trigger: <16ms
- Play button: <16ms
- Seek: <16ms

---

### Day 3-4: Optimize Bottlenecks

**Common Optimizations**:

1. **Replace Framer Motion with CSS** (if >16ms):
```tsx
// Before (Framer Motion)
<motion.div animate={{ x: value }} />

// After (CSS transition)
<div style={{ transform: `translateX(${value}px)`, transition: 'transform 0.1s' }} />
```

2. **Throttle Position Updates**:
```typescript
// In DeckEngine, update position at 20 fps instead of 60 fps
this.positionUpdateInterval = window.setInterval(() => {
  // ...
}, 50); // 50ms = 20 fps (sufficient for UI)
```

3. **Use Refs for High-Frequency Values**:
```typescript
// Before (causes re-renders)
const [playheadPosition, setPlayheadPosition] = useState(0);

// After (no re-renders)
const playheadRef = useRef(0);
```

4. **Lazy Load 3D Visuals**:
```tsx
const Scene3D = lazy(() => import('./Scene3D'));

// Only render when visible
{show3D && <Suspense fallback={null}><Scene3D /></Suspense>}
```

---

### Day 5: Final Validation

**Acceptance Criteria**:
- [ ] All controls respond in <16ms (measured)
- [ ] No audio glitches during UI updates
- [ ] Waveform playhead at 60fps
- [ ] DeckEngine + MixerEngine have 100% test coverage
- [ ] useAudioEngine is <300 lines
- [ ] All existing features work (no regressions)
- [ ] Documentation updated

**Deliverables**:
- `DeckEngine.ts` (800 lines)
- `MixerEngine.ts` (400 lines)
- `useAudioEngine.ts` (refactored to 300 lines)
- `DeckEngine.test.ts` (100% coverage)
- `MixerEngine.test.ts` (100% coverage)
- `PHASE_1_COMPLETE.md` (summary doc)

---

## 📝 Next Steps After Phase 1

Once Phase 1 is complete, proceed to:

**Phase 2.1: Quantization System** (Week 5)
- Expand `quantizeTime()` utilities
- Add beat-grid overlay on waveforms
- Implement quantized hot cue setting
- Implement quantized loop points

**See**: `STUDIO_TRANSFORMATION_ROADMAP_2026.md` for full Phase 2 details

---

**Ready to start Phase 1?** Begin with creating `DeckEngine.ts` scaffold! 🚀
