# DJ Mixer Module - Phase 2 Implementation

## Overview

The DJ Mixer Module is a complete React component that integrates advanced DSP features and audio graph topology for professional DJ mixing. It provides a full-featured dual-deck mixer with beat detection, harmonic mixing, and precision playback controls.

## Architecture

### Audio Graph Topology

Each deck follows this signal flow:

```
AudioBufferSourceNode → EQ Chain → GainNode → MixerWorklet → Output
                         ↓
                   Low-Shelf (200Hz)
                         ↓
                   Peaking (1kHz, Q=1.0)
                         ↓
                   High-Shelf (2.5kHz)
```

**Key Features:**

- **AudioBufferSourceNode**: Enables instant cueing and pitch control
- **3-Band EQ**: Low-Shelf, Peaking (Mid), High-Shelf
- **Kill Switches**: Each EQ band can drop to -∞ dB (effectively -100 dB)
- **GainNode**: Per-deck volume control
- **Crossfader**: Equal-power mixing between decks

### DSP Features

#### 1. Precision Playback & Pitch Control

- **Tempo Control**: Adjust playback rate from 0.8x to 1.2x (±20%)
- **Sample-Accurate**: Uses AudioContext.currentTime for precise scheduling
- **Pitch Lock**: Placeholder for future WASM time-stretching (phase vocoder)

```typescript
// Adjust tempo by changing playback rate
engine.setPlaybackRate("A", 1.1); // +10% faster

// Future: Pitch lock will use time-stretching
// const stretched = await pitchLock.applyTimeStretch(audioBuffer, 1.1);
```

#### 2. Crossfader & Equal-Power Mixing

The crossfader implements multiple curve types to prevent volume dips:

- **Constant-Power (default)**: `gainA = cos(x * π/2)`, `gainB = sin(x * π/2)`
- **Linear**: Simple fade (may dip at center)
- **Sharp**: Aggressive DJ-style cut
- **Smooth**: Extra gradual transition

```typescript
// Constant-power formula ensures total power remains constant
const gainA = Math.cos((position * Math.PI) / 2);
const gainB = Math.sin((position * Math.PI) / 2);
// At position 0.5: both = 0.707 (equal power, no dip)
```

#### 3. Beat Detection & Sync Engine

**BPM Detection:**

- Spectral flux analysis for tempo detection
- Metadata extraction fallback
- Confidence scoring

**Beat Sync:**

- PLL (Phase-Locked Loop) for tempo and phase matching
- PI controller with configurable parameters
- Beat-boundary nudging for large phase errors
- Prevents warble with bounded corrections and EMA smoothing

```typescript
// Enable sync: Deck B follows Deck A
engine.setSyncEnabled("B", true, "A", "tempo+phase");

// PLL continuously adjusts Deck B's rate to match A's tempo and phase
```

#### 4. Dynamic Harmonic Mixing

**Key Detection:**

- Musical key analysis using Essentia.js (via KeyService)
- Camelot notation display (e.g., "8A", "5B")
- Compatible key highlighting

**Camelot Wheel Rules:**

1. Same number (8A ↔ 8B)
2. Adjacent numbers (8A ↔ 7A, 8A ↔ 9A)
3. Cross-compatibility (8A ↔ 7B, 8A ↔ 9B)

```typescript
// Check if two keys are compatible
const compatible = areKeysCompatible("8A", "8B"); // true

// Get all compatible keys
const compatibles = compatibleKeys("8A"); // ["8B", "7A", "9A", "7B", "9B"]
```

## Component API

### Props

```typescript
interface DJMixerModuleProps {
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
  onSyncEnable?: (slaveDeck: "A" | "B", masterDeck: "A" | "B") => void;
  onSyncDisable?: () => void;

  // Cue callbacks
  onDeckACue?: () => void;
  onDeckBCue?: () => void;

  // UI options
  showKeyDisplay?: boolean;
  showBeatGrid?: boolean;
  enableHaptics?: boolean;
  pitchLockEnabled?: boolean;
}

interface DeckTrack {
  url: string;
  title: string;
  artist: string;
  audioBuffer?: AudioBuffer | null;
}
```

### Usage Example

```tsx
import { DJMixerModule } from "@/components/DJMixerModule";

function MyDJApp() {
  const [deckATrack, setDeckATrack] = useState<DeckTrack>({
    url: "/audio/track1.mp3",
    title: "Track 1",
    artist: "Artist 1",
    audioBuffer: null, // Load separately
  });

  return (
    <DJMixerModule
      deckATrack={deckATrack}
      deckBTrack={deckBTrack}
      onDeckAPlay={() => console.log("Deck A playing")}
      onSyncEnable={(slave, master) =>
        console.log(`Syncing ${slave} to ${master}`)
      }
      showKeyDisplay={true}
      showBeatGrid={true}
    />
  );
}
```

## CSS & Touch Optimization

The component applies:

```css
.dj-mixer-module {
  overscroll-behavior: none; /* Prevent page scroll on gesture overshoot */
  touch-action: none; /* Disable browser touch gestures */
}
```

This ensures that:

- Fader gestures don't trigger page scroll
- Touch interactions are smooth and predictable
- Mobile devices handle multi-touch properly

## Physics-Based UI Components

### Faders (Volume/Channel)

- **Elastic Boundaries**: Visual stretching at 0% and 100% limits
- **Spring Physics**: Smooth snap-back using react-spring
- **Touch-Optimized**: Larger hit targets on mobile

### Crossfader

- **Inertial Movement**: Flick gestures with momentum
- **Multiple Curves**: Linear, constant-power, sharp, smooth
- **Center Detent**: Visual marker at 50% position

### Knobs (EQ Controls)

- **Rotational Gesture**: Drag to rotate
- **Color-Coded**: Red (High), Green (Mid), Blue (Low)
- **Range**: ±12 dB with center detent at 0 dB

## Technical Implementation Details

### Audio Engine Integration

The component uses the **StudioEngine** singleton:

```typescript
const engine = getStudioEngine();
await engine.initialize();

// Load tracks
await engine.loadTrack("A", trackUrl);

// Control playback
engine.play("A");
engine.setPlaybackRate("A", 1.05);
engine.setEQ("A", "high", -6); // -6 dB high cut
engine.setGain("A", 0.8); // 80% volume
```

### Beat Grid Analysis

Beat grids are analyzed using **BeatGridService**:

```typescript
const { analyze } = useBeatGrid();
const beatGrid = await analyze(audioBuffer, cacheKey);

// beatGrid contains:
// - bpm: number
// - beatTimestamps: number[] (in seconds)
// - downbeatTimestamp: number
// - confidence: number
```

### Sync Controller (PLL)

The sync controller uses a PI (Proportional-Integral) algorithm:

```typescript
// PLL parameters
Kp = 0.1; // Proportional gain
Ki = 0.01; // Integral gain
maxRateDelta = 0.08; // ±8% max deviation
smoothing = 0.95; // EMA smoothing

// Calculate correction
correction = Kp * phaseError + Ki * integral;
correctedRate = baseRate + correction;
smoothedRate = smoothing * oldRate + (1 - smoothing) * correctedRate;
```

## Future Enhancements

### Pitch Lock (Time-Stretching)

Currently a placeholder. Future implementation will use WASM:

```typescript
// Future: Integrate Rubber Band or Sonic library
import { RubberBand } from "rubberband-wasm";

const rubberband = await RubberBand.create(sampleRate);
rubberband.setTimeRatio(1.1); // 10% faster
rubberband.setPitchScale(1.0); // Keep pitch unchanged
const stretched = await rubberband.process(audioBuffer);
```

### Advanced Features

- **Loop Points**: Set and trigger loop regions
- **Hot Cues**: Save and recall cue points
- **FX Chain**: Effects like reverb, delay, filter
- **Waveform Display**: Visual representation of audio
- **Auto-Sync**: Automatic BPM matching on load
- **Record Mix**: Export mixed audio to file

## File Structure

```
src/
├── components/
│   ├── DJMixerModule.tsx           # Main component
│   ├── DJMixerModuleExample.tsx    # Usage example
│   └── dj-ui/
│       ├── Crossfader.tsx          # Crossfader control
│       ├── Fader.tsx               # Volume fader
│       └── Knob.tsx                # Rotary knob
├── engine/
│   └── rt/
│       ├── StudioEngine.ts         # High-level audio engine
│       ├── DeckGraph.ts            # Per-deck audio graph
│       └── sync/
│           └── SyncController.ts   # PLL sync controller
├── hooks/
│   ├── useBPMDetection.ts          # BPM detection hook
│   ├── useBeatGrid.ts              # Beat grid analysis hook
│   ├── useTrackKey.ts              # Key detection hook
│   └── usePitchLock.ts             # Pitch lock placeholder
└── utils/
    ├── constantPowerSplitter.ts    # Crossfader math
    ├── camelot.ts                  # Camelot wheel mapping
    └── bpmDetection.ts             # BPM detection algorithm
```

## Performance Considerations

1. **AudioWorklet**: All audio processing runs in dedicated thread
2. **Sample-Accurate**: Scheduling uses AudioContext.currentTime
3. **No Node Recreation**: Nodes persist, only sources are recreated
4. **Efficient Updates**: React hooks minimize re-renders
5. **Debounced Sync**: PLL runs at controlled intervals (not every frame)

## Testing

```bash
# Build the project
npm run build

# Run in development
npm run dev

# Navigate to example page
# Use DJMixerModuleExample component
```

## References

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [Camelot Wheel](https://mixedinkey.com/harmonic-mixing-guide/)
- [Phase Vocoder](https://en.wikipedia.org/wiki/Phase_vocoder)
- [PLL (Phase-Locked Loop)](https://en.wikipedia.org/wiki/Phase-locked_loop)

## License

Part of the piko-artist-website-v3 project.
