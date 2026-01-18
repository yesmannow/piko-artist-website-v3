# DJ Mixer Upgrade Plan

## Current Architecture

### Main Components

1. **`src/components/DJInterface.tsx`** (1620 lines)
   - **Responsibilities**:
     - Main orchestrator component
     - Manages all deck state (A & B)
     - Creates and manages AudioContext
     - Sets up WebAudio node graph
     - Handles track loading, drag & drop
     - Manages FX state for both decks
   - **State Management**: React `useState` (not Zustand)
   - **Audio Engine**:
     - Creates AudioContext on mount
     - Master gain node → analyser → destination
     - Deck A/B gain nodes with equal-power crossfading
     - EQ filters (high/mid/low) per deck
     - FX chains per deck (filter, reverb, delay, distortion)
   - **Key Refs**:
     - `audioContextRef` - Main AudioContext
     - `masterGainRef` - Master output gain
     - `deckAGainRef`, `deckBGainRef` - Deck volume controls
     - `deckAFiltersRef`, `deckBFiltersRef` - EQ filters
     - `fxFilterARef`, `fxReverbARef`, `fxDelayARef`, etc. - FX nodes

2. **`src/components/DJDeck.tsx`** (594 lines)
   - **Responsibilities**:
     - Individual deck UI and controls
     - WaveSurfer integration for waveform visualization
     - Playback control (play/pause, seek, speed)
     - Jog wheel, performance pads, loop controls
     - Connects to WebAudio via MediaElementSourceNode
   - **Current Features**:
     - Basic cue point (single)
     - Loop controls (4/8/16 beats)
     - Performance pads (4 pads, but only pad 0 used)
   - **Output**: Connects to deck filter chain (low filter input)

3. **`src/components/DJMixer.tsx`** (312 lines)
   - **Responsibilities**:
     - Mixer UI (volume faders, EQ knobs, crossfader)
     - Spectrum analyzer visualization
   - **Controls**: Volume, High/Mid/Low EQ, Kill switches, Crossfader

4. **`src/components/FXUnit.tsx`** (188 lines)
   - **Responsibilities**:
     - FX rack UI (filter, reverb, delay, distortion)
     - Active deck toggle (A/B)
     - Clear All button
   - **FX Types**: Filter (LP/HP/BP), Reverb, Delay, Distortion

5. **`src/components/dj-ui/PerformancePads.tsx`** (118 lines)
   - **Responsibilities**:
     - 4 performance pads UI
     - Handles cue set/jump/clear
   - **Current Limitation**: Only 4 pads, only pad 0 is used in DJDeck

### Audio Node Graph

```
Deck A:
  MediaElementSource → deckAFiltersRef.low → deckAFiltersRef.mid → deckAFiltersRef.high → deckAGainRef
  → preFxGainA → fxDistortionA → fxFilterA → [Dry → masterGain] + [Delay → masterGain] + [Reverb → masterGain]

Deck B:
  MediaElementSource → deckBFiltersRef.low → deckBFiltersRef.mid → deckBFiltersRef.high → deckBGainRef
  → preFxGainB → fxDistortionB → fxFilterB → [Dry → masterGain] + [Delay → masterGain] + [Reverb → masterGain]

Master:
  masterGain → analyser → destination
```

### State Management Pattern

- **Not using Zustand** for DJ mixer (despite project having Zustand)
- All state in `DJInterface.tsx` using React `useState`
- Deck-specific state stored separately (deckA*, deckB*)
- FX state stored separately per deck

## Feature Implementation Plan

### Feature 1: Mix Recording (Local Export)

**Location**: `src/components/DJInterface.tsx`

**Implementation**:
- Add MediaRecorder to capture master output
- Create recording node: `masterGain → MediaStreamDestination`
- Add UI section in DJMixer or separate component
- State: `isRecording`, `recorderRef`, `recordedChunksRef`
- Controls: Record button, Stop button, Download button
- Format: `audio/webm` (MediaRecorder default)
- Cleanup: Stop recorder on unmount/route change, revoke object URLs

**Risks**:
- MediaRecorder may not be supported in all browsers (Safari)
- Need to handle audio context state (suspended/resumed)
- Memory: Large recordings could consume memory

**Files to Modify**:
- `src/components/DJInterface.tsx` - Add recording logic
- `src/components/DJMixer.tsx` - Add recording UI section

### Feature 2: Hot Cues (8 per deck)

**Location**: `src/components/DJDeck.tsx` and `src/components/dj-ui/PerformancePads.tsx`

**Implementation**:
- Extend PerformancePads from 4 to 8 pads
- Store cues in deck state (useState in DJDeck or pass from parent)
- Cue operations:
  - Set: Click empty pad at current position
  - Jump: Click set pad to seek
  - Clear: Long press (mobile) or Shift+Click (desktop)
- State: `hotCues: Record<number, number>` (padIndex → time in seconds)
- Ensure click-safe: Debounce rapid clicks, prevent re-render storms

**Risks**:
- Rapid cue triggering could cause audio glitches
- Need to handle seek while playing
- Mobile long-press detection

**Files to Modify**:
- `src/components/dj-ui/PerformancePads.tsx` - Extend to 8 pads, add long-press
- `src/components/DJDeck.tsx` - Update cue handlers, store 8 cues

### Feature 3: Looping (Enhanced)

**Location**: `src/components/DJDeck.tsx`

**Current State**: Basic loop exists (4/8/16 beats), but needs enhancement

**Implementation**:
- Add loop in/out markers
- Selectable loop lengths: 2/4/8/16 beats (or fallback seconds if BPM unknown)
- Loop on/off toggle
- Visual feedback on waveform
- Ensure smooth transitions when toggling loop
- Use WaveSurfer's `on('finish')` or interval check for loop detection

**Risks**:
- Rapid loop toggles could cause audio glitches
- Need to handle BPM detection (or use fallback time-based)
- Loop boundaries must be precise

**Files to Modify**:
- `src/components/DJDeck.tsx` - Enhance loop logic

### Feature 4: FX Rack (Enhancement)

**Location**: `src/components/DJInterface.tsx` and `src/components/FXUnit.tsx`

**Current State**: FX rack exists with filter, reverb, delay, distortion

**Enhancement Needed**:
- Filter: Already has LP/HP/BP (good)
- Echo/Delay: Already exists (time + feedback) - verify it's working correctly
- Reverb: Already exists (amount) - verify it's working correctly
- **NEW**: Master limiter/soft clipper to prevent clipping
  - Add DynamicsCompressorNode or WaveShaperNode after masterGain
  - Connect: `masterGain → limiter → analyser → destination`

**Implementation**:
- Add master limiter node in DJInterface initialization
- Add limiter threshold control in DJMixer or FXUnit
- Ensure FX nodes are disabled when amount = 0 (CPU optimization)

**Risks**:
- Limiter could affect sound quality if too aggressive
- Need to balance CPU usage vs. audio quality

**Files to Modify**:
- `src/components/DJInterface.tsx` - Add master limiter node
- `src/components/DJMixer.tsx` or `src/components/FXUnit.tsx` - Add limiter control

### Feature 5: Mobile Strategy (DJ Lite Mode)

**Location**: `src/components/DJInterface.tsx`, `src/components/DJDeck.tsx`, `src/components/DJMixer.tsx`

**Implementation**:
- Detect screen size (use existing `isMounted` pattern)
- On small screens (< 768px):
  - Render "DJ Lite" controls:
    - Crossfader (essential)
    - Play/Cue buttons (essential)
    - Filter knob (most used FX)
    - 4 hot cues (reduced from 8)
    - Loop toggle (simplified)
  - Hide/condense:
    - Full EQ knobs → simplified EQ
    - Full FX rack → filter only
    - Performance pads → 4 instead of 8
    - Detailed waveform → simplified
- Ensure touch targets >= 44px (already using `min-h-[44px]` in many places)

**Risks**:
- Feature parity between desktop and mobile
- Touch interactions (long-press, multi-touch)
- Performance on mobile devices

**Files to Modify**:
- `src/components/DJInterface.tsx` - Add responsive mode detection
- `src/components/DJDeck.tsx` - Conditional rendering for mobile
- `src/components/DJMixer.tsx` - Simplified mobile layout
- `src/components/FXUnit.tsx` - Mobile-friendly layout

## Risks & Considerations

### SSR (Server-Side Rendering)
- **Risk**: AudioContext, MediaRecorder, WebAudio APIs are browser-only
- **Mitigation**: All audio code is in `"use client"` components, wrapped in `useEffect` with proper checks

### Mobile Performance
- **Risk**: WebAudio processing, multiple FX nodes, recording could be CPU-intensive
- **Mitigation**:
  - Disable FX nodes when amount = 0
  - Use efficient audio processing
  - Limit recording duration
  - Mobile mode reduces active features

### Memory Leaks
- **Risk**: MediaRecorder chunks, object URLs, audio nodes not cleaned up
- **Mitigation**:
  - Proper cleanup in useEffect return functions
  - Revoke object URLs after download
  - Disconnect audio nodes on unmount
  - Stop MediaRecorder on route change

### Browser Compatibility
- **Risk**: MediaRecorder support varies (Safari, older browsers)
- **Mitigation**: Feature detection, fallback messaging

### Audio Glitches
- **Risk**: Rapid cue jumps, loop toggles could cause clicks/pops
- **Mitigation**:
  - Smooth seek operations
  - Proper timing for loop boundaries
  - Debounce rapid interactions

## Testing Checklist

- [ ] `npm run build` passes
- [ ] No console errors navigating between pages
- [ ] Recording downloads and plays back correctly
- [ ] Hot cues work on both desktop and mobile
- [ ] Loops work correctly without breaking playback
- [ ] FX rack works per deck independently
- [ ] Master limiter prevents clipping
- [ ] Mobile DJ Lite mode renders correctly
- [ ] Touch targets are >= 44px
- [ ] No memory leaks (check DevTools Memory profiler)
- [ ] Cleanup on route change works
- [ ] Audio context resumes correctly after suspend

## File Summary

**Files to Create**:
- None (extend existing components)

**Files to Modify**:
1. `src/components/DJInterface.tsx` - Recording, limiter, mobile detection
2. `src/components/DJDeck.tsx` - Hot cues (8), enhanced loops
3. `src/components/DJMixer.tsx` - Recording UI, limiter control
4. `src/components/dj-ui/PerformancePads.tsx` - Extend to 8 pads, long-press
5. `src/components/FXUnit.tsx` - Mobile layout (optional)

**Files to Remove**:
- Check for unused imports/components after implementation
- Remove any old loop/cue code if replaced

