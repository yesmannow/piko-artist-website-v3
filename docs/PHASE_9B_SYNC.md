# Phase 9B: PLL Phase Sync Implementation

## Overview

Phase 9B implements a complete PLL (Phase-Locked Loop) sync controller that matches both tempo and phase between master and slave decks.

## Architecture

### SyncController (`src/engine/rt/sync/SyncController.ts`)

**PI Controller Algorithm:**
1. Calculate base rate: `baseRate = masterBPM / slaveBPM`
2. Find nearest beats at current track positions
3. Compute phase error: `phaseError = slaveOffset - (masterOffset / baseRate)`
4. Apply PI correction:
   - P term: `Kp * phaseError`
   - I term: `Ki * integral` (with decay to prevent windup)
   - Correction: `baseRate + P + I`
5. Clamp to bounds: `baseRate ± maxRateDelta`
6. Smooth with EMA: `smoothedRate = smoothing * oldRate + (1 - smoothing) * newRate`
7. Apply to slave deck: `slaveGraph.setRate(smoothedRate)`
8. Beat-boundary nudge if error > threshold (80ms)

**Parameters:**
- `Kp`: 0.1 (Proportional gain)
- `Ki`: 0.01 (Integral gain)
- `maxRateDelta`: 0.08 (±8% max deviation)
- `smoothing`: 0.95 (EMA smoothing)
- `beatNudgeThreshold`: 0.08s (80ms)
- `integralDecay`: 0.99 (Prevents integral windup)

### Sync Modes

**Tempo-Only Mode:**
- Sets `Kp = 0`, `Ki = 0` (no phase correction)
- Only matches BPM ratio (base rate)
- Very smooth (smoothing = 0.99)
- Safe for basic tempo matching

**Tempo+Phase Mode (PLL):**
- Full PI controller active
- Matches tempo AND phase alignment
- Beats stay aligned over time
- Optional beat-boundary nudging for large errors

### Beat-Boundary Nudge

When phase error exceeds threshold (80ms):
- Calculates target slave beat to align with master
- Logs nudge action (actual nudge requires `DeckGraph.seek()` method)
- Resets integral term to prevent windup

**Future Enhancement:**
- Implement `DeckGraph.seek(beatTime)` for actual position nudge
- Or adjust `pauseTime`/`startTime` to effectively nudge position

## Usage

### Enable Sync

```typescript
const studio = getStudioEngine();

// Tempo-only mode
studio.setSyncEnabled('B', true, 'A', 'tempo-only');

// Tempo+phase mode (default)
studio.setSyncEnabled('B', true, 'A', 'tempo+phase');
```

### Tune Parameters

```typescript
studio.sync.setParams({
  Kp: 0.15,              // Stronger proportional correction
  Ki: 0.02,              // Stronger integral correction
  maxRateDelta: 0.06,    // Tighter bounds
  beatNudgeThreshold: 0.1, // 100ms threshold
});
```

### Check Sync State

```typescript
const syncState = studio.getSyncState();
console.log('Enabled:', syncState.enabled);
console.log('Base rate:', syncState.baseRate);
console.log('Current rate:', syncState.currentRate);
```

## UI Integration

**SyncControl Component:**
- Mode toggle: Tempo-only vs Tempo+phase
- Sync ON/OFF button
- Status indicator when locked
- Error messages for missing beat grids

**BeatGridDisplay Component:**
- Shows BPM and key
- "Sync (tempo only)" button (legacy, uses tempo-only mode)

## Testing

1. Load two tracks with different BPMs
2. Analyze beat grids for both tracks
3. Start playback on both decks
4. Enable sync in tempo+phase mode
5. Observe:
   - Slave rate converges to base rate
   - Phase error decreases over time
   - Beats align and stay aligned
   - No warble or excessive rate changes

## Troubleshooting

**Sync not working:**
- Check both decks have beat grids analyzed
- Verify both decks are playing
- Check console for sync errors

**Rate changes too aggressive:**
- Reduce `Kp` and `Ki` parameters
- Increase `smoothing` value
- Reduce `maxRateDelta`

**Beats not aligning:**
- Ensure beat grids are accurate (check confidence)
- Increase `beatNudgeThreshold` if nudges are too frequent
- Check that both tracks have similar BPMs (large differences harder to sync)

## Files

- `src/engine/rt/sync/SyncController.ts` - PI controller implementation
- `src/components/studio/SyncControl.tsx` - UI component with mode toggle
- `src/components/studio/BeatGridDisplay.tsx` - Legacy tempo-only button
