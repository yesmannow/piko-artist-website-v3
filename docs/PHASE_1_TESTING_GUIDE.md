# Phase 1 - Performance Pads Testing Guide

**Date:** February 5, 2026
**Status:** Integration Complete - Ready for Manual Testing
**Integration:** ✅ Deck Component (Pro Mode Only)

---

## 🎯 Quick Start

### Prerequisites
1. Start development server: `npm run dev`
2. Open Studio: `http://localhost:3000/studio`
3. Load a track into Deck A or B
4. Ensure "Pro Mode" is active (Performance Pads only visible in Pro mode)

### Visual Location
The Performance Pad Grid appears **below** the Stem Performance Pads in the Deck component when:
- ✅ Track is loaded
- ✅ Pro mode is enabled (`complexityMode='pro'`)
- ✅ Browser DevTools Console open (for debugging)

---

## 🧪 Test Cases

### 1. Hot Cue Mode (Default)

#### Test 1.1: Set Hot Cue
**Steps:**
1. Click on **PAD MODE SELECTOR** → Ensure "Hot Cue" is active (red glow)
2. Start playback
3. Click an **empty pad** (gray, labeled 1-8)

**Expected:**
- ✅ Pad turns **red** with glowing shadow
- ✅ Current time appears below pad number (e.g., "1:23")
- ✅ Console log: `[useHotCues] Setting cue at slot X, time Y`
- ✅ IndexedDB `trackCues` table updated (check DevTools → Application → IndexedDB)

**Validation:**
```javascript
// Browser Console
const db = await indexedDB.open('PikoDJ', 3);
// Check trackCues table for your track
```

#### Test 1.2: Jump to Hot Cue
**Steps:**
1. Set a cue at 0:30 (see Test 1.1)
2. Seek track to 1:00
3. Click the **filled pad** (red, glowing)

**Expected:**
- ✅ Playback jumps to 0:30 instantly
- ✅ Pad briefly scales down (Framer Motion animation)
- ✅ Console log: `[useHotCues] Jumping to cue X at Y seconds`

#### Test 1.3: Delete Hot Cue
**Steps:**
1. Set a cue (see Test 1.1)
2. **Right-click** the filled pad

**Expected:**
- ✅ Pad turns gray (empty state)
- ✅ Time label disappears
- ✅ Console log: `[useHotCues] Deleting cue at slot X`
- ✅ IndexedDB updated (cue removed from array)

#### Test 1.4: Persistence Test
**Steps:**
1. Set 3 hot cues (pads 1, 3, 5)
2. Load a different track into the same deck
3. Re-load the original track

**Expected:**
- ✅ All 3 cues restored with correct times
- ✅ Pad colors match original slots
- ✅ Console log: `[useHotCues] Loaded X cues from IndexedDB`

---

### 2. Loop Mode

#### Test 2.1: Create Beat Loop
**Steps:**
1. Click **PAD MODE SELECTOR** → Select "Loop" (green icon)
2. Start playback at a known beat (e.g., first downbeat)
3. Click **"4 BEATS"** pad

**Expected:**
- ✅ Pad turns **green** with glowing shadow
- ✅ Looping starts immediately
- ✅ Loop duration = `(60 / BPM) * 4` seconds
- ✅ Console log: `[useLoops] Creating X-beat loop`
- ✅ Waveform shows loop region (if WaveSurfer integration active)

**Validation:**
- Play through loop → Should repeat seamlessly at beat boundaries

#### Test 2.2: Test All Loop Sizes
**Steps:**
Test each pad: **1/4, 1/2, 1, 2, 4, 8, 16, 32 BEATS**

**Expected for each:**
- ✅ Correct loop duration based on BPM
- ✅ Only one pad glows at a time (exclusive selection)
- ✅ Console shows beat calculation:
  ```
  beatDuration = 60 / bpm
  loopDuration = beatDuration * beats
  ```

#### Test 2.3: Toggle Loop On/Off
**Steps:**
1. Create 8-beat loop (see Test 2.1)
2. Click the **same pad again** (8 BEATS)

**Expected:**
- ✅ Loop disables (pad turns gray)
- ✅ Playback continues linearly (no looping)
- ✅ Console log: `[useLoops] Toggling loop`

#### Test 2.4: Loop Persistence
**Steps:**
1. Create 16-beat loop at 1:00
2. Switch to different track
3. Return to original track

**Expected:**
- ✅ Loop region restored (start/end seconds)
- ✅ **Loop is NOT active** (must re-enable)
- ✅ IndexedDB `trackLoops` table contains saved loop
- ✅ Console log: `[useLoops] Loaded loop from IndexedDB`

#### Test 2.5: Clear Loop (Right-Click)
**Steps:**
1. Create any loop
2. **Right-click** any pad in Loop mode

**Expected:**
- ✅ All pads turn gray
- ✅ Loop disabled
- ✅ Console log: `[useLoops] Clearing loop`

---

### 3. Slicer Mode

#### Test 3.1: Auto-Activate Slicer
**Steps:**
1. Click **PAD MODE SELECTOR** → Select "Slicer" (purple icon)
2. Track should be playing at a known position (e.g., 0:30)

**Expected:**
- ✅ All 8 pads turn **purple** immediately
- ✅ Each pad shows slice start time (e.g., "0:30", "0:31", etc.)
- ✅ Console log: `[useSlicer] Activating slicer with 8-beat region`
- ✅ Slice region = current time + (8 beats based on BPM)

**Validation:**
```
Slice duration per pad = (60 / BPM) * 8 / 8 = (60 / BPM)
Example: BPM 120 → 0.5s per slice
```

#### Test 3.2: Trigger Slices
**Steps:**
1. Activate Slicer (see Test 3.1)
2. Click **PAD 1** → Should jump to slice 0 start time
3. Click **PAD 5** → Should jump to slice 4 start time

**Expected for each click:**
- ✅ Playback jumps to slice start instantly
- ✅ Pad scales down briefly (animation)
- ✅ Console log: `[useSlicer] Triggering slice X at Y seconds`

#### Test 3.3: Slice Boundaries Test
**Steps:**
1. Activate slicer at 1:00 (BPM 128)
2. Click PAD 1, wait for slice to play
3. Should auto-loop within 8-beat region (or stop at end)

**Expected:**
- ✅ Each slice plays for exactly `(60/BPM)` seconds
- ✅ Slice boundaries align with beat grid
- ✅ No clicks/pops at slice boundaries

#### Test 3.4: Re-Activate Slicer
**Steps:**
1. Activate slicer at 0:30
2. Seek to 2:00
3. Switch to different mode, then back to Slicer

**Expected:**
- ✅ New slice region created at 2:00 (current position)
- ✅ Pad times update to new region
- ✅ Console log: `[useSlicer] Activating slicer...` (new region)

---

### 4. Beat Jump Mode

#### Test 4.1: Jump Backward
**Steps:**
1. Click **PAD MODE SELECTOR** → Select "Jump" (blue icon)
2. Start playback at 1:00
3. Click **← 4** pad (top-left, backward 4 beats)

**Expected:**
- ✅ Playback jumps to ~0:58 (depending on BPM)
- ✅ Calculation: `currentTime - (60/BPM * 4)`
- ✅ Console log: `[BeatJumpPads] Jumping -4 beats`
- ✅ Pad has **red border** (backward indicator)

#### Test 4.2: Test All Backward Jumps
**Steps:**
Test pads: **← 32, ← 16, ← 8, ← 4**

**Expected:**
- ✅ Each jump = `-(60/BPM * beats)` seconds
- ✅ Never jumps to negative time (clamps to 0:00)
- ✅ Red border on all backward pads

#### Test 4.3: Jump Forward
**Steps:**
1. Start at 0:30
2. Click **→ 4** pad (bottom-left, forward 4 beats)

**Expected:**
- ✅ Jumps to ~0:32 (BPM-dependent)
- ✅ Calculation: `currentTime + (60/BPM * 4)`
- ✅ Console log: `[BeatJumpPads] Jumping +4 beats`
- ✅ Pad has **blue border** (forward indicator)

#### Test 4.4: Test All Forward Jumps
**Steps:**
Test pads: **→ 4, → 8, → 16, → 32**

**Expected:**
- ✅ Each jump = `+(60/BPM * beats)` seconds
- ✅ Stops at track end (no overflow)
- ✅ Blue border on all forward pads

#### Test 4.5: Rapid Jumps
**Steps:**
1. Click **→ 4** 5 times rapidly

**Expected:**
- ✅ Position increases by `~(60/BPM * 4) * 5` seconds
- ✅ No console errors
- ✅ Smooth seeking (no audio glitches)

---

### 5. Pad Mode Selector

#### Test 5.1: Switch Between Modes
**Steps:**
1. Click each mode button: **Hot Cue → Loop → Slicer → Jump**

**Expected:**
- ✅ Active mode button glows with mode color:
  - Hot Cue: Red (#ef4444)
  - Loop: Green (#22c55e)
  - Slicer: Purple (#a855f7)
  - Jump: Blue (#3b82f6)
- ✅ Pad grid updates to show mode-specific pads
- ✅ Inactive buttons appear dim (opacity 0.6)

#### Test 5.2: Mode Icons
**Expected icons:**
- Hot Cue: `●` (filled circle)
- Loop: `⟲` (circular arrows)
- Slicer: `▮` (vertical bars)
- Jump: `⇄` (left-right arrows)

#### Test 5.3: Mode Persistence Per Deck
**Steps:**
1. Deck A → Set to "Loop" mode
2. Deck B → Set to "Slicer" mode
3. Switch between decks

**Expected:**
- ✅ Deck A stays in Loop mode
- ✅ Deck B stays in Slicer mode
- ✅ `usePadStore` maintains separate state per deck

---

### 6. Pad Visualizer (Optional UI Feature)

#### Test 6.1: Visual Feedback
**Steps:**
1. Click any pad in any mode

**Expected:**
- ✅ Ripple pulse effect emanates from center
- ✅ Active pad indicator shows "PAD X" in top-right
- ✅ Glowing dot pulses in mode color
- ✅ Background glow intensifies

#### Test 6.2: Pulse Timing
**Steps:**
1. Click pad 1, wait 0.3s, click pad 2

**Expected:**
- ✅ Both pulses visible simultaneously (stacking)
- ✅ Each pulse fades out after 0.6s
- ✅ No performance issues (Framer Motion AnimatePresence)

---

## 🔍 Integration Tests

### 7. Multi-Deck Isolation

#### Test 7.1: Independent Deck Modes
**Steps:**
1. Deck A → Hot Cue mode, set cue at slot 1
2. Deck B → Loop mode, create 8-beat loop
3. Switch between decks

**Expected:**
- ✅ Deck A shows hot cue pads (red)
- ✅ Deck B shows loop pads (green)
- ✅ No cross-deck state pollution

#### Test 7.2: Concurrent Playback
**Steps:**
1. Deck A → Playing with 4-beat loop
2. Deck B → Playing, trigger hot cue jump

**Expected:**
- ✅ Both decks operate independently
- ✅ No audio glitches
- ✅ Console logs distinguish by deck ID

---

### 8. Tone.js Integration

#### Test 8.1: Player Sync
**Steps:**
1. Open DevTools Console
2. Create hot cue at 1:00
3. Check console for Tone.Player method calls

**Expected logs:**
```javascript
[useHotCues] Setting cue...
player.immediate() // Gets current time
[useHotCues] Jumping to cue...
player.seek(60) // Seeks to 1:00
```

#### Test 8.2: Loop Integration
**Steps:**
1. Create 8-beat loop
2. Inspect Tone.Player properties in console:

**Expected:**
```javascript
player.loop = true
player.loopStart = X (start time in seconds)
player.loopEnd = Y (end time in seconds)
```

#### Test 8.3: No Playback Conflicts
**Steps:**
1. Create loop in Deck A
2. Create loop in Deck B
3. Play both simultaneously

**Expected:**
- ✅ Each deck loops independently
- ✅ No shared state between `player.current.A` and `player.current.B`

---

### 9. IndexedDB Persistence

#### Test 9.1: Inspect Database
**Steps:**
1. Open DevTools → Application → IndexedDB → PikoDJ (version 3)
2. Expand tables: `trackCues`, `trackLoops`, `waveformPeaks`

**Expected schema:**

**trackCues:**
```javascript
{
  trackKey: "artist-title-hash", // Canonical key
  cues: [
    { slot: 0, timeSec: 30.5, label: null, color: "#ef4444" },
    { slot: 2, timeSec: 65.2, label: null, color: "#eab308" }
  ],
  updatedAt: Date
}
```

**trackLoops:**
```javascript
{
  trackKey: "artist-title-hash",
  startSec: 60.0,
  endSec: 64.0,
  enabled: false,
  quantized: true,
  updatedAt: Date
}
```

#### Test 9.2: Data Integrity
**Steps:**
1. Set 3 cues in Deck A
2. Refresh page (F5)
3. Load same track

**Expected:**
- ✅ All 3 cues restored
- ✅ No duplicate cues
- ✅ Correct slot → cue number mapping (0-7 → 1-8)

---

### 10. Error Handling

#### Test 10.1: No Player Loaded
**Steps:**
1. Deck with no track loaded
2. Performance Pads should not render

**Expected:**
- ✅ No pads visible when `trackData` is null
- ✅ No console errors
- ✅ Graceful degradation

#### Test 10.2: Invalid BPM
**Steps:**
1. Load track with `bpm: null` or `bpm: 0`
2. Try creating beat loop

**Expected:**
- ✅ Loop pads disabled or fallback to default BPM (120)
- ✅ Console warning: `[useLoops] Invalid BPM`
- ✅ No crashes

#### Test 10.3: IndexedDB Unavailable
**Steps:**
1. Open DevTools → Application → Storage → IndexedDB
2. Delete "PikoDJ" database
3. Try setting hot cue

**Expected:**
- ✅ Cues work in-memory (ephemeral)
- ✅ Console warning: `[Dexie] Database not found`
- ✅ UI remains functional

---

## 📊 Performance Benchmarks

### 11. Performance Tests

#### Test 11.1: Pad Click Latency
**Metric:** Time from click to audio action

**Steps:**
1. Set hot cue at 1:00
2. Click pad, measure response time

**Expected:**
- ✅ < 50ms latency (instant feel)
- ✅ No visual lag in Framer Motion animation

#### Test 11.2: Mode Switching Speed
**Steps:**
1. Rapidly switch between all 4 modes

**Expected:**
- ✅ Instant re-render (< 100ms)
- ✅ No dropped frames
- ✅ Smooth pad grid transitions

#### Test 11.3: IndexedDB Write Performance
**Steps:**
1. Set 8 hot cues rapidly (spam click)

**Expected:**
- ✅ All writes succeed
- ✅ No "quota exceeded" errors
- ✅ < 200ms per write operation

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Slicer Mode:** No visual waveform markers (planned for Phase 2)
2. **MIDI Support:** Not yet implemented (Phase 3)
3. **Keyboard Shortcuts:** Not yet mapped (1-8 keys for pads)
4. **Undo/Redo:** Not available for cue/loop edits

### Expected Warnings (Non-Blocking)
- ESLint: `Unexpected any` for Tone.Player type casting
- ESLint: `setState in useEffect` for slicer auto-activation
- Function complexity warnings in Deck.tsx (pre-existing)

---

## ✅ Test Completion Checklist

Use this checklist to track testing progress:

- [ ] **Hot Cue Mode**
  - [ ] Set cue
  - [ ] Jump to cue
  - [ ] Delete cue
  - [ ] Persistence test

- [ ] **Loop Mode**
  - [ ] Create 4/8/16/32 beat loops
  - [ ] Toggle loop on/off
  - [ ] Loop persistence
  - [ ] Clear loop (right-click)

- [ ] **Slicer Mode**
  - [ ] Auto-activation
  - [ ] Trigger slices
  - [ ] Slice boundary alignment
  - [ ] Re-activate at new position

- [ ] **Beat Jump Mode**
  - [ ] Jump backward (4/8/16/32)
  - [ ] Jump forward (4/8/16/32)
  - [ ] Boundary clamping (0 to track end)

- [ ] **Mode Selector**
  - [ ] Switch between modes
  - [ ] Visual feedback (glows)
  - [ ] Per-deck mode independence

- [ ] **Integration**
  - [ ] Multi-deck isolation
  - [ ] Tone.js player sync
  - [ ] IndexedDB persistence
  - [ ] Error handling

- [ ] **Performance**
  - [ ] < 50ms pad click latency
  - [ ] Smooth mode transitions
  - [ ] No audio glitches

---

## 📝 Bug Report Template

If you find issues, use this template:

```markdown
**Bug:** [Short description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**


**Actual Behavior:**


**Console Logs:**
```
[Paste relevant logs]
```

**Environment:**
- Browser:
- OS:
- Track BPM:
- Deck: A / B
```

---

## 🚀 Next Steps After Testing

1. **File bug reports** for any failures
2. **Document edge cases** discovered during testing
3. **Collect performance metrics** for optimization
4. **User feedback** from DJ testing sessions
5. **Plan Phase 2** enhancements:
   - MIDI controller mapping
   - Keyboard shortcuts (1-8 keys)
   - Waveform markers for cues/loops
   - Visual slice indicators
   - Color customization for cues
   - Multi-select operations

---

**Tester:** _________________
**Date:** _________________
**Status:** _________________
**Notes:** _________________
