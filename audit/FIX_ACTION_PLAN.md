# 🎯 Immediate Fix Action Plan

## Top 5 Critical Files to Fix NOW

### 1. 🔥 Deck.tsx - THE MONSTER
**Current State:**
- 614 lines (4x over limit)
- Complexity: 72 (5x over limit)
- Cognitive Complexity: 46 (2.3x over limit)

**Strategy: Split into 6 files**

#### Step 1: Extract Custom Hooks (4 hours)
Create `hooks/useDeckAudio.ts`:
```tsx
export function useDeckAudio(deckId: string) {
  // Move all audio engine logic here
  // - Deck channel management
  // - Audio loading
  // - Playback control
  // - Stem management
}
```

Create `hooks/useDeckSync.ts`:
```tsx
export function useDeckSync(deckId: string, bpm: number) {
  // Move sync logic
  // - BPM detection
  // - Beat grid
  // - Sync state
}
```

Create `hooks/useDeckWaveform.ts`:
```tsx
export function useDeckWaveform(audioBuffer: AudioBuffer) {
  // Move waveform logic
  // - Waveform data
  // - Seeking
  // - Position tracking
}
```

#### Step 2: Extract UI Components (6 hours)
Create `components/deck/DeckTransport.tsx`:
```tsx
// Play/pause, cue, loop controls
export function DeckTransport({ ... }) { }
```

Create `components/deck/DeckWaveformDisplay.tsx`:
```tsx
// Waveform visualization only
export function DeckWaveformDisplay({ ... }) { }
```

Create `components/deck/DeckInfo.tsx`:
```tsx
// Track info, BPM, key display
export function DeckInfo({ ... }) { }
```

#### Step 3: Simplified Deck.tsx (2 hours)
```tsx
export function Deck({ deckId }: DeckProps) {
  const audio = useDeckAudio(deckId);
  const sync = useDeckSync(deckId, audio.bpm);
  const waveform = useDeckWaveform(audio.buffer);

  return (
    <div>
      <DeckInfo track={audio.track} />
      <DeckWaveformDisplay waveform={waveform} />
      <DeckTransport controls={audio.controls} />
    </div>
  );
}
```

**Result:** 614 lines → 6 files of ~100 lines each
**Complexity:** 72 → <15 per file

---

### 2. 🔥 FXRack.tsx - CRITICAL ERROR
**Current State:**
- 8 runtime errors (component in render)
- 188 lines

**Fix: 30 minutes**

Create `components/fx/MacroKnob.tsx`:
```tsx
interface MacroKnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

export function MacroKnob({ label, value, onChange, color }: MacroKnobProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((v: number) => {
    setLocalValue(v);
    onChange(v);
  }, [onChange]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Knob
        value={localValue}
        onChange={handleChange}
        min={0}
        max={1}
        color={color}
        size="md"
      />
      <div className="text-xs font-mono uppercase text-white/70">{label}</div>
    </div>
  );
}
```

Update `FXRack.tsx`:
```tsx
import { MacroKnob } from './MacroKnob';

export function FXRack() {
  // ... state ...

  return (
    <GlassPanel depth="mixer" className="p-4 rounded-lg">
      <div className="grid grid-cols-3 gap-4">
        <MacroKnob
          label="Bitcrush"
          value={bitcrushMacro}
          onChange={(value) => setFxRack({ bitcrush: value })}
          color="#ef4444"
        />
        {/* etc */}
      </div>
    </GlassPanel>
  );
}
```

**Result:** 8 errors → 0 errors, better performance

---

### 3. 🔥 DeckGrid.tsx - EFFECT ISSUES
**Current State:**
- 3 setState in useEffect errors
- 208 lines

**Fix: 2 hours**

**Problem 1: Line 73**
```tsx
// BEFORE (WRONG)
useEffect(() => {
  const channel = getDeckChannel(deckId);
  setDeckChannel(channel);
}, [deckId, getDeckChannel]);

// AFTER (CORRECT)
const deckChannel = useMemo(() => {
  return getDeckChannel(deckId);
}, [deckId, getDeckChannel]);
```

**Problem 2: Line 263**
```tsx
// BEFORE (WRONG)
useEffect(() => {
  const channel = getMasterChannel();
  setMasterChannel(channel);
}, [getMasterChannel]);

// AFTER (CORRECT)
const masterChannel = useMemo(() => {
  return getMasterChannel();
}, [getMasterChannel]);
```

**Problem 3: Line 276**
```tsx
// BEFORE (WRONG)
useEffect(() => {
  if (recordingBlob) {
    setIsExportOpen(true);
  }
}, [recordingBlob]);

// AFTER (CORRECT - effect for side effects only)
const isExportOpen = Boolean(recordingBlob);

// OR if you need to track manual open/close:
const [manuallyClosedExport, setManuallyClosedExport] = useState(false);
const isExportOpen = Boolean(recordingBlob) && !manuallyClosedExport;
```

**Result:** 3 errors → 0 errors, better performance

---

### 4. 🔥 Fader.tsx & Knob.tsx - CALLBACK ORDER
**Current State:**
- 2 immutability errors
- Forward reference issues

**Fix: 15 minutes each**

**Fader.tsx Fix:**
```tsx
// Reorder: declare handlePointerUp BEFORE it's used
const handlePointerMove = useCallback(
  (event: PointerEvent) => {
    if (!draggingRef.current) return;

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = event.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, 1 - y / rect.height));
    onChange(ratio);
  },
  [onChange]
);

const handlePointerUp = useCallback(
  (event: PointerEvent) => {
    draggingRef.current = false;
    setIsEngaged(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    trackRef.current?.releasePointerCapture?.(event.pointerId);
  },
  [handlePointerMove]
);

const handlePointerDown = useCallback(
  (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    draggingRef.current = true;
    setIsEngaged(true);
    trackRef.current?.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  },
  [disabled, handlePointerMove, handlePointerUp]
);
```

**Knob.tsx:** Same pattern

**Result:** 2 errors → 0 errors

---

### 5. 🔥 WaveformMini.tsx - HIGH COMPLEXITY
**Current State:**
- 316 lines
- Cognitive complexity: 27
- Cyclomatic complexity: 19
- Max depth: 5

**Strategy: Extract into hooks**

Create `hooks/useWaveformData.ts`:
```tsx
export function useWaveformData(audioBuffer: AudioBuffer | null) {
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);

  useEffect(() => {
    if (!audioBuffer) return;

    const processWaveform = async () => {
      // Extract complex waveform processing logic here
      const data = await generateWaveformData(audioBuffer);
      setWaveformData(data);
    };

    processWaveform();
  }, [audioBuffer]);

  return waveformData;
}
```

Create `hooks/useWaveformCanvas.ts`:
```tsx
export function useWaveformCanvas(
  canvasRef: RefObject<HTMLCanvasElement>,
  waveformData: Float32Array | null,
  progress: number
) {
  useEffect(() => {
    // Extract canvas drawing logic here
    drawWaveform(canvasRef.current, waveformData, progress);
  }, [canvasRef, waveformData, progress]);
}
```

Simplified `WaveformMini.tsx`:
```tsx
export function WaveformMini({ audioBuffer, progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformData = useWaveformData(audioBuffer);
  useWaveformCanvas(canvasRef, waveformData, progress);

  return <canvas ref={canvasRef} />;
}
```

**Result:** 316 lines → 100 lines, complexity <10

---

## Implementation Order

### Day 1 (4 hours)
1. ✅ Fix FXRack.tsx (30 min) - CRITICAL ERROR
2. ✅ Fix Fader.tsx (15 min) - ERROR
3. ✅ Fix Knob.tsx (15 min) - ERROR
4. ✅ Fix DeckGrid.tsx (2 hours) - 3 ERRORS
5. ✅ Fix remaining setState errors (1 hour) - 4 MORE ERRORS

**Result: 18 errors → 0 errors**

### Day 2-3 (12 hours)
6. ✅ Refactor Deck.tsx - Extract hooks (4 hours)
7. ✅ Refactor Deck.tsx - Split components (6 hours)
8. ✅ Refactor Deck.tsx - Integration (2 hours)

**Result: Biggest complexity reduced by 80%**

### Day 4 (6 hours)
9. ✅ Refactor WaveformMini.tsx (4 hours)
10. ✅ Refactor TrackListing.tsx (2 hours)

**Result: 4 more complex files fixed**

### Day 5 (4 hours)
11. ✅ Clean up unused variables (1 hour)
12. ✅ Fix TypeScript `any` types (2 hours)
13. ✅ Final testing (1 hour)

**Total: 26 hours over 1 week**

---

## Testing Strategy

### After Each Fix
```bash
# Run ESLint on specific file
npx eslint src/components/studio/ui/Deck.tsx

# Run type check
npm run build

# Run unit tests (if any)
npm run test:unit

# Manual testing in browser
npm run dev
```

### After All Fixes
```bash
# Full audit
npm run audit:all

# Full build
npm run build

# E2E tests
npm run test:e2e
```

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Total Errors | 18 | 0 | ✅ 100% |
| Deck.tsx Lines | 614 | ~120 | ✅ 80% |
| Deck.tsx Complexity | 72 | <15 | ✅ 79% |
| Files Over 150 Lines | 10 | 2 | ✅ 80% |
| Avg Complexity | 28 | <12 | ✅ 57% |

---

## Quick Reference Commands

```bash
# Check specific file
npx eslint src/components/studio/ui/Deck.tsx

# Check all studio files
npm run audit:studio

# Full audit
npm run audit:all

# Build test
npm run build
```
