# Phase S11.2 - Quick Reference

## 🎯 TrackKey System (Part 1 - COMPLETE)

### Core Concept
**ONE canonical identifier per track** - stable across all environments (local, R2, API, blobs).

### Key Function
```typescript
import { deriveTrackKey } from '@/lib/trackKey';

// Normalizes ANY input to stable slug
deriveTrackKey({ url: "/audio/tracks/te-perdi.mp3" })  // → "te-perdi"
deriveTrackKey({ url: "https://r2.../Te%20Perdi.mp3" }) // → "te-perdi"
deriveTrackKey({ title: "Te Perdí" })                   // → "te-perdi"
```

### Usage Patterns

#### ✅ DO: Use trackKey for identity
```typescript
// Store
const deckA = useStore((state) => state.deckA);
const trackKey = deckA.trackKey;  // "te-perdi"

// Cache lookups
const insights = await getInsights(trackKey);
const peaks = await getPeaks(trackKey);
const cues = await getCues(trackKey);

// Drag/drop
e.dataTransfer.setData('application/x-piko-track-id', track.trackKey);
```

#### ❌ DON'T: Use URL as identifier
```typescript
// WRONG - URLs change between environments
const trackId = dbTrack.url;  // ❌
const insights = await getInsights(url);  // ❌ Cache miss

// RIGHT - Use canonical key
const trackKey = deriveTrackKey(dbTrack);  // ✅
const insights = await getInsights(trackKey);  // ✅ Cache hit
```

### Store Structure
```typescript
interface DeckState {
  trackKey: string | null;  // Top-level canonical ID
  trackData: {
    trackKey?: string;      // Same canonical ID
    url: string;            // For audio fetching (may change)
    // ...
  } | null;
}
```

### Migration Checklist
- [x] Create `src/lib/trackKey.ts`
- [x] Update `DeckState` interface (trackId → trackKey)
- [x] Update `setDeckTrack` action (derive trackKey)
- [x] Update hooks (useTrackInsights, useDeckStems)
- [x] Update TrackLibrary (deriveTrackKey on map)
- [x] Update TrackListing (Track interface + drag/drop)
- [x] Update PerformanceRow (drop handler)
- [x] Update useAudioEngine (loadTrack)
- [x] Verify build passes

---

## 🚧 Console Errors (Part 2 - NEXT)

### 1. ERR_CACHE_OPERATION_NOT_SUPPORTED
**Fix**: Add `{ cache: 'no-store' }` in dev
```typescript
const url = process.env.NODE_ENV === 'development'
  ? `/audio/tracks/${filename}?t=${Date.now()}`
  : `/audio/tracks/${filename}`;

const response = await fetch(url, {
  cache: process.env.NODE_ENV === 'development' ? 'no-store' : 'default'
});
```

### 2. WaveformMini Fetch Spam
**Fix**: Use `trackData.url`, add fetchFailed guard
```typescript
// WRONG:
const url = `/audio/tracks/${trackKey}.mp3`;  // ❌ May not exist

// RIGHT:
const url = trackData.url;  // ✅ Actual audio URL
```

### 3. Essentia Init Errors
**Fix**: Single unavailable response, capability gate
```typescript
// Worker: ONE response on failure
if (!essentiaInstance) {
  postMessage({ unavailable: true });
  return;  // Don't throw repeatedly
}

// Consumer: Check capability
if (result?.unavailable) {
  console.warn('[Essentia] Analysis unavailable');
  // Show UI banner, don't spam console
}
```

---

## 💾 Precomputed Peaks (Part 3 - PLANNED)

### Database Schema (Dexie v2)
```typescript
// New table
db.version(2).stores({
  waveformPeaks: 'trackKey, peaks, duration, channels, algoVersion',
  // ...existing tables
});
```

### Compute & Cache
```typescript
// src/audio/waveform/computePeaks.ts
export async function computePeaks(
  audioBuffer: AudioBuffer,
  samplesPerPixel = 800
): Promise<number[][]> {
  // Downsample to normalized peaks
}

// Cache after decode
const peaks = await computePeaks(audioBuffer);
await db.waveformPeaks.put({
  trackKey,
  peaks,
  duration: audioBuffer.duration,
  channels: audioBuffer.numberOfChannels,
  algoVersion: 1,
});
```

### Instant Render
```typescript
// DeckWaveformWS: Check cache first
const cached = await db.waveformPeaks.get(trackKey);
if (cached) {
  wavesurfer.init({
    peaks: cached.peaks,
    duration: cached.duration,
  });
  // ✅ Instant waveform render!
} else {
  wavesurfer.init({
    url: trackData.url,
  });
  // ⏳ Decode + cache peaks on load
}
```

---

## 🎯 Per-Track Cues/Loops (Part 4 - PLANNED)

### Database Tables
```typescript
db.version(2).stores({
  trackCues: 'trackKey, cues',  // Array of 8 hot cues
  trackLoops: 'trackKey, loop', // Active loop region
  // ...
});
```

### Save Cues
```typescript
// HotCuePanel: On cue set/clear
const saveHotCue = async (cueId: number, timeSec: number) => {
  const trackKey = deckA.trackKey;
  if (!trackKey) return;

  const cues = await db.trackCues.get(trackKey);
  cues[cueId] = { id: cueId, timeSec };
  await db.trackCues.put({ trackKey, cues });
};
```

### Load Cues
```typescript
// DeckWaveformWS: On track load
useEffect(() => {
  if (!trackKey) return;

  const loadCues = async () => {
    const saved = await db.trackCues.get(trackKey);
    if (saved?.cues) {
      // Restore WaveSurfer regions
      saved.cues.forEach(cue => {
        wavesurfer.addRegion({
          start: cue.timeSec,
          color: 'rgba(255, 0, 0, 0.3)',
        });
      });
    }
  };

  loadCues();
}, [trackKey]);
```

---

## 🔧 Accessibility Fixes (Part 5 - PLANNED)

1. **StudioSettingsPanel**: div → button, ESC close, focus trap
2. **matchScoring.ts**: Wrap switch cases in braces
3. **Readonly props**: Remove unused imports

---

## 📦 Final Deliverables

- [ ] Part 1: TrackKey system ✅ (DONE)
- [ ] Part 2: Console error fixes
- [ ] Part 3: Precomputed peaks
- [ ] Part 4: Per-track cues/loops
- [ ] Part 5: Accessibility fixes
- [ ] Part 6: Verification + docs

**Current Progress**: 15% → Target: 100%

---

## 🐛 Debug Tips

### Check TrackKey Derivation
```typescript
console.log('[DEBUG] TrackKey:', deriveTrackKey({
  url: dbTrack.url,
  title: dbTrack.title,
}));
```

### Check Store State
```typescript
const deckA = useStore.getState().deckA;
console.log('[DEBUG] DeckA trackKey:', deckA.trackKey);
console.log('[DEBUG] DeckA trackData.trackKey:', deckA.trackData?.trackKey);
```

### Check Cache Hits
```typescript
const cached = await db.trackInsights.get(trackKey);
console.log('[DEBUG] Cache hit:', !!cached);
```

---

**Last Updated**: Phase S11.2 Part 1 Complete
**Build Status**: ✅ Passing
**Next Action**: Part 2 - Console Error Fixes
