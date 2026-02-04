# Studio Transformation Roadmap — 2026 Pro-Level DJ Software

**Status**: Strategic Audit Complete — Awaiting Approval
**Objective**: Transform Piko Studio into top-tier DJ software rivaling djay Pro, Serato, and Traktor
**Target**: <16ms UI response, hardware-like tactile controls, no-scroll desktop, mobile landscape performance mode

---

## 🎯 Executive Summary

### Current State (MVP Foundation)
✅ **Solid Foundation Exists**:
- Dual-deck architecture with Tone.js audio graph
- Crossfader with configurable curves
- 3-band EQ per deck (low/mid/high)
- Channel faders with gain control
- RMS/peak level metering
- WaveSurfer waveform visualization
- Track loading (drag/drop + file picker)
- BPM/key analysis via essentia.worker.ts
- Stem separation capability (vocals, drums, bass, other)
- Basic FX rack (delay, reverb with sends)
- Recording functionality
- Beat grid visualization
- **122 Studio components** across layouts, controls, visuals

### Architecture Gap Analysis
⚠️ **Current**: React hook-centric (all logic in `useAudioEngine.ts` — 1473 lines)
🎯 **Target**: Engine-first architecture (DeckEngine/MixerEngine classes, React as view layer)

**Key Architectural Issues**:
1. **All audio logic lives in React hook** → Need separation of concerns
2. **No AudioWorklet** → Timing limited by main thread (>16ms possible)
3. **No quantization system** → Cues/loops drift from beat grid
4. **Hook-centric state** → Hard to test, debug, optimize
5. **Desktop-only layout** → No true mobile landscape performance mode
6. **Scroll-heavy UI** → Not "no-scroll" fixed viewport

### Missing Pro Features
❌ **Performance DJ Essentials**:
- Hot cues (4-8 per deck with visual feedback)
- Loop controls (1/2/4/8 bars with quantized in/out)
- Sync button with stable beatgrid alignment
- Pitch + key lock (time stretching)
- Beat jump, slip mode
- Extended FX rack (6-12 effects with routing)
- Keyboard mapping system
- MIDI controller support
- Saved sets/playlists/history

---

## 📊 Technical Inventory

### Existing Audio Stack
| Component | Location | Lines | Purpose | Status |
|-----------|----------|-------|---------|--------|
| `useAudioEngine.ts` | `src/hooks/` | 1473 | Central audio hook (all-in-one) | ⚠️ Needs refactoring |
| `useStudioStore.ts` | `src/store/` | ~400 | Zustand state (decks, crossfader) | ✅ Good |
| `audio-engine.ts` | `src/lib/` | 540 | AudioBuffer manager + scheduler | ⚠️ Unused/duplicated |
| `Engine.ts` | `src/audio/` | 85 | Tone.js singleton wrapper | ⚠️ Unused/duplicated |
| `essentia.worker.ts` | `src/workers/` | ~300 | BPM/key analysis worker | ✅ Good |
| `audioUtils.ts` | `src/utils/` | ~200 | Audio helpers (has `quantizeLoop`!) | ✅ Good |

**Discovery**: `audioUtils.ts` already has `quantizeLoop()` function — quantization groundwork exists!
**Discovery**: `useStore.ts` has `HotCue` interface and state management (Phase S9 started but incomplete)

### Existing UI Components (122 Files)
**Layouts**: StudioGrid, MixerCenter, LibraryRow, PerformanceRow, MobileLandscapeWorkstation, MobilePortraitPocketStudio
**Controls**: Crossfader, DeckEQ, ChannelFader, LevelMeter, DeckWaveform, BeatGrid, JogPlatter3D
**FX**: DeckFXRack, TapeStopButton, BitcrusherControl, DelayControl, ReverbControl
**3D/Visuals**: Scene3D, FluidBackground

### Dependencies (Audio/Performance Critical)
- **Tone.js** (v15.x) — Primary audio engine ✅ LOCKED per architecture rules
- **wavesurfer.js** (v7.x) — Waveform visualization ✅ Visual only per rules
- **essentia.js** — BPM/key analysis ✅ Worker-based
- **Framer Motion** — Animations (potential 16ms bottleneck ⚠️)
- **React Three Fiber** — 3D visuals (potential bottleneck ⚠️)

---

## 🏗️ Three-Phase Transformation Strategy

---

### **PHASE 1: Engine-First Architecture Refactor** (Foundation)
**Goal**: Separate audio logic from React, enable <16ms UI, prepare for advanced features
**Timeline**: 3-4 weeks
**Complexity**: High (structural refactoring)

#### 1.1 Extract DeckEngine Class (Week 1-2)
**New File**: `src/audio/engines/DeckEngine.ts`

**Responsibilities**:
- Track loading (AudioBuffer management)
- Playback control (play/pause/stop/seek)
- Pitch control (playbackRate with optional key lock)
- Hot cue system (8 slots per deck)
- Loop system (quantized in/out points)
- Beat grid alignment
- Sync logic (phase-lock to master BPM)
- Per-deck FX chain routing

**Interface**:
```typescript
class DeckEngine {
  constructor(context: Tone.BaseContext, deckId: 'A' | 'B');

  // Lifecycle
  async loadTrack(url: string, bpm: number): Promise<void>;
  dispose(): void;

  // Transport
  play(): void;
  pause(): void;
  stop(): void;
  seekTo(seconds: number): void;

  // Sync & Timing
  syncToMasterBPM(masterBPM: number): void;
  setBeatGrid(bpm: number, offset: number): void;
  quantizeAction(callback: () => void): void; // Run callback on next beat

  // Hot Cues
  setHotCue(slot: number, timeSec: number, label?: string, color?: string): void;
  jumpToHotCue(slot: number): void;
  clearHotCue(slot: number): void;

  // Loops
  setLoopIn(timeSec?: number): void; // Auto-quantize to beat
  setLoopOut(timeSec?: number): void; // Auto-quantize to beat
  enableLoop(enabled: boolean): void;
  beatJump(beats: number): void; // Jump forward/back by beats

  // Performance
  slipMode(enabled: boolean): void; // Silent seek while playing

  // Audio Graph Access
  getOutputNode(): Tone.ToneAudioNode;
  getDuration(): number;
  getCurrentTime(): number;
  getBPM(): number;
}
```

**Migration Strategy**:
1. Create `DeckEngine` class with minimal interface
2. Move `loadTrack()` logic from `useAudioEngine` → `DeckEngine`
3. Move playback control (play/pause/stop/seek)
4. Test thoroughly with existing UI (no regressions)
5. Incrementally move EQ, filter, pitch logic
6. Add hot cue + loop system (new features)
7. Update `useAudioEngine` to be thin wrapper calling `DeckEngine` instances

---

#### 1.2 Extract MixerEngine Class (Week 2-3)
**New File**: `src/audio/engines/MixerEngine.ts`

**Responsibilities**:
- Crossfader routing (equal-power curves)
- Master EQ + filters
- Master FX chain (delay, reverb, extended effects)
- Master bus processing (compressor, limiter)
- Recording stream management
- Level metering (RMS/peak for all channels)

**Interface**:
```typescript
class MixerEngine {
  constructor(context: Tone.BaseContext);

  // Routing
  connectDeck(deckId: 'A' | 'B', deckOutput: Tone.ToneAudioNode): void;
  disconnectDeck(deckId: 'A' | 'B'): void;

  // Crossfader
  setCrossfade(position: number): void; // -1 (A) to 1 (B)
  setCrossfaderCurve(curve: 'linear' | 'power' | 'sharp'): void;

  // Master Chain
  setMasterVolume(value: number): void;
  setMasterEQ(eq: { low: number; mid: number; high: number }): void;

  // FX
  setFXParam(effect: string, param: string, value: number): void;
  toggleFX(effect: string, enabled: boolean): void;

  // Metering
  getMeterLevels(): { deckA: number; deckB: number; master: number };

  // Recording
  startRecording(): void;
  stopRecording(): Blob;
  getRecorderStream(): MediaStream | null;

  // Output
  getMasterOutput(): Tone.ToneAudioNode;
  dispose(): void;
}
```

**Migration Strategy**:
1. Create `MixerEngine` class
2. Move crossfader logic from `useAudioEngine` → `MixerEngine`
3. Move master bus chain (compressor, limiter, recorder)
4. Move FX routing (delay, reverb sends)
5. Add metering system (currently scattered)
6. Update `useAudioEngine` to orchestrate `DeckEngine` + `MixerEngine`

---

#### 1.3 Update useAudioEngine Hook (Week 3)
**Transform from**: 1473-line monolith
**Transform to**: ~300-line React bridge

**New Responsibilities**:
- Initialize `DeckEngine` instances (A/B) + `MixerEngine`
- Sync Zustand store ↔ engine state
- Handle React lifecycle (cleanup on unmount)
- Expose simplified API to components
- Performance monitoring (detect >16ms operations)

**Example Refactored Hook**:
```typescript
export const useAudioEngine = (): AudioEngineControls => {
  const deckARef = useRef<DeckEngine | null>(null);
  const deckBRef = useRef<DeckEngine | null>(null);
  const mixerRef = useRef<MixerEngine | null>(null);

  const init = useCallback(async () => {
    await Tone.start();
    const ctx = Tone.getContext();

    deckARef.current = new DeckEngine(ctx, 'A');
    deckBRef.current = new DeckEngine(ctx, 'B');
    mixerRef.current = new MixerEngine(ctx);

    mixerRef.current.connectDeck('A', deckARef.current.getOutputNode());
    mixerRef.current.connectDeck('B', deckBRef.current.getOutputNode());
  }, []);

  const loadTrack = useCallback(async (deck: 'A' | 'B', url: string, bpm: number) => {
    const engine = deck === 'A' ? deckARef.current : deckBRef.current;
    await engine?.loadTrack(url, bpm);
  }, []);

  // ... thin wrappers for all controls

  return {
    init,
    loadTrack,
    play: (deck) => (deck === 'A' ? deckARef : deckBRef).current?.play(),
    pause: (deck) => (deck === 'A' ? deckARef : deckBRef).current?.pause(),
    // ... etc
  };
};
```

---

#### 1.4 Performance Optimization (Week 4)
**Goal**: Achieve <16ms UI response time

**Actions**:
1. **Measure Current Performance**:
   - Add Performance API instrumentation to all controls
   - Identify bottlenecks (Framer Motion? 3D rendering? State updates?)
   - Create performance dashboard in dev mode

2. **Optimize State Updates**:
   - Replace Zustand subscriptions with refs where possible
   - Use `useEffect` with granular dependencies
   - Debounce high-frequency updates (playhead position, meters)

3. **Optimize Visual Rendering**:
   - Lazy-load 3D visualizers (Scene3D, FluidBackground)
   - Use `will-change` CSS for animated controls
   - Replace Framer Motion with CSS transitions for simple animations
   - Throttle WaveSurfer region updates

4. **Investigate AudioWorklet**:
   - Research Tone.js AudioWorklet support
   - Prototype sub-millisecond timing for quantization
   - Benchmark vs. current ScriptProcessorNode approach

**Success Criteria**:
- ✅ Control interactions <16ms (measured via Performance API)
- ✅ No audio glitches during UI updates
- ✅ Smooth 60fps waveform playhead tracking
- ✅ Crossfader feels hardware-like (no lag/stutter)

---

### **PHASE 2: Core Performance Features** (DJ Workflow)
**Goal**: Add professional DJ features using new engine architecture
**Timeline**: 4-5 weeks
**Complexity**: Medium (feature addition with existing groundwork)

#### 2.1 Quantization System (Week 5)
**Goal**: All actions snap to beat grid for tight mixes

**Components**:
1. **Beat Grid Engine** (already exists in `audioUtils.quantizeLoop`):
   - Expand to `quantizeTime(time: number, bpm: number, snapTo: 'beat' | 'bar' | '1/2' | '1/4')`
   - Visual beat markers on waveforms
   - Auto-detect downbeats (Phase 0 detection)

2. **Quantized Actions**:
   - Hot cue triggers snap to nearest beat
   - Loop in/out points snap to bar boundaries
   - Sync button phase-aligns to downbeat
   - Record start/stop quantized

3. **UI Indicators**:
   - Beat grid overlay on DeckWaveform
   - Visual countdown to next quantize point
   - "Q" indicator when quantize is active

**Implementation**:
- Leverage existing `quantizeLoop()` in `audioUtils.ts`
- Add `DeckEngine.quantizeAction(callback)` method
- Hook into existing `HotCue` and `LoopState` interfaces in `useStore.ts`

---

#### 2.2 Hot Cue System (Week 6)
**Goal**: 8 instant-access cue points per deck

**Features**:
- Set hot cue at current position (quantized to beat)
- Jump to hot cue (instant seek)
- Delete hot cue
- Color coding (8 colors)
- Labels (optional text)
- Visual markers on waveform
- Keyboard shortcuts (1-8 keys)

**UI Components**:
**New**: `src/components/studio/ui/HotCueGrid.tsx`
```tsx
<HotCueGrid deckId="A">
  {[1,2,3,4,5,6,7,8].map(slot => (
    <HotCueButton
      key={slot}
      slot={slot}
      cue={deck.hotCues[slot]}
      onSet={() => engine.setHotCue('A', slot, currentTime)}
      onJump={() => engine.jumpToHotCue('A', slot)}
      onClear={() => engine.clearHotCue('A', slot)}
    />
  ))}
</HotCueGrid>
```

**State** (already exists in `useStore.ts`):
```typescript
interface HotCue {
  slot: number;
  timeSec: number;
  label?: string;
  color?: string;
}
// DeckState already has: hotCues: HotCue[]
```

---

#### 2.3 Loop Controls (Week 7)
**Goal**: Beat-synchronized loop system

**Features**:
- Set loop in/out (auto-quantized to bars)
- 1-click loop lengths (1/2/4/8/16 bars)
- Loop enable/disable toggle
- Loop shift (move loop region)
- Loop double/halve (expand/shrink by 2x)
- Visual loop region on waveform

**UI Component**:
**Update**: `src/components/studio/ui/Deck.tsx`
```tsx
<LoopControls deckId="A">
  <Button onClick={() => engine.setLoopIn('A')}>IN</Button>
  <Button onClick={() => engine.setLoopOut('A')}>OUT</Button>
  <Toggle value={deck.loop.enabled} onChange={(v) => engine.enableLoop('A', v)}>LOOP</Toggle>
  <ButtonGroup>
    {[1, 2, 4, 8].map(bars => (
      <Button onClick={() => engine.setAutoLoop('A', bars)}>{bars}</Button>
    ))}
  </ButtonGroup>
</LoopControls>
```

**State** (already exists in `useStore.ts`):
```typescript
interface LoopState {
  enabled: boolean;
  startSec: number;
  endSec: number;
  quantized?: boolean;
}
// DeckState already has: loop: LoopState
```

---

#### 2.4 Sync Engine (Week 8)
**Goal**: One-button beatmatching with phase alignment

**Features**:
- Sync button: match BPM + phase-align to master
- Master deck selection (A or B sets tempo)
- Visual sync indicator
- Sync lock (maintain sync during pitch adjustments)

**Algorithm**:
1. Detect master BPM (from master deck or manual setting)
2. Adjust follower deck playbackRate to match BPM
3. Calculate phase offset (time difference to downbeat)
4. Apply phase correction (seek to align downbeats)
5. Lock phase (continuous micro-adjustments)

**Implementation**:
```typescript
// In DeckEngine
syncToMasterBPM(masterBPM: number, masterPhase: number) {
  const currentBPM = this.bpm;
  const targetRate = masterBPM / currentBPM;
  this.player.playbackRate = targetRate;

  // Phase align
  const currentPhase = this.getCurrentTime() % (60 / this.bpm * 4); // 4-beat bar
  const phaseDiff = masterPhase - currentPhase;
  if (Math.abs(phaseDiff) > 0.01) {
    this.seekTo(this.getCurrentTime() + phaseDiff);
  }
}
```

---

#### 2.5 Pitch + Key Lock (Week 9)
**Goal**: Tempo adjustment without pitch change (time stretching)

**Options**:
1. **Tone.js PitchShift** (already in codebase):
   - Pros: Already integrated, no new deps
   - Cons: CPU-heavy, quality limited

2. **soundtouchjs** library:
   - Pros: Better quality, real-time capable
   - Cons: New dependency, WASM integration

3. **Web Audio API native time stretching** (experimental):
   - Pros: Zero deps, browser-native
   - Cons: Limited browser support, quality varies

**Recommendation**: Start with Tone.js PitchShift (already exists in `useAudioEngine.ts`), add soundtouchjs as upgrade path

**UI**:
- "Key Lock" toggle button per deck
- Visual indicator when active
- Pitch range: ±50% (industry standard)

---

### **PHASE 3: UI/UX Transformation** (Polish)
**Goal**: Hardware-like feel, no-scroll desktop, mobile landscape mastery
**Timeline**: 3-4 weeks
**Complexity**: Medium (design + optimization)

#### 3.1 No-Scroll Desktop Layout (Week 10-11)
**Goal**: Everything visible in fixed viewport, no vertical scrolling

**Design Principles**:
- Fixed viewport height (100vh)
- Collapsible panels (EQ, FX, Library)
- Dockable windows (floating modals → docked panels)
- Workspace presets (Mixing, Recording, Performance)

**New Layout Component**:
**File**: `src/components/studio/layout/DesktopWorkspace.tsx`

**Structure**:
```
┌────────────────────────────────────────────┐
│ [Header: BPM | Meters | Mode Toggle]       │ 48px
├─────────┬────────┬──────────┬──────────────┤
│ DECK A  │ STRIP  │ CROSS-   │ STRIP │ DECK │
│         │ A      │ FADER    │ B     │ B    │
│ Wave    │ EQ     │          │ EQ    │ Wave │
│ Cues    │ Fader  │ [====o]  │ Fader │ Cues │
│ Loops   │ FX     │          │ FX    │ Loops│
│ [      ]│ [Send] │          │[Send] │[    ]│
├─────────┴────────┴──────────┴───────┴──────┤
│ [Library: Collapsible 48px/220px]          │
└────────────────────────────────────────────┘
```

**Features**:
- ✅ Library already has collapse state (`useStudioStore.libraryOpen`)
- 🆕 Add FX rack collapse (default: collapsed)
- 🆕 Add performance mode (hide library, maximize decks)
- 🆕 Add workspace presets (localStorage)

**Implementation**:
1. Audit current `StudioGrid.tsx` (5-column layout exists)
2. Add collapse toggles for FX, Library (already exists for Library)
3. Create workspace preset system:
   ```typescript
   type WorkspacePreset = 'mixing' | 'recording' | 'performance';
   const presets = {
     mixing: { library: 'open', fx: 'collapsed', waveformHeight: '180px' },
     recording: { library: 'collapsed', fx: 'open', waveformHeight: '120px' },
     performance: { library: 'collapsed', fx: 'collapsed', waveformHeight: '240px' },
   };
   ```

---

#### 3.2 Mobile Landscape Performance Mode (Week 11)
**Goal**: One-hand ergonomics, orientation-aware, performance-optimized

**Current State**: `MobileLandscapeWorkstation.tsx` exists (96px waveforms, 3-row grid)

**Enhancements Needed**:
1. **Orientation Lock Prompt**: Suggest landscape mode on mobile portrait detection
2. **Thumb-Zone Optimization**:
   - Crossfader bottom-center (natural thumb reach)
   - Play/pause buttons in corners (easy tap)
   - Hot cues in bottom row (8-button grid)
   - Waveforms top (visual reference)
3. **Simplified Controls**: Hide advanced features (stem toggles, detailed EQ)
4. **Haptic Feedback**: Vibration on cue triggers, sync lock
5. **Swipe Gestures**:
   - Swipe deck waveform left/right → beat jump
   - Pinch waveform → zoom
   - Two-finger tap → set hot cue

**New Component**:
**File**: `src/components/studio/layout/MobilePerformanceMode.tsx`

**Structure**:
```
┌──────────────────────────────────────┐
│ [Deck A Wave] │ [Deck B Wave]        │ 96px
├──────────────────────────────────────┤
│ [Hot Cue Grid: 1-8 buttons]          │ 64px
├──────────────────────────────────────┤
│ [A] [SYNC] [CROSSFADER] [SYNC] [B]   │ 80px
│ Play                        Play     │
└──────────────────────────────────────┘
```

**Implementation**:
1. Refactor `MobileLandscapeWorkstation.tsx` → add performance preset
2. Add gesture library (react-use-gesture or Framer Motion gestures)
3. Add haptic feedback API (`navigator.vibrate()`)
4. Test on physical devices (iPhone/Android in landscape)

---

#### 3.3 Hardware-Like Control Feel (Week 12)
**Goal**: Acceleration, snap points, dead zones for pro feel

**Targets**:
1. **Crossfader**:
   - Acceleration curve (fast motion → exponential movement)
   - Dead zones at -1, 0, 1 (snap to endpoints)
   - Visual "magnetic" snap animation

2. **EQ/Filter Knobs**:
   - Velocity-sensitive rotation (fast drag → big jumps)
   - Detent at center position (snap to 0dB)
   - Inertia on release (smooth settle)

3. **Pitch Fader**:
   - Fine control mode (Shift + drag → 0.1% steps)
   - Center detent (snap to 0% pitch)
   - Visual range markers (±8%, ±16%, ±50%)

**Implementation**:
**File**: `src/lib/controls/hardwarePhysics.ts`
```typescript
export function applyCrossfaderPhysics(
  rawValue: number,
  velocity: number,
  options: {
    deadZone: number;
    acceleration: number;
    snapThreshold: number;
  }
): number {
  let adjusted = rawValue;

  // Dead zones
  if (Math.abs(adjusted) < options.deadZone) adjusted = 0;
  if (adjusted > 1 - options.snapThreshold) adjusted = 1;
  if (adjusted < -1 + options.snapThreshold) adjusted = -1;

  // Acceleration (velocity-based exponential)
  if (Math.abs(velocity) > 0.5) {
    const sign = Math.sign(adjusted);
    adjusted = sign * Math.pow(Math.abs(adjusted), 1 - options.acceleration);
  }

  return adjusted;
}
```

**Update Components**:
- `Crossfader.tsx`: Apply physics to drag handler
- `DeckEQ.tsx`: Add detents, velocity sensing
- `PitchControl.tsx`: Add fine mode, center snap

---

#### 3.4 Extended FX Rack (Week 13)
**Goal**: 6-12 effects with routing options

**Current**: Delay, Reverb, TapeStop, Bitcrusher (4 effects)
**Target**: 12+ effects with pre/post routing

**New Effects**:
1. **Phaser** (psychedelic swirl)
2. **Flanger** (jet whoosh)
3. **Auto Filter** (wub-wub)
4. **Distortion** (grit/warmth)
5. **Gate** (stutter/chop)
6. **Tremolo** (volume pulse)
7. **Chorus** (stereo width)
8. **Frequency Shifter** (alien tones)

**Routing Options**:
- Per-deck FX sends (already exists)
- Pre-fader / Post-fader toggle
- FX chain order (drag-to-reorder)
- FX bypass (A/B comparison)

**UI Update**:
**File**: `src/components/studio/core/DeckFXRack.tsx` (already exists)

**Add**:
- FX selection dropdown (12 effects)
- Routing matrix (visual cable routing)
- Preset system (save/load FX chains)

---

### **PHASE 4: Advanced Features** (Optional/Future)
**Goal**: MIDI, keyboard mapping, sets/playlists
**Timeline**: 4-6 weeks
**Complexity**: Medium-High

#### 4.1 Keyboard Mapping System
- Customizable key bindings
- Visual on-screen display of active shortcuts
- Export/import keymaps

#### 4.2 MIDI Controller Support
- Web MIDI API integration
- Controller mapping UI (learn mode)
- Support for popular controllers (Pioneer DDJ, Traktor Kontrol)

#### 4.3 Saved Sets & History
- Record full mix sessions
- Save cue points, loops, FX settings
- Session history browser
- Export to project file (JSON)

---

## 🎯 Success Metrics

### Performance Targets
- [ ] **UI Response**: <16ms for all control interactions
- [ ] **Audio Latency**: <10ms total (engine + output)
- [ ] **Waveform FPS**: Locked 60fps playhead tracking
- [ ] **Memory**: <500MB total (2 loaded tracks + visuals)
- [ ] **CPU**: <30% on M1/M2 Mac, <50% on mid-range Intel

### Feature Parity (vs. djay Pro MVP)
- [ ] Dual decks with hot cues ✅ (8 per deck)
- [ ] Loop controls ✅ (quantized, auto-length)
- [ ] Sync engine ✅ (phase-aligned beatmatching)
- [ ] Key lock ✅ (time stretching)
- [ ] 3-band EQ ✅ (already implemented)
- [ ] Crossfader curves ✅ (already implemented)
- [ ] FX rack ✅ (6+ effects)
- [ ] BPM/key analysis ✅ (already implemented)
- [ ] Recording ✅ (already implemented)
- [ ] Mobile landscape mode ✅ (optimized for performance)

### User Experience
- [ ] **Desktop**: No scrolling required (everything in viewport)
- [ ] **Mobile**: One-hand operation in landscape
- [ ] **Tactile**: Hardware-like control feel (acceleration, detents)
- [ ] **Visual**: Beat-synced animations, clear feedback
- [ ] **Accessible**: Keyboard shortcuts for all actions

---

## 🚧 Implementation Checklist

### Phase 1: Architecture (Weeks 1-4)
- [ ] 1.1 Create `DeckEngine` class (`src/audio/engines/DeckEngine.ts`)
  - [ ] Basic interface (load, play, pause, seek)
  - [ ] Move playback logic from `useAudioEngine`
  - [ ] Add hot cue system (8 slots)
  - [ ] Add loop system (quantized)
  - [ ] Add sync logic
  - [ ] Test with existing UI (no regressions)

- [ ] 1.2 Create `MixerEngine` class (`src/audio/engines/MixerEngine.ts`)
  - [ ] Crossfader routing
  - [ ] Master bus chain
  - [ ] FX routing
  - [ ] Metering system
  - [ ] Recording stream

- [ ] 1.3 Refactor `useAudioEngine` hook
  - [ ] Reduce to ~300 lines (thin bridge)
  - [ ] Orchestrate DeckEngine + MixerEngine
  - [ ] Sync with Zustand store
  - [ ] Add performance monitoring

- [ ] 1.4 Performance optimization
  - [ ] Measure control response times
  - [ ] Optimize state updates (refs vs subscriptions)
  - [ ] Lazy-load 3D visuals
  - [ ] Replace Framer Motion where possible
  - [ ] Investigate AudioWorklet

### Phase 2: Features (Weeks 5-9)
- [ ] 2.1 Quantization system
  - [ ] Expand `quantizeLoop()` to `quantizeTime()`
  - [ ] Beat grid overlay on waveforms
  - [ ] Quantize UI indicators

- [ ] 2.2 Hot cue system
  - [ ] Create `HotCueGrid.tsx` component
  - [ ] Waveform markers
  - [ ] Keyboard shortcuts (1-8 keys)

- [ ] 2.3 Loop controls
  - [ ] Update `Deck.tsx` with loop buttons
  - [ ] Auto-loop lengths (1/2/4/8 bars)
  - [ ] Loop shift/double/halve

- [ ] 2.4 Sync engine
  - [ ] Implement BPM matching algorithm
  - [ ] Implement phase alignment
  - [ ] Add sync lock mode
  - [ ] Visual sync indicator

- [ ] 2.5 Pitch + key lock
  - [ ] Test Tone.js PitchShift performance
  - [ ] Add "Key Lock" toggle UI
  - [ ] Benchmark vs soundtouchjs

### Phase 3: UI/UX (Weeks 10-13)
- [ ] 3.1 No-scroll desktop layout
  - [ ] Add FX rack collapse toggle
  - [ ] Create workspace presets (mixing/recording/performance)
  - [ ] Test at 1080p, 1440p, 4K

- [ ] 3.2 Mobile landscape performance mode
  - [ ] Refactor `MobileLandscapeWorkstation.tsx`
  - [ ] Add gesture controls (swipe beat jump, pinch zoom)
  - [ ] Add haptic feedback
  - [ ] Test on physical devices

- [ ] 3.3 Hardware-like control feel
  - [ ] Create `hardwarePhysics.ts` utilities
  - [ ] Apply to Crossfader (dead zones, acceleration)
  - [ ] Apply to EQ knobs (detents, velocity)
  - [ ] Apply to pitch fader (fine mode, snap)

- [ ] 3.4 Extended FX rack
  - [ ] Add 8 new effects (Phaser, Flanger, etc.)
  - [ ] Add FX routing matrix
  - [ ] Add FX preset system

---

## 🔍 Technical Decision Points

### 1. AudioWorklet vs. ScriptProcessorNode
**Current**: Tone.js uses ScriptProcessorNode (deprecated)
**Option A**: Stay with current (works, but >16ms possible)
**Option B**: Migrate to AudioWorklet (sub-ms timing, future-proof)
**Recommendation**: Prototype in Phase 1.4, decide based on benchmarks

### 2. Time Stretching Library
**Current**: Tone.js PitchShift (CPU-heavy, quality limited)
**Option A**: Keep Tone.js (zero new deps)
**Option B**: soundtouchjs (better quality, WASM)
**Option C**: Browser-native (experimental, inconsistent)
**Recommendation**: Start with A, upgrade to B if quality complaints

### 3. 3D Visuals Performance
**Current**: React Three Fiber (heavy, potential 16ms blocker)
**Option A**: Lazy load (only render when visible)
**Option B**: Simplify scene (reduce polygons/shaders)
**Option C**: Remove 3D entirely (focus on performance)
**Recommendation**: A + B, keep 3D as optional enhancement

### 4. Mobile Gesture Library
**Current**: Framer Motion gestures (integrated)
**Option A**: Continue with Framer Motion
**Option B**: react-use-gesture (lighter, more control)
**Recommendation**: B (lighter, better for <16ms target)

### 5. MIDI Support Priority
**Option A**: Phase 2 (essential for pros)
**Option B**: Phase 4 (nice-to-have)
**Recommendation**: B (focus on core DJ features first)

---

## 📚 Existing Code Reuse Opportunities

### Already Implemented (Don't Rebuild!)
✅ **Quantization groundwork**: `audioUtils.quantizeLoop()` exists
✅ **Hot cue state**: `HotCue` interface in `useStore.ts`
✅ **Loop state**: `LoopState` interface in `useStore.ts`
✅ **Mobile layouts**: `MobileLandscapeWorkstation.tsx`, `MobilePortraitPocketStudio.tsx`
✅ **BPM analysis**: `essentia.worker.ts` (BPM/key detection)
✅ **Crossfader curves**: `applyCrossfaderCurve()` in `crossfaderCurves.ts`
✅ **Stem separation**: Stem player architecture in `useAudioEngine.ts`
✅ **Recording**: Recorder stream in `useAudioEngine.ts`

### Can Be Repurposed
🔄 **AudioBufferManager** (`src/lib/audio-engine.ts`): Move to `DeckEngine` for track caching
🔄 **Scheduler** (`src/lib/audio-engine.ts`): Use for quantization timing
🔄 **DeckFXChain** (`src/lib/deck-fx-chain.ts`): Integrate into `DeckEngine`
🔄 **Engine.ts** (`src/audio/Engine.ts`): Merge singleton pattern into new architecture

### Should Be Archived (Duplicates/Unused)
❌ **`src/lib/audio-engine.ts`**: Unused scheduler (superseded by Tone.js Transport)
❌ **`src/audio/Engine.ts`**: Minimal singleton (merge into `DeckEngine`)
❌ **Multiple AudioEngine references**: Consolidate to single pattern

---

## 🚀 Quick Wins (Can Implement Immediately)

### High Impact / Low Effort
1. **Add Hot Cue Buttons** (2 days):
   - State already exists in `useStore.ts`
   - Just need UI component + keyboard shortcuts

2. **Beat Grid Overlay** (1 day):
   - Use existing `BeatGrid.tsx` component
   - Overlay on `DeckWaveform.tsx`

3. **Library Collapse Persistence** (1 hour):
   - Save `libraryOpen` state to localStorage
   - Already has toggle logic

4. **Crossfader Dead Zones** (4 hours):
   - Add physics function to `Crossfader.tsx`
   - Snap to -1, 0, 1 endpoints

5. **Performance Dashboard** (1 day):
   - Add Performance API logging
   - Show control response times in dev mode

---

## 📝 Next Steps

### Immediate Actions (This Week)
1. **Review & Approve Roadmap**: Get stakeholder/team sign-off on 3-phase plan
2. **Create Phase 1 Tasks**: Break down DeckEngine extraction into Jira/Linear/GitHub Issues
3. **Set Up Performance Baseline**: Measure current UI response times (before optimization)
4. **Quick Win #1**: Implement hot cue buttons (prove concept, build momentum)

### Coordination Needs
- **Design**: Create mockups for no-scroll desktop layout + mobile performance mode
- **Testing**: Set up physical mobile device testing (iPhone/Android landscape)
- **Stakeholders**: Demo current MVP, align on feature priorities

---

## 📞 Questions for Stakeholders

1. **Timeline Flexibility**: Can we extend timeline if quality/performance demands it?
2. **MIDI Priority**: Is MIDI controller support Phase 2 or Phase 4?
3. **3D Visuals**: Keep/simplify/remove based on performance impact?
4. **Mobile Focus**: Is landscape performance mode higher priority than desktop polish?
5. **Feature Scope**: Any additional "must-have" features not listed?

---

## 🎉 Expected Outcomes

After completing all 3 phases:

### Technical Excellence
- ✅ Engine-first architecture (testable, maintainable, scalable)
- ✅ <16ms UI response time (hardware-like feel)
- ✅ Sub-10ms audio latency (tight beatmatching)
- ✅ 60fps waveform rendering (smooth visual feedback)
- ✅ Production-ready code (no hacks, proper separation of concerns)

### Feature Completeness
- ✅ 8 hot cues per deck (instant access points)
- ✅ Quantized loops (1/2/4/8 bar auto-length)
- ✅ One-button sync (BPM + phase alignment)
- ✅ Key lock (pitch-independent tempo)
- ✅ 12+ FX effects (professional sound design)
- ✅ Beat-synced visuals (animations locked to music)

### User Experience
- ✅ Desktop: No scrolling, everything visible
- ✅ Mobile: One-hand landscape performance mode
- ✅ Tactile: Hardware-like control feel
- ✅ Accessible: Full keyboard navigation
- ✅ Professional: Rivals djay Pro, Serato, Traktor

### Competitive Positioning
**Piko Studio** will be a **top-tier 2026 DJ software** with:
- Modern web tech (no desktop app required)
- Cross-platform (desktop + mobile web)
- Zero installation (browser-based)
- Open architecture (extensible via API)
- Free/freemium model (vs. $50-200 competitors)

---

**Ready to proceed?** Approve this roadmap and we'll start with Phase 1.1: DeckEngine extraction. 🚀
