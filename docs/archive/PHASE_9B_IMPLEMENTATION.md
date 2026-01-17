# Phase 9B: PLL Phase Sync Implementation

## Overview

Phase 9B implements PLL (Phase-Locked Loop) synchronization that matches both tempo and phase between master and slave decks.

## Architecture

### SyncController (`src/engine/rt/sync/SyncController.ts`)

**PLL Algorithm:**

1. Calculate base rate: `baseRate = masterBPM / slaveBPM`
2. Find nearest beats at current track positions
3. Calculate phase error: `phaseError = (slaveOffset - masterOffset * baseRate) * slaveBeatInterval`
4. Apply correction: `correctedRate = baseRate + Kp * phaseError`
5. Clamp to bounds: `clampedRate = clamp(correctedRate, baseRate ± maxRateDelta)`
6. Smooth with EMA: `smoothedRate = smoothing * smoothedRate + (1 - smoothing) * clampedRate`
7. Apply to slave deck: `slaveGraph.setRate(smoothedRate)`

**Key Features:**

- Uses `AudioContext.currentTime` for timing (no setTimeout/setInterval)
- Bounded corrections prevent warble
- EMA smoothing for stable rate changes
- Optional beat-boundary nudge for large phase errors

**Parameters:**

- `Kp`: Proportional gain (default: 0.1) - Controls correction strength
- `maxRateDelta`: Maximum rate deviation (default: 0.08 = ±8%)
- `smoothing`: EMA smoothing factor (default: 0.95 = 95% previous, 5% new)
- `beatNudgeThreshold`: Phase error threshold for beat nudge (default: 0.2s)

### StudioEngine Integration

**New Methods:**

- `setSyncEnabled(deckId, enabled, masterDeckId?)`: Enable/disable sync
- `getSyncState()`: Get current sync state
- `sync`: Direct access to SyncController (for tick())

**Track Loading:**

- Stores track URLs for cache key generation
- Sets cache keys in SyncController for beat grid retrieval

### UI Components

**SyncControl** (`src/components/studio/SyncControl.tsx`):

- Toggle sync ON/OFF
- Shows sync status
- Handles missing beat grids gracefully
- Integrated into desktop layout deck sections

**rAF Loop:**

- Added to both `DesktopStudioLayout` and `MobileStudioLayout`
- Calls `studio.sync.tick(audioContext.currentTime)` every frame
- Only runs when sync is enabled
- Properly cleaned up on unmount

## Phase Error Calculation

The phase error is calculated as:

```typescript
// Find nearest beats
const nearestMasterBeat = findNearestBeat(masterTrackTime, masterBeatGrid);
const nearestSlaveBeat = findNearestBeat(slaveTrackTime, slaveBeatGrid);

// Calculate offsets (distance to nearest beat)
const masterOffset = masterTrackTime - nearestMasterBeat;
const slaveOffset = slaveTrackTime - nearestSlaveBeat;

// Phase error accounts for tempo difference
const baseRate = masterBPM / slaveBPM;
const phaseErrorSec =
  (slaveOffset - masterOffset * baseRate) * slaveBeatInterval;
```

**Why this works:**

- `masterOffset * baseRate` converts master offset to slave tempo space
- Difference gives phase error in slave track time
- Normalized by beat interval to get error in seconds

## Usage

### Enable Sync

```typescript
const studio = getStudioEngine();

// Enable sync: Deck B syncs to Deck A
studio.setSyncEnabled("B", true, "A");
```

### Tune Parameters

```typescript
studio.sync.setParams({
  Kp: 0.15, // Stronger correction
  maxRateDelta: 0.06, // Tighter bounds
  smoothing: 0.98, // Smoother transitions
});
```

### Check Sync State

```typescript
const syncState = studio.getSyncState();
console.log("Sync enabled:", syncState.enabled);
console.log("Base rate:", syncState.baseRate);
console.log("Current rate:", syncState.currentRate);
```

## Acceptance Criteria

✅ **Load 2 tracks with BeatGrid computed**

- Both decks must have beat grids analyzed before sync can be enabled

✅ **Enable Sync on Deck B with Deck A as master**

- Deck B playbackRate converges near baseRate
- Phase drift is reduced over time
- Tracks stay aligned longer than tempo-only sync

✅ **npm run build passes**

- All TypeScript compiles without errors

✅ **No runtime errors when BeatGrid is missing**

- UI shows error message
- Sync is refused until beat grids are available

## Testing

1. Load two tracks with different BPMs
2. Analyze beat grids for both tracks
3. Start playback on both decks
4. Enable sync on one deck
5. Observe:
   - Playback rate adjusts to match tempo
   - Phase error decreases over time
   - Beats align and stay aligned

## Notes

- Sync only works when both decks are playing
- Master deck rate stays fixed (1.0)
- Slave deck rate is adjusted continuously
- Rate changes are smooth and bounded to prevent warble
- Uses AudioContext.currentTime for sample-accurate timing
