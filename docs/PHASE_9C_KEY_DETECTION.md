# Phase 9C: Key Detection + Camelot Notation + Compatibility Highlighting

## Overview

Phase 9C implements musical key detection with Camelot notation and harmonic compatibility highlighting for DJ mixing.

## Architecture

### Key Detection Worker (`src/workers/key.worker.ts`)

**Essentia.js Integration:**
- Attempts to load Essentia.js WASM in worker
- Uses `KeyDetection` algorithm for accurate key detection
- Falls back gracefully if Essentia.js unavailable
- Returns structured error for UI handling

**Message Protocol:**
- `ANALYZE_KEY_START`: Request key analysis
- `ANALYZE_KEY_DONE`: Returns `{ root, scale, camelot }`
- `ANALYZE_KEY_ERROR`: Returns error message

### KeyService (`src/engine/rt/analysis/KeyService.ts`)

**Singleton Pattern:**
- Manages Web Worker for key analysis
- Caches results by track URL/hash
- Provides `analyzeKey(audioBuffer, cacheKey)` method
- Returns unavailable result instead of throwing errors

### Camelot Utilities (`src/utils/camelot.ts`)

**Functions:**
- `toCamelot(root, scale)`: Converts to Camelot notation
- `compatibleKeys(camelot)`: Returns compatible keys array
- `areKeysCompatible(key1, key2)`: Checks compatibility

**Compatibility Rules:**
1. Same number, opposite scale (8A ↔ 8B)
2. Adjacent numbers, same scale (8A ↔ 7A, 8A ↔ 9A)
3. Adjacent numbers, opposite scale (8A ↔ 7B, 8A ↔ 9B)

### React Hooks

**useKey** (`src/hooks/useKey.ts`):
- `analyze(audioBuffer, cacheKey)`: Start key analysis
- `keyData`: KeyAnalysisResult or null
- `isAnalyzing`: Analysis in progress

**useTrackKey** (`src/hooks/useTrackKey.ts`):
- Provides key data for a specific track
- Handles caching and retrieval

**useKeyCompatibility** (`src/hooks/useTrackKey.ts`):
- Checks if track key is compatible with reference key
- Returns compatible keys list

### UI Components

**KeyDisplay** (`src/components/studio/KeyDisplay.tsx`):
- Displays Camelot notation
- Optional compatibility highlighting
- Shows "Key N/A" if unavailable

**BeatGridDisplay** (Updated):
- Shows key next to BPM
- Auto-analyzes key when audio buffer available

## Usage

### Analyze Key for Track

```typescript
import { useKey } from '@/hooks/useKey';

const { analyze, keyData } = useKey();

// Analyze key
await analyze(audioBuffer, trackUrl);
console.log(keyData?.camelot); // "8A"
```

### Check Compatibility

```typescript
import { useKeyCompatibility } from '@/hooks/useTrackKey';

const { isCompatible } = useKeyCompatibility(trackKey, masterDeckKey);

// Highlight track if compatible
<div className={isCompatible ? 'border-green-500' : ''}>
  {track.title}
</div>
```

### Display Key with Compatibility

```typescript
import { KeyDisplay } from '@/components/studio/KeyDisplay';

<KeyDisplay
  keyData={keyData}
  referenceKey={masterDeckKey}
  showCompatibility={true}
/>
```

## Track List Integration

To add compatibility highlighting to track lists:

1. **Get master deck key:**
   ```typescript
   const masterDeckKey = useMemo(() => {
     // Get key from currently playing deck
     const studio = getStudioEngine();
     const masterDeck = 'A'; // or get from state
     const cacheKey = getDeckCacheKey(masterDeck);
     const keyService = getKeyService();
     const keyData = keyService.getCached(cacheKey);
     return keyData?.camelot || null;
   }, [masterDeckState]);
   ```

2. **Add KeyDisplay to TrackCard:**
   ```typescript
   <KeyDisplay
     keyData={trackKeyData}
     referenceKey={masterDeckKey}
     showCompatibility={true}
   />
   ```

3. **Highlight compatible tracks:**
   ```typescript
   const { isCompatible } = useKeyCompatibility(trackKey, masterDeckKey);

   <div className={isCompatible ? 'ring-2 ring-green-500' : ''}>
     {/* Track card */}
   </div>
   ```

## Essentia.js Setup

**Current Status:**
- Worker attempts to load Essentia.js
- Falls back gracefully if unavailable
- Returns default key (C major / 8B) in fallback mode

**To Enable Real Key Detection:**

1. Install Essentia.js:
   ```bash
   npm install essentia.js
   ```

2. Verify worker can import:
   - Check browser console for Essentia.js load messages
   - Test with real audio files

3. Update worker if API differs:
   - Essentia.js API may vary by version
   - Check Essentia.js documentation for correct usage

**Note:** Essentia.js WASM can be finicky in workers. The current implementation provides a working interface with fallback support.

## Testing

1. Load a track and analyze key
2. Verify Camelot notation displays correctly
3. Load second track and check compatibility
4. Enable sync and verify keys are used for harmonic mixing

## Troubleshooting

**Key always shows "Unavailable":**
- Check Essentia.js is installed
- Verify worker compiled correctly
- Check browser console for errors

**Compatibility not highlighting:**
- Ensure both tracks have keys analyzed
- Check reference key is set correctly
- Verify `areKeysCompatible()` logic

**Key analysis slow:**
- Analysis runs in worker (non-blocking)
- Large files may take time
- Consider pre-analyzing library tracks

## Files

- `src/workers/key.worker.ts` - Key detection worker
- `src/engine/rt/analysis/KeyService.ts` - Key service singleton
- `src/hooks/useKey.ts` - Key analysis hook
- `src/hooks/useTrackKey.ts` - Track key and compatibility hooks
- `src/utils/camelot.ts` - Camelot utilities
- `src/components/studio/KeyDisplay.tsx` - Key display component
