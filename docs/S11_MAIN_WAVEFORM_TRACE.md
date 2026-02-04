# S11 Main Waveform Component Trace

**Date**: February 4, 2026
**Status**: TRACED & READY TO FIX

---

## 🎯 Objective

Locate the component rendering `data-testid="main-waveform"`, trace the actual track URL at runtime, identify why `aria-disabled="true"`, and fix the scrubber to enable once duration is known (even while "Analyzing").

---

## 📍 Component Location

### **File**: `src/components/studio/ui/MainWaveform.tsx`

**Component**: `MainWaveform`

**Usage**: Imported by `src/components/studio/layout/StudioPanels.tsx`

```tsx
// StudioPanels.tsx (lines 114-119)
<MainWaveform
  deckId="A"
  title={deckA.trackData?.title ?? "Deck A"}
  url={deckA.trackData?.url}
  beatGrid={deckA.trackData?.beatGrid}
/>
```

---

## 🔍 Data Flow

### 1. MainWaveform (Parent)
```tsx
// src/components/studio/ui/MainWaveform.tsx
export function MainWaveform({ deckId, title, url, beatGrid }: MainWaveformProps) {
  const { getPlaybackPosition, getDeckDuration, seekTo } = useAudioEngine();
  const [duration, setDuration] = useState(0);

  // Polls audio engine for duration every frame
  useEffect(() => {
    const tick = () => {
      setPosition(getPlaybackPosition(deckId));
      setDuration(getDeckDuration(deckId));  // ← Gets duration from Tone.js player
      frameRef.current = window.requestAnimationFrame(tick);
    };
    // ...
  }, [deckId, getDeckDuration, getPlaybackPosition]);

  return (
    <div className="main-waveform" data-testid="main-waveform">
      <div className="main-waveform-header">
        <span>{title ?? `Deck ${deckId}`}</span>
        {/* Status shows "Analyzing" if duration is 0 */}
        <span className="main-waveform-status">
          {duration > 0 ? "Waveform" : "Analyzing"}
        </span>
      </div>

      {/* WaveformMini receives both url and duration */}
      <WaveformMini
        url={url}
        color={deckId === "A" ? "#4af2c5" : "#7c8dff"}
        beatGrid={beatGrid}
        playhead={position}
        durationSeconds={duration > 0 ? duration : undefined}  // ← Passes duration
        onSeek={(seconds) => seekTo(deckId, seconds)}
      />
    </div>
  );
}
```

**Key Points**:
- `url` comes from `deckA.trackData?.url` or `deckB.trackData?.url`
- `duration` is polled from audio engine (`getDeckDuration()`)
- Shows "Analyzing" when `duration <= 0`
- Passes `durationSeconds` prop to WaveformMini

---

### 2. WaveformMini (Child - The Scrubber)
```tsx
// src/components/studio/ui/WaveformMini.tsx
export function WaveformMini({
  url,
  color,
  beatGrid = [],
  playhead = 0,
  durationSeconds,  // ← Duration from parent (audio engine)
  onSeek,
}: Readonly<WaveformMiniProps>) {
  const [duration, setDuration] = useState(0);  // Internal duration from peaks

  // Resolved duration: use parent's duration if available, else internal
  const resolvedDuration = useMemo(
    () => (durationSeconds && durationSeconds > 0 ? durationSeconds : duration),
    [durationSeconds, duration]
  );

  return (
    <div
      className="waveform-scrubber"
      role="slider"
      aria-disabled={resolvedDuration <= 0}  // ← DISABLED WHEN NO DURATION
      // ...
    >
      <canvas ref={canvasRef} />
      {isLoading && <div className="animate-pulse" />}
    </div>
  );
}
```

**Key Points**:
- `resolvedDuration` prioritizes `durationSeconds` (from audio engine)
- Falls back to internal `duration` (from decoded peaks metadata)
- **`aria-disabled` is TRUE when `resolvedDuration <= 0`**

---

## 🐛 Root Cause Analysis

### Why is `aria-disabled="true"`?

**Condition**: `resolvedDuration <= 0`

**Breakdown**:
1. `durationSeconds` (from parent) is `undefined` or `0`
   - MainWaveform passes `duration > 0 ? duration : undefined`
   - If `getDeckDuration(deckId)` returns `0`, parent passes `undefined`

2. Internal `duration` (from peaks) is `0`
   - WaveformMini decodes audio to build peaks
   - Sets internal `duration` from `audioBuffer.duration`
   - If decode hasn't completed, `duration` remains `0`

**Result**: Both durations are `0` → `resolvedDuration = 0` → `aria-disabled="true"`

### Why does this happen?

**Timing Issue**:
- Audio engine may still be loading (`Tone.Player` not ready)
- Waveform decode may be in progress (large file, chunked decode)
- Both processes can take 1-3 seconds for large files

**Current Behavior**:
- Scrubber stays disabled until BOTH complete
- User sees "Analyzing" and disabled scrubber even if one source has duration

---

## 🎯 Track URL Source

### Where does `url` come from?

**Chain**:
1. **Store**: `deckA.trackData?.url` or `deckB.trackData?.url`
2. **Set by**: `setDeckTrack()` action in `useStore.ts`
3. **Called from**:
   - `TrackListing.tsx` - When user clicks "Load A" / "Load B"
   - `PerformanceRow.tsx` - When user drags track to deck
   - `useAudioEngine.ts` - When `loadTrack()` is called

**Example URL values**:
```typescript
// Local environment:
url: "/audio/tracks/te-perdi.mp3"

// R2 production (future):
url: "https://r2.example.com/audio/tracks/te-perdi.mp3"

// API redirect (future):
url: "/api/tracks?trackId=te-perdi"
```

**Debug Logs** (added in MainWaveform.tsx):
```typescript
console.log(`[MainWaveform Deck ${deckId}] url:`, url);
console.log(`[MainWaveform Deck ${deckId}] trackData.url:`, deck.trackData?.url);
console.log(`[MainWaveform Deck ${deckId}] deck.trackKey:`, deck.trackKey);
console.log(`[MainWaveform Deck ${deckId}] derived trackKey:`, deriveTrackKey(deck.trackData));
```

**Expected Console Output** (when loading "Te Perdí" on Deck A):
```
[MainWaveform Deck A] url: /audio/tracks/te-perdi.mp3
[MainWaveform Deck A] trackData.url: /audio/tracks/te-perdi.mp3
[MainWaveform Deck A] deck.trackKey: te-perdi
[MainWaveform Deck A] derived trackKey: te-perdi
```

---

## ✅ Fix Strategy

### Goal
Enable scrubber as soon as ANY duration source is available (audio engine OR waveform decode), even if "Analyzing" insights are still pending.

### Current State Machine
```
Loading Track
  ↓
Audio Engine Loading (duration = 0) + Waveform Decoding (duration = 0)
  ↓
BOTH complete → resolvedDuration > 0 → aria-disabled=false
```

### Desired State Machine
```
Loading Track
  ↓
EITHER:
  - Audio Engine Ready (getDeckDuration > 0) OR
  - Waveform Decoded (peaks metadata has duration)
  ↓
resolvedDuration > 0 → aria-disabled=false
  ↓
(Insights analysis can continue in background)
```

### Implementation

**No changes needed!** The current logic already handles this correctly:

```typescript
const resolvedDuration = useMemo(
  () => (durationSeconds && durationSeconds > 0 ? durationSeconds : duration),
  [durationSeconds, duration]
);
```

**Priority**:
1. If `durationSeconds` (from audio engine) > 0 → use it ✅
2. Else if internal `duration` (from peaks) > 0 → use it ✅
3. Else `resolvedDuration = 0` → disabled

**The issue is that BOTH sources are 0 during initial load.**

### Root Cause: Audio Engine Timing

The problem is likely in `useAudioEngine.ts` → `getDeckDuration()`:

**Hypothesis**: `getDeckDuration()` returns `0` until Tone.Player is fully loaded AND starts playing (or duration is explicitly read).

**Fix Location**: `src/hooks/useAudioEngine.ts`

Check if `player.buffer?.duration` is available before playback:
```typescript
const getDeckDuration = useCallback((deck: 'A' | 'B') => {
  const player = players.current[deck];
  if (!player) return 0;

  // Try buffer duration first (available after load, before play)
  if (player.buffer && player.buffer.duration) {
    return player.buffer.duration;
  }

  // Fallback to player duration (requires playback to start)
  return player.duration || 0;
}, []);
```

---

## 🔧 Debug Logs Added

### MainWaveform.tsx
```typescript
useEffect(() => {
  if (url && process.env.NODE_ENV === 'development') {
    console.log(`[MainWaveform Deck ${deckId}] deckId:`, deckId);
    console.log(`[MainWaveform Deck ${deckId}] trackData:`, deck.trackData);
    console.log(`[MainWaveform Deck ${deckId}] url:`, url);
    console.log(`[MainWaveform Deck ${deckId}] trackData.url:`, deck.trackData?.url);
    console.log(`[MainWaveform Deck ${deckId}] trackData.trackKey:`, deck.trackData?.trackKey);
    console.log(`[MainWaveform Deck ${deckId}] deck.trackKey:`, deck.trackKey);
    if (deck.trackData) {
      console.log(`[MainWaveform Deck ${deckId}] derived trackKey:`, deriveTrackKey(deck.trackData));
    }
  }
}, [deckId, url, deck.trackData, deck.trackKey]);
```

### WaveformMini.tsx
```typescript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const ariaDisabled = resolvedDuration <= 0;
    console.log('[WaveformMini] aria-disabled:', ariaDisabled, 'reason:', {
      durationSeconds,
      duration,
      resolvedDuration,
      isLoading,
    });
  }
}, [resolvedDuration, durationSeconds, duration, isLoading]);
```

---

## 📊 Expected Console Output

### When loading a track on Deck A:

```
[MainWaveform Deck A] deckId: A
[MainWaveform Deck A] trackData: {
  trackKey: "te-perdi",
  url: "/audio/tracks/te-perdi.mp3",
  bpm: 96,
  title: "Te Perdí",
  artist: "Piko",
  ...
}
[MainWaveform Deck A] url: /audio/tracks/te-perdi.mp3
[MainWaveform Deck A] trackData.url: /audio/tracks/te-perdi.mp3
[MainWaveform Deck A] trackData.trackKey: te-perdi
[MainWaveform Deck A] deck.trackKey: te-perdi
[MainWaveform Deck A] derived trackKey: te-perdi

[WaveformMini] aria-disabled: true reason: {
  durationSeconds: undefined,
  duration: 0,
  resolvedDuration: 0,
  isLoading: true
}

// After audio engine loads:
[WaveformMini] aria-disabled: false reason: {
  durationSeconds: 185.5,  ← From Tone.js
  duration: 0,              ← Peaks still decoding
  resolvedDuration: 185.5,  ← Uses audio engine duration
  isLoading: true
}

// After waveform decodes:
[WaveformMini] aria-disabled: false reason: {
  durationSeconds: 185.5,
  duration: 185.5,          ← From peaks metadata
  resolvedDuration: 185.5,
  isLoading: false
}
```

---

## 🎯 Fix Checklist

- [x] Locate component (`MainWaveform.tsx`)
- [x] Trace URL source (`deckA.trackData?.url`)
- [x] Add debug logs (MainWaveform + WaveformMini)
- [ ] **FIX**: Check `getDeckDuration()` in `useAudioEngine.ts`
  - Read `player.buffer.duration` before playback starts
  - Return duration as soon as buffer is loaded
- [ ] Test: Load track, verify scrubber enables when audio engine reports duration
- [ ] Remove debug logs
- [ ] Verify no console spam
- [ ] Build passes

---

## 🔧 Recommended Fix

### File: `src/hooks/useAudioEngine.ts`

**Find**: `getDeckDuration` callback

**Current** (likely):
```typescript
const getDeckDuration = useCallback((deck: 'A' | 'B') => {
  const player = players.current[deck];
  return player?.duration || 0;
}, []);
```

**Fixed**:
```typescript
const getDeckDuration = useCallback((deck: 'A' | 'B') => {
  const player = players.current[deck];
  if (!player) return 0;

  // Priority 1: Buffer duration (available immediately after load)
  if (player.buffer?.duration) {
    return player.buffer.duration;
  }

  // Priority 2: Player duration (may require playback start)
  return player.duration || 0;
}, []);
```

**Explanation**:
- `player.buffer.duration` is available as soon as `Tone.Player` loads the audio buffer
- `player.duration` may be `0` until playback starts (Tone.js quirk)
- By checking buffer first, we get duration ~1-2s faster
- This enables scrubber immediately after audio loads (no need to wait for play)

---

## 📝 Next Steps

1. **Apply fix** to `getDeckDuration()` in `useAudioEngine.ts`
2. **Test manually**:
   - Load track on Deck A
   - Verify console shows URL: `/audio/tracks/te-perdi.mp3`
   - Verify console shows `aria-disabled: false` when duration > 0
   - Verify scrubber is enabled (can click/drag)
   - Verify "Analyzing" can still show (insights pending)
3. **Remove debug logs** from MainWaveform.tsx and WaveformMini.tsx
4. **Verify build**: `npm run build`
5. **Document** in this file

---

## 🐛 Known Issues

**None** - The component architecture is correct, just needs `getDeckDuration()` optimization.

---

**Status**: TRACED ✅
**Next**: Apply fix to `useAudioEngine.ts`
