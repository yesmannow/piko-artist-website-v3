# Phase 3.2: Frictionless "Load → Cue → Play" Workflow

**Date**: February 3, 2026
**Status**: 📋 Planning Complete - Ready for Implementation
**Priority**: 🔥 HIGH ROI - Targets most frequent DJ workflow

---

## Executive Summary

Phase 3.2 focuses on **the #1 workflow loop in DJ software**: quickly loading tracks onto decks. This is the foundation for all other DJ interactions (mixing, effects, stems, etc.). Professional DJ apps like djay Pro and VirtualDJ excel here with:
- One-click load operations
- Drag & drop track assignment
- Visual feedback that confirms success immediately

**Current State Analysis**:
✅ **Already Complete**:
- One-click "Load A" / "Load B" buttons in `TrackListing.tsx`
- Unified load API (`setDeckTrack` + audio engine `loadTrack`)
- Visual loading states (spinner + pulsing waveform)
- Track state indicators ("Loaded A" / "Loaded B")
- Mobile-friendly buttons (no drag/drop needed on touch)

❌ **Missing**:
- Drag & Drop from library → deck drop zones (desktop)
- Visual drop zone indicators when dragging
- Optional: Keyboard shortcuts (hotkeys for rapid loading)

---

## Phase 3.2 Deliverables

### 1. ✅ **One-Click Load** (ALREADY COMPLETE)
**Status**: ✅ Implemented in `TrackListing.tsx`

Every track row has:
- `Load A` button → loads track to Deck A
- `Load B` button → loads track to Deck B
- Visual feedback during load (spinner + animated waveform)
- State indicators when loaded ("Loaded A" border highlight)

**Evidence**:
```tsx
// src/components/studio/ui/TrackListing.tsx lines 238-266
<motion.button
  onClick={() => handleLoadTrack('A')}
  disabled={loadingDeck !== null}
  className={`flex-1 px-4 py-2 rounded-lg font-mono text-sm font-bold uppercase transition-colors ${
    isLoadedA
      ? 'bg-studio-cyan/20 border-2 border-studio-cyan text-studio-cyan'
      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
  } disabled:opacity-50 disabled:cursor-not-allowed`}
  whileHover={loadingDeck === null ? { scale: 1.02 } : {}}
  whileTap={loadingDeck === null ? { scale: 0.98 } : {}}
>
  {loadingDeck === 'A' ? 'Loading...' : isLoadedA ? 'Loaded A' : 'Load A'}
</motion.button>
```

**No action required** - this is production-ready.

---

### 2. ❌ **Drag & Drop: Track → Deck Zones** (IMPLEMENTATION NEEDED)

**Goal**: Desktop users can drag a track from the library and drop it onto a visual deck zone.

**User Flow**:
1. User starts dragging a track from library (cursor shows "dragging" state)
2. Deck zones highlight/pulse to indicate they're drop targets
3. User drops track on left zone → loads Deck A
4. User drops track on right zone → loads Deck B
5. Immediate visual feedback (same as button click)

**Technical Plan**:

#### A) Make `TrackListing` Draggable (Desktop Only)
```tsx
// Add to TrackListing.tsx
const [isDragging, setIsDragging] = useState(false);

const handleDragStart = (e: React.DragEvent) => {
  // Only allow drag on desktop
  if (window.innerWidth < 768) return;

  setIsDragging(true);
  e.dataTransfer.effectAllowed = 'copy';
  // Store track data for drop handler
  e.dataTransfer.setData('application/json', JSON.stringify({
    trackId: track.trackId,
    title: track.title,
    artist: track.artist,
    bpm: track.bpm,
    url: getLocalUrl(),
    // ... all track metadata
  }));
};

const handleDragEnd = () => {
  setIsDragging(false);
};

// Apply to main container:
<div
  className="glass-panel ..."
  draggable={true}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  style={{ opacity: isDragging ? 0.5 : 1 }}
>
```

#### B) Create Drop Zones in StudioGrid
**Location**: Desktop Pro layout in `StudioGrid.tsx`

**Option 1**: Row 2 (Performance/Mixer) has left/right deck control areas
**Option 2**: Row 1 (Waveforms) - drop directly onto waveform area

Recommended: **Row 2** - more natural for "deck assignment"

```tsx
// src/components/studio/layout/StudioGrid.tsx
// Add drop zones to PerformanceRow or create dedicated DeckDropZone component

const DeckDropZone = ({
  deckId,
  onDrop
}: {
  deckId: 'A' | 'B';
  onDrop: (trackData: any) => void;
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      const trackData = JSON.parse(data);
      onDrop(trackData);
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        absolute inset-0 pointer-events-none
        ${isOver ? 'pointer-events-auto' : ''}
      `}
    >
      {isOver && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border-4 border-dashed border-cyan-400 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-2">DECK {deckId}</div>
            <div className="text-sm text-white/80 font-mono">Drop to Load</div>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### C) Wire Drop Handler to Load Logic
```tsx
// In StudioGrid.tsx
const { loadTrack } = useAudioEngine();
const { setDeckTrack } = useStore();

const handleDeckDrop = async (deck: 'A' | 'B', trackData: any) => {
  try {
    // Reuse same load logic as TrackListing buttons
    await loadTrack(deck, trackData.url, trackData.bpm);
    setDeckTrack(deck, trackData);
    console.log(`[StudioGrid] Loaded ${trackData.title} on Deck ${deck} via drag/drop`);
  } catch (error) {
    console.error(`[StudioGrid] Drop load failed:`, error);
    alert(`Failed to load track: ${error.message}`);
  }
};

// Usage in render:
<PerformanceRow masterBus={...} masterPostFx={...}>
  <DeckDropZone deckId="A" onDrop={(data) => handleDeckDrop('A', data)} />
  <DeckDropZone deckId="B" onDrop={(data) => handleDeckDrop('B', data)} />
</PerformanceRow>
```

**Edge Cases to Handle**:
- Don't allow drag/drop while a track is currently loading
- Scroll container should not interfere with drag operation
- Mobile: disable drag (already handled by `window.innerWidth` check)
- Legacy layout: no drop zones (Pro layout only)

---

### 3. ✅ **Mobile-Friendly Load UX** (ALREADY SUFFICIENT)

**Status**: ✅ Current button-based approach works well for mobile

**Current Implementation**:
- Touch-friendly `Load A` / `Load B` buttons with ample tap targets
- No drag/drop needed (intentional - drag/drop is desktop-only UX pattern)
- Immediate visual feedback (same as desktop)

**Optional Enhancement** (Low Priority):
Could add a bottom sheet with deck chooser if user taps track row itself:
```
User taps track → Bottom sheet appears:
  "Load Track to..."
  [ Deck A ] [ Deck B ] [ Cancel ]
```

**Recommendation**: Skip for Phase 3.2. Current button approach is clean and direct. Bottom sheet adds complexity without clear UX win.

---

### 4. ✅ **Unified Load API** (ALREADY COMPLETE)

**Status**: ✅ Single source of truth via Zustand store

**Evidence**:
```typescript
// src/store/useStore.ts line 164
setDeckTrack: (deck, trackData) =>
  set((state) => {
    const deckKey = `deck${deck}`;
    const currentDeck = state[deckKey];
    return {
      [deckKey]: {
        ...currentDeck,
        trackData: trackData,
        trackId: trackData?.trackId ?? trackData?.url ?? null,
        playbackRate: trackData?.bpm ? state.masterBpm / trackData.bpm : 1,
        isLoaded: false, // Will be set to true after audio engine confirms load
      },
    };
  }),
```

**Key Architecture**:
- `useStore.setDeckTrack()` updates global deck state
- `useAudioEngine.loadTrack()` handles Tone.js player setup
- TrackListing, DeckControls, and any future load trigger all use same API
- Consistent `trackData.url` field ensures stem generation works

**No changes needed** - architecture is solid.

---

## Acceptance Criteria

| Criteria | Status | Notes |
|----------|--------|-------|
| ✅ Loading a track into Deck A/B takes one click (desktop) | ✅ PASS | `Load A` / `Load B` buttons in TrackListing |
| ❌ Drag/drop works on desktop without breaking scroll | ❌ TODO | Need to implement DeckDropZone + draggable TrackListing |
| ✅ Loading a track into Deck A/B takes one tap (mobile) | ✅ PASS | Same buttons work on touch |
| ✅ Loaded deck UI updates immediately | ✅ PASS | Visual state changes instantly |
| ✅ No regressions to Pro layout router | ✅ PASS | StudioPanels routing unchanged |
| ❌ `npm run build` passes | ⏳ N/A | Will verify after implementation |

---

## Implementation Checklist

### Phase 3.2A: Drag & Drop (1-2 hours)

1. **Create DeckDropZone Component**
   - [ ] New file: `src/components/studio/ui/DeckDropZone.tsx`
   - [ ] Props: `deckId`, `onDrop`, `children` (renders deck controls inside drop zone)
   - [ ] State: `isOver` (shows visual indicator when drag is over zone)
   - [ ] Handlers: `onDragOver`, `onDragLeave`, `onDrop`
   - [ ] Styling: Pulsing border + gradient overlay when `isOver === true`

2. **Make TrackListing Draggable**
   - [ ] Add `draggable={true}` to main container (desktop only)
   - [ ] `onDragStart`: Store track metadata in `e.dataTransfer`
   - [ ] `onDragEnd`: Reset drag state
   - [ ] Opacity fade during drag (UX clarity)

3. **Integrate Drop Zones into StudioGrid**
   - [ ] Import `DeckDropZone` in `StudioGrid.tsx`
   - [ ] Wrap deck control areas in Row 2 (PerformanceRow) with drop zones
   - [ ] Wire `onDrop` to `handleDeckDrop` function
   - [ ] Reuse existing `loadTrack` + `setDeckTrack` logic

4. **Testing**
   - [ ] Desktop: Drag track from library → drop on Deck A zone → track loads
   - [ ] Desktop: Drag track from library → drop on Deck B zone → track loads
   - [ ] Mobile: Verify drag is disabled (no `draggable` attribute)
   - [ ] Edge case: Drag while track is loading → no-op (button disabled state prevents this)
   - [ ] Legacy layout: No drop zones (only buttons work)

### Phase 3.2B: Optional Enhancements (Future)

- [ ] Keyboard shortcuts: `Shift+1` = Load selected track to Deck A, `Shift+2` = Load to Deck B
- [ ] Hotkey hints in UI (tooltip on track row: "Shift+1 / Shift+2")
- [ ] Mobile bottom sheet for "Load to..." chooser (only if user feedback requests it)
- [ ] Drag preview image (show track artwork during drag)

---

## Files to Modify

### New Files (1)
1. `src/components/studio/ui/DeckDropZone.tsx` (new component)

### Modified Files (2)
1. `src/components/studio/ui/TrackListing.tsx` (add `draggable` + drag handlers)
2. `src/components/studio/layout/StudioGrid.tsx` (integrate drop zones in Row 2)

**Total Changes**: ~150 lines of new code
**Estimated Time**: 1-2 hours
**Risk Level**: Low (isolated feature, no breaking changes)

---

## Why This Phase Matters

### User Impact
- **Faster workflow**: Drag/drop is 2-3x faster than "scroll to track → click Load A → scroll back" loop
- **Professional feel**: Matches expectations from Serato, Traktor, djay Pro
- **Reduced friction**: Every click/action saved = better live performance flow

### Technical Foundation
- **Stem pipeline readiness**: Reliable track loading is prerequisite for stem separation
- **Error surface reduction**: Single load API means fewer "why didn't this load" bugs
- **Mobile parity**: Touch-friendly buttons ensure mobile users aren't second-class

### 2026 Roadmap Enabler
Once load workflow is bulletproof:
- Phase 3.3: Cue points and hot cues (requires loaded tracks)
- Phase 3.4: Stem deck isolation (requires stable track state)
- Phase 4: Multi-deck mixing (requires proven load logic)

---

## Post-Implementation Validation

### Manual Testing Script
```
1. Open /studio in desktop browser (1920x1080)
2. Enable Pro complexity mode
3. Open Cloud Library (TrackLibrary panel)
4. Drag a track from library list
   → Expect: Cursor shows "copying" state, track row fades to 50% opacity
5. Hover over Deck A control area (left side of Row 2)
   → Expect: Drop zone highlights with pulsing border + "DECK A - Drop to Load" text
6. Release mouse (drop)
   → Expect: Track loads immediately, same as clicking "Load A" button
   → Expect: Deck waveform updates, jogwheel shows track title
7. Repeat for Deck B (right side drop zone)
8. Mobile test (iPhone/Android):
   → Expect: No drag cursor, track row is not draggable
   → Expect: "Load A" / "Load B" buttons still work perfectly
9. Legacy layout test:
   → Switch to Classic/Balanced complexity mode
   → Expect: No drop zones (StudioPanels renders legacy layout, not StudioGrid)
   → Expect: Library buttons still work
```

### Build Validation
```bash
npm run build
# Expect: ✓ Compiled successfully
```

---

## Success Metrics (Post-Launch)

After Phase 3.2 ships, measure:
- **Load time reduction**: Avg time from "see track in library" → "track playing" (target: <3 seconds)
- **Error rate**: % of load attempts that fail (target: <1%)
- **Drag vs. click ratio**: Desktop users prefer drag/drop? (hypothesis: 60% drag, 40% button)
- **Mobile satisfaction**: No regression in mobile UX (maintain current satisfaction)

---

## Next Steps

**After Phase 3.2 Complete**:
- **Phase 3.3**: Cue points and hot cues (one-click jump to chorus, drop, etc.)
- **Phase 3.4**: Stem deck isolation (vocal kill, drum solo, etc.)
- **Phase 3.5**: Waveform sync & beat matching visual aids

**Timeline**:
- Phase 3.2A (Drag/Drop): 1-2 hours
- Testing & QA: 30 mins
- Documentation: 15 mins
- **Total**: ~2-3 hours for complete Phase 3.2

---

**Phase 3.2 Plan Status**: 📋 Ready for Implementation
**Approval**: Awaiting go-ahead to proceed with coding

