# Phase 9A: BPM/Beatgrid Analysis Implementation

## Overview

Phase 9A implements enhanced BPM and beat grid analysis with:

- **BPM Detection**: Accurate tempo detection
- **Downbeat Detection**: First beat of first bar
- **Beat Timestamps**: Complete beat grid array
- **UI Components**: BPM display and "Sync (tempo only)" button

## Architecture

### Beat Grid Worker (`src/workers/beatgrid.worker.ts`)

**Analysis Process:**

1. Mix audio to mono
2. Downsample for performance (~10 samples/second)
3. Apply low-pass filter to isolate bass frequencies
4. Detect peaks in energy envelope
5. Calculate intervals between peaks
6. Find most common interval (tempo/BPM)
7. Detect downbeat (strongest 4-beat pattern)
8. Generate complete beat grid

**Output:**

```typescript
{
  bpm: number;              // Beats per minute
  downbeatTime: number;      // Time of first downbeat (seconds)
  beatTimestamps: number[];  // All beat positions (seconds)
  confidence: number;       // 0-1 confidence score
}
```

### BeatGridService (`src/engine/BeatGridService.ts`)

**Features:**

- Singleton pattern
- Web Worker management
- Result caching by track key
- State management (uninitialized, ready, analyzing, error)

**API:**

```typescript
const service = getBeatGridService();
await service.initialize();
const beatGrid = await service.analyze(audioBuffer, "cache-key");
```

### React Hook (`src/hooks/useBeatGrid.ts`)

**Features:**

- Automatic service initialization
- Beat grid analysis
- Caching support
- Error handling

**Usage:**

```typescript
const { beatGridData, isAnalyzing, analyze } = useBeatGrid();
await analyze(audioBuffer, "track-123");
```

### UI Component (`src/components/studio/BeatGridDisplay.tsx`)

**Features:**

- BPM display with confidence indicator
- Beat grid info (beat count, downbeat time)
- "Sync (tempo only)" button
- Auto-analysis when audio buffer is available
- Error handling and display

**Props:**

- `audioBuffer`: Audio buffer to analyze
- `cacheKey`: Optional cache key
- `onSync`: Callback when sync button is clicked

## Algorithm Details

### BPM Detection

1. **Peak Detection**: Finds energy peaks in filtered audio
2. **Interval Analysis**: Calculates intervals between peaks
3. **Tempo Finding**: Groups intervals and finds most common
4. **Range Clamping**: Handles double-time/half-time (60-180 BPM)

### Downbeat Detection

1. **Pattern Matching**: Looks for 4-beat patterns
2. **Energy Analysis**: Finds strongest beat alignment
3. **Scoring**: Scores each candidate peak based on following beats
4. **Selection**: Chooses peak with highest score

### Beat Grid Generation

1. **Calculate Interval**: `beatInterval = 60 / bpm` seconds
2. **Generate Forward**: From downbeat to end of track
3. **Generate Backward**: From downbeat to start (if needed)
4. **Complete Array**: All beat positions in chronological order

## Usage Example

```tsx
import { BeatGridDisplay } from "@/components/studio/BeatGridDisplay";

function MyComponent() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const handleSync = (beatGrid: BeatGridData) => {
    console.log("BPM:", beatGrid.bpm);
    console.log("Beats:", beatGrid.beatTimestamps);
    // Implement tempo sync logic here
  };

  return (
    <BeatGridDisplay
      audioBuffer={audioBuffer}
      cacheKey="track-123"
      onSync={handleSync}
    />
  );
}
```

## Performance

- **Analysis Time**: ~100-500ms for typical tracks
- **Caching**: Results cached by track key
- **Worker**: Non-blocking analysis in separate thread
- **Memory**: Efficient downsampling reduces memory usage

## Next Steps (Phase 9B)

1. **SyncController**: Implement PLL-style phase sync
2. **Phase Error Calculation**: Compare master/slave beat timestamps
3. **Playback Rate Correction**: Bounded adjustments for tempo matching
4. **Beat Boundary Nudge**: Optional jump if phase error is too large

## Notes

- Worker is compiled to `public/workers/beatgrid.worker.js`
- Service uses singleton pattern for consistency
- Caching prevents re-analysis of same tracks
- Confidence score helps identify reliable detections
