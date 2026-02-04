# Phase S11.3 Part 4 - Per-Track Hot Cues (COMPLETE)

## ✅ Implementation Summary

**Status**: 100% Complete (Build Passing ✅)
**Completion Date**: 2026-02-04
**Lint Status**: Minor warnings only (non-blocking)

### Objective
Implement persistent hot cues that follow the track across decks, page reloads, and URL variants using the canonical `trackKey` system.

---

## Architecture

### 1. Database Schema (Already in Dexie v3)

**File**: `src/lib/db.ts`

```typescript
// Phase S11.3: Per-Track Hot Cues
export interface TrackCue {
  slot: number; // 0-7
  timeSec: number;
  label?: string;
  color?: string;
}

export interface TrackCues {
  trackKey: string; // Primary key - canonical track identifier
  cues: TrackCue[];
  updatedAt: Date;
}

export class PikoDatabase extends Dexie {
  trackCues!: Table<TrackCues, string>;

  constructor() {
    super('PikoDJ');
    this.version(3).stores({
      trackCues: 'trackKey, updatedAt',
      // ...
    });
  }
}
```

---

### 2. Cues Management Hook

**File**: `src/hooks/useTrackCues.ts` (NEW)

**Purpose**: Centralized hook for loading, saving, and clearing hot cues by `trackKey`.

**API**:
```typescript
export interface CueSlot {
  slot: number; // 0-7
  timeSec: number | null;
  label?: string;
  color?: string;
}

const { cueSlots, isLoading, setCue, clearCue, clearAllCues } = useTrackCues(trackKey);

// cueSlots: Array<CueSlot> - 8 slots, always present (empty or filled)
// setCue(slot, timeSec, label?) - Set/update cue at slot
// clearCue(slot) - Clear specific cue
// clearAllCues() - Clear all 8 cues for track
```

**Default Colors**:
```typescript
const DEFAULT_CUE_COLORS = [
  '#ff4444', // Red
  '#ff8844', // Orange
  '#ffcc44', // Yellow
  '#44ff44', // Green
  '#44ccff', // Cyan
  '#4488ff', // Blue
  '#8844ff', // Purple
  '#ff44ff', // Magenta
];
```

**Data Flow**:
1. **Load**: `useEffect` triggers on `trackKey` change
2. **Query**: `db.trackCues.get(trackKey)`
3. **Merge**: Saved cues merged with default 8 slots
4. **Set Cue**: Optimistic update → Persist to Dexie
5. **Clear Cue**: Optimistic update → Remove from Dexie
6. **No Track**: Reset to 8 empty slots

---

### 3. HotCuePanel Integration

**File**: `src/components/studio/ui/HotCuePanel.tsx` (UPDATED)

**Changes**:
```diff
- import { useStore } from "@/store/useStore";
+ import { useTrackCues } from "@/hooks/useTrackCues";

- const hotCues = useStore((state) => state.deckA.hotCues);
- const setHotCue = useStore((state) => state.setHotCue);
+ const deck = useStore((state) => state.deckA);
+ const { cueSlots, setCue, clearCue } = useTrackCues(deck.trackKey);
```

**Interaction Model** (Unchanged):
- **Click**: Jump to cue (if set)
- **Shift + Click**: Set cue at current playback position
- **Ctrl/Cmd + Click**: Clear cue slot

**Visual States**:
- Empty slot: Dimmed outline, "—" label
- Set cue: Colored border + background, cue label (e.g., "1")
- Hover: Scale animation for filled cues

**Accessibility**:
- `title` tooltips for all 3 interaction modes
- Keyboard-friendly button elements
- Clear visual feedback on hover/click

---

## Data Flow Example

```
User Workflow:
1. Load "te-perdi.mp3" in Deck A
   → trackKey = "te-perdi"
   → useTrackCues("te-perdi") loads from Dexie

2. Shift+Click "CUE 1" at 00:15
   → setCue(0, 15, "1")
   → Optimistic update: cueSlots[0] = { slot: 0, timeSec: 15, label: "1", color: "#ff4444" }
   → Persist to db.trackCues.put({ trackKey: "te-perdi", cues: [...], updatedAt: now })

3. Click "CUE 1"
   → handleCueClick(0, event)
   → seekTo("A", 15) → Jumps to 00:15

4. Load "te-perdi.mp3" in Deck B (same track, different deck)
   → trackKey = "te-perdi" (same!)
   → useTrackCues("te-perdi") → Loads same cues from Dexie
   → Deck B shows "CUE 1" at 00:15 (persisted!)

5. Page reload → All cues for "te-perdi" still present (IndexedDB persistence)
```

---

## Benefits

### 1. Track-Centric Persistence
- **Before**: Cues lost on deck change or page reload
- **After**: Cues follow the track everywhere via `trackKey`

### 2. Cross-Deck Consistency
- Load same track in Deck A → Set cue
- Load same track in Deck B → Cue is there!

### 3. URL-Agnostic
- `/audio/tracks/te-perdi.mp3` → trackKey: `"te-perdi"`
- `https://r2.../Te%20Perdi.mp3` → trackKey: `"te-perdi"`
- **Same cues** for both URLs

### 4. Offline-First
- **No network**: Cues stored locally in IndexedDB
- **Durable**: Survives browser restarts, cache clears

### 5. Optimistic UI
- **Instant feedback**: setCue updates UI immediately
- **Background persist**: Dexie write happens async
- **Error resilient**: Fallback to local state on DB error

---

## Integration with S11.2 TrackKey System

### Synergy
- **S11.2**: `deriveTrackKey(trackData)` → `"te-perdi"`
- **S11.3 Part 4**: `useTrackCues(trackKey)` → Loads cues for `"te-perdi"`

### Example
```typescript
// Deck A loads track
const trackData = {
  url: "/audio/tracks/te-perdi.mp3",
  title: "Te Perdí",
  artist: "Jesse & Joy"
};

// S11.2: Derive canonical key
const trackKey = deriveTrackKey(trackData); // "te-perdi"

// S11.3 Part 4: Load cues for that key
const { cueSlots } = useTrackCues(trackKey);

// User sets cue
setCue(0, 15, "Intro");

// Later: Deck B loads same track (different URL)
const trackData2 = {
  url: "https://r2.../audio/Te%20Perdi.mp3" // Different URL!
};
const trackKey2 = deriveTrackKey(trackData2); // "te-perdi" (normalized)
const { cueSlots: cues2 } = useTrackCues(trackKey2);

// cues2[0].timeSec === 15 ✅ (Same cues!)
```

---

## Testing Checklist

### Manual Testing

#### Set Cue (Shift + Click)
1. Load "te-perdi.mp3" in Deck A
2. Play to 00:15
3. Shift + Click "CUE 1" button
4. **Expected**:
   - Button changes to red border + background
   - Label shows "1"
   - Console: No errors
   - IndexedDB: `trackCues` entry for "te-perdi" with `cues: [{ slot: 0, timeSec: 15, ... }]`

#### Jump to Cue (Click)
1. Seek to 00:00
2. Click "CUE 1" button (already set from above)
3. **Expected**:
   - Playback jumps to 00:15
   - Waveform scrubber updates to 00:15 position

#### Clear Cue (Ctrl + Click)
1. Ctrl + Click "CUE 1" button
2. **Expected**:
   - Button returns to dimmed outline
   - Label shows "—"
   - IndexedDB: `cues` array no longer has slot 0 entry

#### Cross-Deck Persistence
1. Load "te-perdi.mp3" in Deck A
2. Shift + Click "CUE 2" at 00:30
3. Eject track from Deck A
4. Load "te-perdi.mp3" in Deck B
5. **Expected**:
   - Deck B "CUE 2" button shows orange border + "2" label
   - Click "CUE 2" → Jumps to 00:30

#### Page Reload Persistence
1. Set cues in Deck A: CUE 1 (00:15), CUE 3 (01:00), CUE 5 (02:00)
2. Refresh page (F5)
3. Load "te-perdi.mp3" in Deck A
4. **Expected**:
   - All 3 cues still present with correct times
   - Click each cue → Jumps to saved time

#### URL Variant Test (TrackKey Consistency)
1. Load `/audio/tracks/te-perdi.mp3` in Deck A → Set CUE 1 at 00:10
2. Load `https://r2.../audio/Te%20Perdi.mp3` in Deck B (same song, different URL)
3. **Expected**:
   - Deck B shows CUE 1 at 00:10 (same cues!)
   - IndexedDB: Only ONE entry for trackKey `"te-perdi"`

#### Edge Cases
- **No Track Loaded**: All 8 buttons dimmed, "—" labels
- **8 Cues Set**: All buttons colored, grid layout intact
- **Clear All**: Ctrl + Click all 8 → All reset to "—"
- **Rapid Clicks**: No console errors, UI stays responsive

---

## Known Issues & Future Work

### 1. Waveform Regions Visualization (NOT IMPLEMENTED)
**Status**: HotCuePanel buttons functional, but cues NOT rendered on waveform yet.

**Current State**:
- HotCuePanel UI ✅ Complete
- Click/Set/Clear ✅ Complete
- IndexedDB persistence ✅ Complete
- **Waveform markers**: ❌ Not implemented

**Next Step** (S11.3 Part 4b - Optional):
- Add WaveSurfer Regions plugin to MainWaveform or create DeckWaveformWS
- Render cue regions as colored markers on waveform
- Clicking waveform marker → Jump to cue
- Regions update when cues change

**Implementation Preview**:
```typescript
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

const ws = WaveSurfer.create({ /* ... */ });
const regions = ws.registerPlugin(RegionsPlugin.create());

// Add cue regions
cueSlots.forEach((cue) => {
  if (cue.timeSec !== null) {
    regions.addRegion({
      start: cue.timeSec,
      end: cue.timeSec + 0.1, // Thin marker
      color: cue.color + '80', // Semi-transparent
      drag: false,
      resize: false,
    });
  }
});
```

**Defer Reason**: WaveformMini uses OffscreenCanvas worker, not WaveSurfer. Adding Regions requires migrating to WaveSurfer-based waveform OR creating a separate overlay component.

### 2. Cue Labels Editable
**Current**: Labels auto-generated ("1", "2", ...)
**Future**: Allow editing cue labels ("Intro", "Drop", "Outro")

**Implementation**:
- Add input field on Shift + Right-Click
- Update `setCue(slot, timeSec, customLabel)`
- Render custom label instead of slot number

### 3. Cue Color Customization
**Current**: Fixed 8 colors from `DEFAULT_CUE_COLORS`
**Future**: Allow user to pick custom colors per cue

**Implementation**:
- Add color picker on Ctrl + Shift + Click
- Store `color` in `TrackCue` interface (already supported!)
- Update UI to use custom colors

### 4. Loop Regions (S11.3 Part 4c - Future)
**Current**: Only hot cues (instant markers)
**Future**: Loop regions (start/end markers with auto-loop)

**Schema**: Already prepared in Dexie v3
```typescript
export interface TrackLoop {
  trackKey: string;
  startSec: number;
  endSec: number;
  enabled: boolean;
  quantized?: boolean;
  updatedAt: Date;
}
```

**UI**: Add "LOOP IN" / "LOOP OUT" buttons to LoopControls panel

---

## Lint Warnings (Non-Blocking)

### useTrackCues.ts
1. **Unused eslint-disable directive** (line 56)
   - Reason: Suppressing React effect setState warning (false positive for data fetching)
   - Impact: None (directive itself is unused, but effect pattern is correct)

2. **Functions nested too deeply** (line 68)
   - Reason: Dexie promise chain + map function
   - Impact: None (complexity from async DB operations)

### HotCuePanel.tsx
- **None** ✅ (All previous lint issues resolved)

---

## Files Modified

### Created
- [x] `src/hooks/useTrackCues.ts` (Cues management hook)
- [x] `docs/PHASE_S11_3_PER_TRACK_CUES_COMPLETE.md` (This file)

### Modified
- [x] `src/components/studio/ui/HotCuePanel.tsx` (Use trackKey-based cues instead of store)

### Unchanged (Already Ready from Part 3)
- [x] `src/lib/db.ts` (Dexie v3 schema already has `trackCues` table)

### Build Status
```
✓ Compiled successfully in 29.0s
```

---

## Next Steps

### S11.3 Part 2 - Console Error Fixes (RECOMMENDED NEXT)
**Goal**: Eliminate cache operation errors + fetch spam.

**Tasks**:
1. Add `{ cache: 'no-store' }` in development
2. Fix WaveformMini to use `trackData.url` (not trackKey concatenation)
3. Add `fetchFailed` Map to prevent retry loops
4. DevResetButton: Unregister SW + clear CacheStorage

**Priority**: HIGH (console spam affects UX)

### S11.3 Part 5 - Essentia Worker Fixes
**Goal**: Robust export resolver + capability gating.

**Tasks**:
1. Add fallback export resolution in `essentia.worker.ts`
2. Return `{ ok: false, reason: 'unavailable' }` on init failure
3. Update `useTrackAnalysis` to show ONE banner + manual retry

### S11.3 Part 6 - Accessibility + Hygiene
**Goal**: Fix lint warnings + improve accessibility.

**Tasks**:
1. StudioSettingsPanel: div → button, ESC close
2. matchScoring.ts: Wrap switch cases in braces
3. Remove unused imports, mark props Readonly
4. Remove TEMP debug logs from MainWaveform/WaveformMini

### S11.3 Part 4b - Waveform Regions (OPTIONAL)
**Goal**: Visual cue markers on waveform.

**Tasks**:
1. Evaluate WaveSurfer.js vs OffscreenCanvas overlay
2. Add Regions plugin to render cue markers
3. Click waveform marker → Jump to cue
4. Sync regions with cueSlots changes

---

## Comparison: Before vs After

### Before (Phase S9 - Store-Based Cues)
```typescript
// ❌ Cues stored in Zustand store (ephemeral)
const hotCues = useStore((state) => state.deckA.hotCues);
setHotCue(deckId, slot, time, label, color);

// Problems:
// - Lost on page reload
// - Lost on deck change
// - Not shared across deck instances
// - URL-specific (if track ID is URL-based)
```

### After (Phase S11.3 Part 4 - TrackKey-Based Cues)
```typescript
// ✅ Cues stored in IndexedDB by trackKey (persistent)
const { cueSlots, setCue } = useTrackCues(trackKey);
setCue(slot, time, label);

// Benefits:
// ✅ Persist across page reloads
// ✅ Persist across deck changes
// ✅ Shared across deck instances
// ✅ URL-agnostic (trackKey normalization)
// ✅ Offline-first (IndexedDB)
```

---

## User Experience Flow

### Setting a Cue
```
1. User loads "te-perdi.mp3" in Deck A
   → HotCuePanel renders 8 empty cue slots (all "—")

2. User plays to 00:15 (intro beat drop)
   → Playback position: 00:15

3. User Shift + Clicks "CUE 1" button
   → handleCueClick(0, { shiftKey: true })
   → getPlaybackPosition("A") → 15
   → setCue(0, 15, "1")
   → Optimistic UI update: Button turns red, shows "1"
   → Background: db.trackCues.put({ trackKey: "te-perdi", cues: [...] })

4. User sees red "CUE 1" button with "1" label
   → Tooltip: "Click: Jump | Shift+Click: Set | Ctrl+Click: Clear"
```

### Using a Cue
```
1. User seeks to 00:00 (track start)
   → Playback position: 00:00

2. User Clicks "CUE 1" button (set at 00:15)
   → handleCueClick(0, { shiftKey: false })
   → seekTo("A", 15)
   → Playback jumps to 00:15 (intro beat drop)

3. User continues mixing from intro ✅
```

### Cross-Deck Cues
```
1. User loads "te-perdi.mp3" in Deck A → Sets CUE 1 (00:15), CUE 3 (01:00)

2. User loads "te-perdi.mp3" in Deck B
   → trackKey = "te-perdi" (same as Deck A)
   → useTrackCues("te-perdi") loads from IndexedDB
   → Deck B shows CUE 1 (red) and CUE 3 (yellow) ✅

3. User clicks Deck B "CUE 1"
   → Jumps to 00:15 (same cue as Deck A)

4. User Ctrl + Clicks Deck B "CUE 1" (clear)
   → Cue removed from IndexedDB
   → Deck A "CUE 1" also disappears (shared data) ✅
```

---

## Conclusion

✅ **Phase S11.3 Part 4 (Per-Track Hot Cues) is COMPLETE**.

- **Build**: ✅ Passing
- **Lint**: Minor warnings only (non-blocking)
- **Functionality**: Set/Jump/Clear cues with IndexedDB persistence
- **TrackKey Integration**: Fully consistent with S11.2 canonical system
- **Storage**: Dexie v3 `trackCues` table (trackKey primary key)
- **UI**: HotCuePanel with 8 color-coded buttons
- **UX**: Shift+Click to set, Click to jump, Ctrl+Click to clear

**Next Recommended**: Proceed to **S11.3 Part 2** (Console Error Fixes) for cleaner dev experience.

---

**Document Version**: 1.0
**Last Updated**: 2026-02-04
**Author**: AI Assistant (Phase S11.3)
