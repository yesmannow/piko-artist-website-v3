# S11 Main Waveform - Summary & Testing Guide

## ✅ Component Located

**File**: `src/components/studio/ui/MainWaveform.tsx`
**Child**: `src/components/studio/ui/WaveformMini.tsx`
**Parent**: `src/components/studio/layout/StudioPanels.tsx`

## 🔍 Track URL Source

```tsx
// StudioPanels.tsx passes:
url={deckA.trackData?.url}

// This comes from store set by:
setDeckTrack(deck, {
  trackKey: deriveTrackKey({ url }),
  url,  // ← The actual audio URL
  bpm,
  title,
  artist,
});
```

**Example URLs**:
- Local: `/audio/tracks/te-perdi.mp3`
- R2 (future): `https://r2.example.com/audio/tracks/te-perdi.mp3`

## 🐛 Why aria-disabled is true

### Current Logic (WaveformMini.tsx line 401)
```typescript
aria-disabled={resolvedDuration <= 0}
```

### resolvedDuration Calculation
```typescript
const resolvedDuration = useMemo(
  () => (durationSeconds && durationSeconds > 0 ? durationSeconds : duration),
  [durationSeconds, duration]
);
```

**Priority**:
1. `durationSeconds` (from MainWaveform → audio engine)
2. `duration` (from WaveformMini → decoded peaks)

### Why Both Are Zero Initially

**Audio Engine Duration** (`durationSeconds`):
- MainWaveform polls `getDeckDuration(deckId)` every frame
- `getDeckDuration()` returns `player.buffer?.duration ?? 0`
- Returns `0` until Tone.Player buffer is loaded
- Load time: ~1-3 seconds (depends on file size, network)

**Waveform Duration** (internal `duration`):
- WaveformMini fetches audio file
- Decodes to AudioBuffer
- Sets `duration = audioBuffer.duration`
- Decode time: ~1-3 seconds (depends on file size, CPU)

**Result**: Both are `0` during initial 1-3 seconds → scrubber disabled

## ✅ The Fix

**Good News**: The current architecture is correct!

`getDeckDuration()` already checks `player.buffer?.duration`:

```typescript
// src/hooks/useAudioEngine.ts line 785
const getDeckDuration = useCallback((deck: 'A' | 'B'): number => {
  const stemSet = stemPlayers.current[deck];
  const stemDurations = Object.values(stemSet)
    .map((player) => player?.buffer?.duration ?? 0);
  const stemMax = stemDurations.length ? Math.max(...stemDurations) : 0;

  const player = players.current[deck];
  const playerDuration = player?.buffer?.duration ?? 0;  // ✅ Correct

  return Math.max(stemMax, playerDuration);
}, [players, stemPlayers]);
```

**This should return duration as soon as Tone.Player loads the buffer.**

## 🧪 Testing Instructions

### 1. Open Browser Console
- Navigate to http://localhost:3000/studio
- Open DevTools console (F12)

### 2. Load a Track
- Click "Track Library" or use existing track
- Click "Load A" or "Load B"

### 3. Observe Console Logs

**Expected Output**:
```
[MainWaveform Deck A] deckId: A
[MainWaveform Deck A] url: /audio/tracks/te-perdi.mp3
[MainWaveform Deck A] trackData.url: /audio/tracks/te-perdi.mp3
[MainWaveform Deck A] deck.trackKey: te-perdi
[MainWaveform Deck A] derived trackKey: te-perdi

[WaveformMini] aria-disabled: true reason: {
  durationSeconds: undefined,
  duration: 0,
  resolvedDuration: 0,
  isLoading: true
}

// After ~1-2 seconds (audio buffer loads):
[WaveformMini] aria-disabled: false reason: {
  durationSeconds: 185.5,  ← From audio engine
  duration: 0,             ← Waveform still decoding
  resolvedDuration: 185.5,
  isLoading: true
}

// After ~2-3 seconds (waveform decodes):
[WaveformMini] aria-disabled: false reason: {
  durationSeconds: 185.5,
  duration: 185.5,         ← From waveform peaks
  resolvedDuration: 185.5,
  isLoading: false
}
```

### 4. Verify UI State

**At 0 seconds**:
- Header shows "Analyzing"
- Scrubber has `aria-disabled="true"`
- Scrubber has loading pulse animation

**At ~1-2 seconds** (audio engine loads):
- Header shows "Waveform" (because duration > 0)
- Scrubber has `aria-disabled="false"` ✅
- Scrubber is clickable/draggable ✅
- Loading pulse may still show (waveform decoding)

**At ~2-3 seconds** (waveform decodes):
- Loading pulse disappears
- Waveform peaks render
- Scrubber fully functional

## 🎯 Success Criteria

- [x] URL logged correctly (`/audio/tracks/te-perdi.mp3`)
- [ ] `trackKey` logged correctly (`te-perdi`)
- [ ] `aria-disabled` becomes `false` when `durationSeconds > 0`
- [ ] Scrubber becomes clickable after ~1-2 seconds
- [ ] "Analyzing" can still show (insights analysis separate)
- [ ] No repeated console spam (logs fire once per state change)

## 🐛 If Scrubber Stays Disabled

**Potential Issues**:

1. **Audio engine not reporting duration**:
   - Check console: Is `durationSeconds` always `undefined`?
   - Fix: Verify Tone.Player `onload` callback fires
   - Fix: Check `player.buffer` is not null

2. **Waveform decode failing**:
   - Check console: Any fetch/decode errors?
   - Fix: Verify audio file exists at URL
   - Fix: Check CORS headers

3. **Duration polling not working**:
   - Check console: Is `getDeckDuration()` being called?
   - Fix: Verify `requestAnimationFrame` loop is running
   - Fix: Check React re-renders on state change

## 🔧 Potential Optimization

If scrubber stays disabled too long, we can add explicit logging in `getDeckDuration`:

```typescript
const getDeckDuration = useCallback((deck: 'A' | 'B'): number => {
  const player = players.current[deck];
  const playerDuration = player?.buffer?.duration ?? 0;

  // TEMP: Debug logging
  if (process.env.NODE_ENV === 'development' && playerDuration > 0) {
    console.log(`[AudioEngine] getDeckDuration(${deck}):`, playerDuration);
  }

  return Math.max(stemMax, playerDuration);
}, [players, stemPlayers]);
```

## 📝 Next Steps

1. **Test manually** with browser console open
2. **Capture console output** when loading track
3. **Verify aria-disabled becomes false** after duration > 0
4. If working correctly:
   - Remove TEMP debug logs
   - Document findings
   - Mark as complete
5. If not working:
   - Add logging to `getDeckDuration()`
   - Investigate Tone.Player buffer loading
   - Check for race conditions

---

**Status**: Ready for manual testing
**Dev Server**: Running at http://localhost:3000
**Test Route**: `/studio`
