# 🚀 Phase 1 Quick Start Guide

**Generated:** February 4, 2026
**Phase:** Performance Pads System
**Files Created:** 16 skeleton files
**Status:** ✅ Ready for Implementation

---

## ✅ What Just Happened

The CLI automation tool generated **16 skeleton files** for Phase 1:

### 📁 Components (7 files)
- `src/components/studio/pads/PerformancePadGrid.tsx` - Main 8-pad grid
- `src/components/studio/pads/PadModeSelector.tsx` - Mode switcher UI
- `src/components/studio/pads/HotCuePads.tsx` - Hot cue mode
- `src/components/studio/pads/LoopPads.tsx` - Loop mode
- `src/components/studio/pads/SlicerPads.tsx` - Slicer mode
- `src/components/studio/pads/BeatJumpPads.tsx` - Beat jump mode
- `src/components/studio/pads/PadVisualizer.tsx` - Visual feedback

### 🎣 Hooks (3 files)
- `src/hooks/audio/useHotCues.ts` - Hot cue management
- `src/hooks/audio/useLoops.ts` - Loop logic
- `src/hooks/audio/useSlicer.ts` - Slicer engine

### 🎵 Audio Engine (3 files)
- `src/audio/performance/CueEngine.ts` - Cue point logic
- `src/audio/performance/LoopEngine.ts` - Loop management
- `src/audio/performance/SlicerEngine.ts` - Beat slicing

### 💾 Database (2 files)
- `src/lib/db/cues.ts` - Hot cues storage (Dexie)
- `src/lib/db/loops.ts` - Loops storage (Dexie)

### 🗄️ Store (1 file)
- `src/store/usePadStore.ts` - Pad mode state

---

## 🎯 Implementation Order (Recommended)

### Week 1-2: Hot Cues Foundation
1. **Implement `CueEngine.ts`** (Tone.js cue jump logic)
2. **Implement `src/lib/db/cues.ts`** (Dexie table schema)
3. **Implement `useHotCues.ts`** (hook combining CueEngine + Dexie)
4. **Implement `HotCuePads.tsx`** (8-button UI)
5. **Integrate into `Deck.tsx`**

### Week 2-3: Loop Pads
6. **Implement `LoopEngine.ts`** (Tone.js loop logic)
7. **Implement `src/lib/db/loops.ts`** (saved loops)
8. **Implement `useLoops.ts`** (loop management hook)
9. **Implement `LoopPads.tsx`** (4/8/16/32 beat buttons)

### Week 3-4: Pad Mode System
10. **Implement `usePadStore.ts`** (mode state: Hot Cue/Loop/Slicer)
11. **Implement `PadModeSelector.tsx`** (mode switcher UI)
12. **Implement `PerformancePadGrid.tsx`** (main grid + mode logic)

### Week 4-5: Slicer Mode
13. **Implement `SlicerEngine.ts`** (beat slice logic)
14. **Implement `useSlicer.ts`** (slicer hook)
15. **Implement `SlicerPads.tsx`** (8-slice UI)

### Week 5-6: Beat Jump & Visuals
16. **Implement `BeatJumpPads.tsx`** (jump buttons)
17. **Implement `PadVisualizer.tsx`** (Framer Motion feedback)
18. **Polish & Test**

---

## 🤖 Using Copilot to Implement

### Step 1: Implement CueEngine.ts

**In VS Code Copilot Chat:**
```
@workspace Implement src/audio/performance/CueEngine.ts

Requirements:
- Use Tone.js to jump to cue points
- Support 8 cues per deck
- Method: setCue(time: number)
- Method: jumpToCue(cueNumber: number)
- Method: deleteCue(cueNumber: number)
- Store cue times in memory (not Dexie - that's in the hook)
- Follow architecture: Tone.js only, no WaveSurfer playback

Reference existing code:
- src/hooks/audio/useAudioEngine.ts (Tone.js patterns)
- src/audio/routing.ts (if exists)
```

### Step 2: Implement Dexie Table

**Copilot Chat:**
```
@workspace Implement src/lib/db/cues.ts

Requirements:
- Add Dexie table for hot cues
- Schema: { trackKey: string, cueNumber: number, time: number, color?: string, updatedAt: number }
- Index on trackKey
- Must update src/lib/db/client.ts to register table
- Use canonical trackKey (not URLs)

Reference:
- src/lib/db/client.ts (existing Dexie setup)
- docs/ARCHITECTURE.md (trackKey rules)
```

### Step 3: Implement useHotCues Hook

**Copilot Chat:**
```
@workspace Implement src/hooks/audio/useHotCues.ts

Requirements:
- Hook signature: useHotCues(deckId: 'A' | 'B', trackKey?: string)
- Load cues from Dexie when trackKey changes
- Return: { cues: Cue[], setCue, jumpToCue, deleteCue }
- Integrate with CueEngine for audio playback
- Use useAudioEngine hook to get current Tone.js player

Reference:
- src/hooks/audio/useAudioEngine.ts
- src/lib/db/cues.ts (just implemented)
- src/audio/performance/CueEngine.ts (just implemented)
```

### Step 4: Implement HotCuePads UI

**Copilot Chat:**
```
@workspace Implement src/components/studio/pads/HotCuePads.tsx

Requirements:
- 8 buttons in 2 rows (4x2 grid)
- Click empty pad: Set cue at current time
- Click filled pad: Jump to cue
- Right-click pad: Delete cue
- Visual state: empty (gray), filled (blue)
- Show cue number on each pad
- Touch-friendly (min 48px)
- Use useHotCues hook
- Haptic feedback on interactions

Reference:
- src/components/studio/stems/StemPads.tsx (existing pad UI)
- src/hooks/audio/useHotCues.ts (just implemented)
```

---

## 🔧 Manual Integration Steps

### 1. Update Dexie Schema

**File: `src/lib/db/client.ts`**

Add to version schema:
```typescript
db.version(X).stores({
  // ... existing tables
  cues: 'trackKey, cueNumber, time, updatedAt',
  loops: 'trackKey, loopNumber, startTime, endTime, updatedAt',
});
```

### 2. Integrate into Deck Component

**File: `src/components/studio/deck/Deck.tsx`**

Add pad grid:
```tsx
import { PerformancePadGrid } from '@/components/studio/pads/PerformancePadGrid';

export function Deck({ deckId }: DeckProps) {
  // ... existing code

  return (
    <div className="deck-container">
      {/* Existing waveform, controls, etc. */}

      {/* NEW: Performance Pads */}
      <PerformancePadGrid deckId={deckId} />
    </div>
  );
}
```

### 3. Add Keyboard Shortcuts

**File: `src/hooks/useKeyboardShortcuts.ts`** (or create if missing)

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Deck A hot cues: 1-8
    if (e.key >= '1' && e.key <= '8' && !e.metaKey && !e.ctrlKey) {
      const cueNum = parseInt(e.key);
      // Trigger hot cue
      hotCues.jumpToCue(cueNum);
    }

    // Deck B hot cues: Shift+1-8
    if (e.key >= '1' && e.key <= '8' && e.shiftKey) {
      const cueNum = parseInt(e.key);
      // Trigger deck B hot cue
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## 🧪 Testing Checklist

### Unit Tests (Vitest)

Create: `src/audio/performance/__tests__/CueEngine.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { CueEngine } from '../CueEngine';

describe('CueEngine', () => {
  it('should set and retrieve cue points', () => {
    const engine = new CueEngine();
    engine.setCue(1, 30.5);
    expect(engine.getCue(1)).toBe(30.5);
  });

  it('should support 8 cues', () => {
    const engine = new CueEngine();
    for (let i = 1; i <= 8; i++) {
      engine.setCue(i, i * 10);
    }
    expect(engine.getCue(8)).toBe(80);
  });
});
```

### Integration Tests

1. **Manual Testing:**
   - Load a track
   - Click pad to set cue
   - Click pad again to jump
   - Right-click to delete
   - Verify cues persist after track reload

2. **E2E Testing (Playwright):**
   - Navigate to /studio
   - Load track to Deck A
   - Set 8 hot cues
   - Jump to each cue
   - Verify audio position changes

---

## 🚦 Build Verification

Run after each implementation:

```bash
# 1. Validate architecture
npm run validate:arch src/components/studio/pads/

# 2. Type check
npm run build

# 3. Lint
npm run lint

# 4. Run tests
npm run test:unit
```

---

## 📊 Progress Tracking

Use this checklist:

- [ ] Week 1: CueEngine.ts implemented
- [ ] Week 1: cues.ts Dexie table added
- [ ] Week 1: useHotCues.ts hook working
- [ ] Week 2: HotCuePads.tsx UI complete
- [ ] Week 2: Integration into Deck.tsx
- [ ] Week 2: Keyboard shortcuts added
- [ ] Week 3: LoopEngine.ts implemented
- [ ] Week 3: useLoops.ts hook working
- [ ] Week 3: LoopPads.tsx UI complete
- [ ] Week 4: usePadStore.ts state management
- [ ] Week 4: PadModeSelector.tsx switcher
- [ ] Week 4: PerformancePadGrid.tsx main grid
- [ ] Week 5: SlicerEngine.ts implemented
- [ ] Week 5: SlicerPads.tsx UI complete
- [ ] Week 6: BeatJumpPads.tsx implemented
- [ ] Week 6: PadVisualizer.tsx animations
- [ ] Week 6: Polish & full testing

---

## 💡 Pro Tips

### 1. **Use Copilot Iteratively**
Don't ask for entire files at once. Break it down:
- First: Basic structure
- Then: Core logic
- Finally: Polish & error handling

### 2. **Reference Existing Code**
Always point Copilot to similar code:
- "Like StemPads.tsx but for hot cues"
- "Use same pattern as useAudioEngine.ts"

### 3. **Validate Early**
Run `npm run validate:arch` after each file to catch issues immediately.

### 4. **Test Incrementally**
Don't wait until Phase 1 is complete. Test hot cues first, then loops, etc.

### 5. **Use GitHub Issues**
```bash
npm run generate:issues
```
This creates issues for all phases with checklists!

---

## 🆘 Troubleshooting

### Issue: "Tone.js player not found"
**Solution:** Make sure useAudioEngine hook is initialized before useHotCues

### Issue: "Cues not persisting"
**Solution:** Check trackKey normalization - make sure you're using canonical trackKey, not full URLs

### Issue: "Build fails with import errors"
**Solution:** Run `npm run build` to see exact error. Copilot may have used wrong import paths.

### Issue: "Pads don't respond to clicks"
**Solution:** Check z-index and pointer-events in CSS. Ensure buttons aren't covered.

---

## 📚 Resources

- **Roadmap:** `docs/DEVELOPMENT_ROADMAP_2026.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`
- **Tone.js Docs:** https://tonejs.github.io/
- **Dexie Docs:** https://dexie.org/

---

## 🎉 What's Next?

After Phase 1 is complete:

1. **Generate Phase 2:**
   ```bash
   npm run generate:phase phase2-sampler
   ```

2. **Repeat the process** with sampler components

3. **Celebrate!** 🎊 You'll have a professional DJ pad system!

---

**Let's build the future of web-based DJing! 🚀**
