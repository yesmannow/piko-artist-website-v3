# Audio Engine Core - Usage Guide

## Overview

The Audio Engine Core (Phase IV) provides a professional-grade browser-based audio mixing environment using Tone.js and Zustand. This implementation follows the "Top-Level" DAW architecture with low latency (<10ms), high fidelity, and 60fps visualization support.

## Architecture Components

### 1. State Management - `src/store/useStore.ts`

The Zustand store manages the application's reactive state:

```typescript
import { useStore } from '@/store/useStore';

function MixerComponent() {
  const { masterBpm, crossfader, deckA, deckB, setMasterBpm, setCrossfader } = useStore();
  
  // Update master BPM
  const handleBpmChange = (newBpm: number) => {
    setMasterBpm(newBpm);
  };
  
  // Update crossfader position
  const handleCrossfaderChange = (value: number) => {
    // Value range: -1 (Deck A) to 1 (Deck B)
    setCrossfader(value);
  };
}
```

#### State Structure

- **Master State**: `masterBpm`, `crossfader` (-1 to 1), `isAudioReady`
- **Deck State** (A & B): `trackData`, `isPlaying`, `volume`, `playbackRate`, `eq`, `filter`

#### Actions

- `setAudioReady(status: boolean)` - Update audio context ready state
- `setMasterBpm(bpm: number)` - Set the global tempo
- `setCrossfader(value: number)` - Set crossfader position (-1 to 1)
- `setDeckTrack(deck, trackData)` - Load track metadata
- `setDeckVolume(deck, volume)` - Set deck volume (0 to 1)
- `setDeckEQ(deck, eq)` - Set 3-band EQ (low, mid, high in dB)
- `setDeckFilter(deck, frequency)` - Set filter cutoff frequency
- `togglePlay(deck)` - Toggle play/pause state

### 2. Audio Engine - `src/hooks/useAudioEngine.ts`

The audio engine hook manages the Tone.js signal graph and provides control functions.

```typescript
import { useAudioEngine } from '@/hooks/useAudioEngine';

function DJStudio() {
  const { initAudio, loadTrack, play, pause, stop, syncToBpm } = useAudioEngine();
  
  // Initialize audio context (REQUIRED: must be called from user interaction)
  const handleInitialize = async () => {
    await initAudio();
  };
  
  // Load a track from Cloudflare R2
  const handleLoadTrack = async () => {
    await loadTrack('A', 'https://r2.example.com/track.mp3', 128);
  };
  
  // Control playback
  const handlePlay = () => play('A');
  const handlePause = () => pause('A');
  const handleStop = () => stop('A');
  
  return (
    <div>
      <button onClick={handleInitialize}>Start Audio Engine</button>
      <button onClick={handleLoadTrack}>Load Track</button>
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
    </div>
  );
}
```

## Key Features

### 1. Equal Power Crossfading

The crossfader uses an equal power curve to maintain constant perceived loudness:

- **Linear Fade**: Volume dips at midpoint (-3dB drop)
- **Equal Power Fade**: Constant volume throughout transition
- **Implementation**: Tone.CrossFade with trigonometric curve (cos/sin)

```
G_A = cos(fade × π/2)
G_B = sin(fade × π/2)
Where: G_A² + G_B² = 1 (constant power)
```

### 2. BPM Synchronization

Automatic tempo matching across decks:

```
PlaybackRate = MasterBPM / TrackBPM

Example:
- Master BPM: 128
- Track BPM: 120
- Playback Rate: 128/120 = 1.0667 (106.7% speed)
```

### 3. Signal Graph Topology

```
Player (R2 Audio)
  ↓
EQ3 (3-band isolator)
  ↓
Filter (Low/High Pass)
  ↓
Channel (Volume/Pan)
  ↓
CrossFade ← Both Decks
  ↓
Compressor (Mix Glue)
  ↓
Limiter (Output Safety)
  ↓
Meter (Visualization Data)
  ↓
Destination (Speakers)
```

### 4. Mobile Browser Support

The implementation handles mobile browser autoplay policies:

```typescript
// Context starts in 'suspended' state on mobile
await initAudio(); // Call from user interaction (click/touch)

// Check audio readiness
const { isAudioReady } = useStore();
if (!isAudioReady) {
  // Show "Tap to Start" overlay
}
```

### 5. CORS Configuration for R2

Tracks loaded from Cloudflare R2 are configured with CORS support:

```typescript
player.crossOrigin = "anonymous";
```

This enables:
- Analyzer nodes for visualization
- Waveform rendering
- VU meters

**R2 Bucket Requirements**: Ensure your R2 bucket has CORS headers configured:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```

### 6. High-Performance UI Updates

The engine uses a **Transient Update Pattern** to achieve 60fps without re-render thrashing:

- **Reactive State**: Track metadata, play status → Zustand store
- **Transient State**: Meter levels, playhead position → Direct refs/requestAnimationFrame

```typescript
// ❌ BAD: Causes 60 re-renders per second
useState(meterLevel);

// ✅ GOOD: Direct DOM/canvas updates via requestAnimationFrame
const loop = () => {
  const level = masterMeter.getValue();
  // Update canvas/WebGL directly without React
  animationFrameId = requestAnimationFrame(loop);
};
```

## Integration Examples

### Example 1: Complete DJ Mixer Component

```typescript
import { useStore } from '@/store/useStore';
import { useAudioEngine } from '@/hooks/useAudioEngine';

export default function DJMixer() {
  const { 
    masterBpm, 
    crossfader, 
    deckA, 
    deckB,
    setMasterBpm,
    setCrossfader,
    setDeckVolume 
  } = useStore();
  
  const { initAudio, loadTrack, play, pause } = useAudioEngine();
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  const handleInit = async () => {
    await initAudio();
    setIsInitialized(true);
  };
  
  return (
    <div className="dj-mixer">
      {!isInitialized && (
        <button onClick={handleInit}>🎵 Start Audio Engine</button>
      )}
      
      <div className="master-controls">
        <label>Master BPM: {masterBpm}</label>
        <input 
          type="range" 
          min="60" 
          max="180" 
          value={masterBpm}
          onChange={(e) => setMasterBpm(Number(e.target.value))}
        />
      </div>
      
      <div className="crossfader">
        <span>A</span>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01"
          value={crossfader}
          onChange={(e) => setCrossfader(Number(e.target.value))}
        />
        <span>B</span>
      </div>
      
      <div className="decks">
        <div className="deck-a">
          <h3>Deck A</h3>
          <button onClick={() => play('A')}>Play</button>
          <button onClick={() => pause('A')}>Pause</button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            value={deckA.volume}
            onChange={(e) => setDeckVolume('A', Number(e.target.value))}
          />
        </div>
        
        <div className="deck-b">
          <h3>Deck B</h3>
          <button onClick={() => play('B')}>Play</button>
          <button onClick={() => pause('B')}>Pause</button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            value={deckB.volume}
            onChange={(e) => setDeckVolume('B', Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
```

### Example 2: EQ Control

```typescript
import { useStore } from '@/store/useStore';

function EQControls({ deck }: { deck: 'A' | 'B' }) {
  const { deckA, deckB, setDeckEQ } = useStore();
  const deckState = deck === 'A' ? deckA : deckB;
  
  const handleEQChange = (band: 'low' | 'mid' | 'high', value: number) => {
    setDeckEQ(deck, {
      ...deckState.eq,
      [band]: value
    });
  };
  
  return (
    <div className="eq-controls">
      <div>
        <label>Low</label>
        <input 
          type="range" 
          min="-24" 
          max="12" 
          value={deckState.eq.low}
          onChange={(e) => handleEQChange('low', Number(e.target.value))}
        />
      </div>
      <div>
        <label>Mid</label>
        <input 
          type="range" 
          min="-24" 
          max="12" 
          value={deckState.eq.mid}
          onChange={(e) => handleEQChange('mid', Number(e.target.value))}
        />
      </div>
      <div>
        <label>High</label>
        <input 
          type="range" 
          min="-24" 
          max="12" 
          value={deckState.eq.high}
          onChange={(e) => handleEQChange('high', Number(e.target.value))}
        />
      </div>
    </div>
  );
}
```

## Performance Metrics

Based on the architectural specification, the implementation targets:

- **Audio Latency**: <10ms (achieved via Tone.js AudioContext scheduling)
- **Visual Reactivity**: 60fps (achieved via requestAnimationFrame + transient updates)
- **Mobile Support**: iOS Safari, Chrome Android (autoplay policy handled)

## Next Steps (Future Phases)

- **Phase V**: Advanced visualizations (Liquid Obsidian 3D)
- **Phase VI**: AI-powered features and stem separation (vocals/instrumentals)
- **Phase VII**: Real-time time-stretching (pitch-independent tempo adjustment)

## Troubleshooting

### Audio not playing on mobile
Ensure `initAudio()` is called from a synchronous user event handler (click, touch).

### CORS errors when loading tracks
Verify your R2 bucket has proper CORS headers configured.

### Double audio playback in development
This is caused by React Strict Mode. The singleton guard (`isInitialized.current`) prevents this in production.

### Crossfader volume dip
Verify the crossfader range is correctly mapped from -1 to 1 (UI) to 0 to 1 (Tone.js).

## References

- [Tone.js Documentation](https://tonejs.github.io/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)
